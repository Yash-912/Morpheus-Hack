// ============================================================
// Webhooks Controller — Razorpay payout events, WhatsApp messages
// ============================================================

const crypto = require('crypto');
const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');
const NotificationService = require('../services/notification.service');

const webhooksController = {
  /**
   * Stripe Webhook
   * Validates raw body signature and processes payment intents.
   */
  async stripe(req, res, next) {
    const StripeService = require('../services/stripe.service');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers['stripe-signature'];

    if (!signature || !webhookSecret) {
      return res.status(401).json({ error: 'Missing Stripe webhook secret or signature' });
    }

    let event;
    try {
      event = StripeService.constructEvent(req.body, signature, webhookSecret);
    } catch (err) {
      logger.error('Stripe webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info('Stripe webhook received', { type: event.type });

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const { jobId, payerId } = paymentIntent.metadata || {};
      const amount = paymentIntent.amount; // in paise

      if (payerId) {
        try {
          // Increment wallet balances on User model
          await prisma.user.update({
            where: { id: payerId },
            data: {
              walletBalance: { increment: amount },
              walletLifetimeEarned: { increment: amount }
            }
          });
          logger.info('Wallet credited via Stripe webhook', { userId: payerId, amount });

          await NotificationService.send(payerId, {
            type: 'payment_received',
            title: 'Payment Received',
            body: `₹${(amount / 100).toFixed(2)} has been added to your wallet.`,
            channel: ['push', 'in_app'],
          });
        } catch (dbErr) {
          logger.error('Failed to update wallet in Stripe webhook:', dbErr);
        }
      }
    }

    res.json({ received: true });
  },

  /**
   * POST /api/webhooks/razorpay
   * Razorpay payout webhook — verifies HMAC, handles events.
   */
  async razorpay(req, res, next) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        return res.status(401).json({
          success: false,
          error: { code: 'SIGNATURE_MISSING', message: 'Webhook signature missing' },
        });
      }

      // HMAC SHA256 verification
      const body = JSON.stringify(req.body);
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        logger.warn('Razorpay webhook signature mismatch');
        return res.status(401).json({
          success: false,
          error: { code: 'SIGNATURE_INVALID', message: 'Invalid webhook signature' },
        });
      }

      const { event, payload } = req.body;
      const payoutEntity = payload?.payout?.entity;

      if (!payoutEntity) {
        logger.warn('Razorpay webhook: no payout entity in payload', { event });
        return res.status(200).json({ success: true, message: 'Acknowledged' });
      }

      const referenceId = payoutEntity.reference_id; // Our payout ID
      const razorpayPayoutId = payoutEntity.id;

      logger.info('Razorpay webhook received', { event, referenceId, razorpayPayoutId });

      // Find our payout record
      const payout = referenceId
        ? await prisma.payout.findUnique({ where: { id: referenceId } })
        : null;

      if (!payout) {
        logger.warn('Razorpay webhook: payout not found', { referenceId });
        return res.status(200).json({ success: true, message: 'Acknowledged' });
      }

      switch (event) {
        case 'payout.processed': {
          await prisma.payout.update({
            where: { id: payout.id },
            data: {
              status: 'completed',
              completedAt: new Date(),
              razorpayPayoutId: razorpayPayoutId,
            },
          });

          // Notify user
          await NotificationService.sendNotification(payout.userId, {
            type: 'payout',
            title: 'Payout Successful',
            body: `₹${(Number(payout.amount) / 100).toFixed(2)} has been sent to your account.`,
          }, ['push', 'in_app']);

          logger.info('Payout completed', { payoutId: payout.id });
          break;
        }

        case 'payout.reversed': {
          // Refund the amount back to wallet
          await prisma.$transaction(async (tx) => {
            await tx.payout.update({
              where: { id: payout.id },
              data: { status: 'reversed', razorpayPayoutId: razorpayPayoutId },
            });

            await tx.user.update({
              where: { id: payout.userId },
              data: { walletBalance: { increment: payout.amount } },
            });
          });

          await NotificationService.sendNotification(payout.userId, {
            type: 'payout',
            title: 'Payout Reversed',
            body: `₹${(Number(payout.amount) / 100).toFixed(2)} payout was reversed. Amount refunded to wallet.`,
          }, ['push', 'in_app']);

          logger.warn('Payout reversed', { payoutId: payout.id });
          break;
        }

        case 'payout.failed': {
          // Refund the amount back to wallet
          await prisma.$transaction(async (tx) => {
            await tx.payout.update({
              where: { id: payout.id },
              data: {
                status: 'failed',
                failureReason: payoutEntity.failure_reason || 'Unknown failure',
                razorpayPayoutId: razorpayPayoutId,
              },
            });

            await tx.user.update({
              where: { id: payout.userId },
              data: { walletBalance: { increment: payout.amount } },
            });
          });

          await NotificationService.sendNotification(payout.userId, {
            type: 'payout',
            title: 'Payout Failed',
            body: `Payout of ₹${(Number(payout.amount) / 100).toFixed(2)} failed. Amount refunded to wallet.`,
          }, ['push', 'in_app']);

          logger.error('Payout failed', {
            payoutId: payout.id,
            reason: payoutEntity.failure_reason,
          });
          break;
        }

        default:
          logger.info('Razorpay webhook: unhandled event', { event });
      }

      // Always return 200 to Razorpay
      res.status(200).json({ success: true, message: 'Processed' });
    } catch (error) {
      // Still return 200 to prevent Razorpay retries on our errors
      logger.error('Razorpay webhook error', { error: error.message });
      res.status(200).json({ success: true, message: 'Acknowledged with error' });
    }
  },

  /**
   * GET /api/webhooks/whatsapp
   * Meta webhook verification — returns hub.challenge if verify token matches.
   */
  async whatsappVerify(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === verifyToken) {
      logger.info('WhatsApp webhook verified successfully');
      return res.status(200).send(challenge);
    }

    logger.warn('WhatsApp webhook verification failed', { mode, tokenMatch: token === verifyToken });
    return res.status(403).json({ error: 'Verification failed' });
  },

  /**
   * POST /api/webhooks/whatsapp
   * WhatsApp / Meta Business API webhook receiver.
   */
  async whatsapp(req, res, next) {
    try {
      // ── Twilio vs Meta Payload Detection ──
      const isTwilio = req.body && req.body.From && req.body.Body;
      const hubSignature = req.headers['x-hub-signature-256'];

      // Only verify Meta signatures if it's not a Twilio payload
      if (!isTwilio && process.env.WHATSAPP_APP_SECRET) {
        if (!hubSignature) {
          // Allow pass through if this is a generic ping, but warn
          logger.warn('WhatsApp webhook missing signature (and not Twilio form)');
        } else {
          const body = JSON.stringify(req.body);
          const expected = 'sha256=' + crypto
            .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
            .update(body)
            .digest('hex');

          if (hubSignature !== expected) {
            logger.warn('WhatsApp webhook signature mismatch');
            return res.status(401).json({
              success: false,
              error: { code: 'SIGNATURE_INVALID', message: 'Invalid webhook signature' },
            });
          }
        }
      }

      // ── Twilio Fallback Logic ─────────────────────────────────
      // Twilio sends application/x-www-form-urlencoded with 'From' and 'Body'
      if (req.body.From && req.body.Body) {
        let senderPhone = req.body.From;
        if (senderPhone.startsWith('whatsapp:')) {
          senderPhone = senderPhone.replace('whatsapp:', '');
        }
        const messageBody = req.body.Body || '';

        logger.info('WhatsApp message received (Twilio)', {
          from: senderPhone,
          body: messageBody.substring(0, 100),
        });

        const WhatsAppBot = require('../services/whatsappBot.service');
        try {
          await WhatsAppBot.handleMessage(senderPhone, messageBody);
        } catch (botErr) {
          logger.error('WhatsApp bot handler failed (Twilio)', { error: botErr.message });
        }
        return res.status(200).send('<Response></Response>'); // Twilio requires TwiML
      }

      // ── Meta Logic ────────────────────────────────────────────
      // Meta sends application/json with 'entry'
      const { entry } = req.body;
      if (!entry || !Array.isArray(entry)) {
        return res.status(200).json({ success: true, message: 'No entries' });
      }

      // Process each entry
      const WhatsAppBot = require('../services/whatsappBot.service');

      for (const e of entry) {
        const changes = e.changes || [];
        for (const change of changes) {
          if (change.field !== 'messages') continue;

          const messages = change.value?.messages || [];
          for (const msg of messages) {
            const senderPhone = msg.from;
            const messageType = msg.type;
            let messageBody = '';

            // Extract text from different message types
            if (messageType === 'text') {
              messageBody = msg.text?.body || '';
            } else if (messageType === 'interactive') {
              // User tapped a button or list item
              const btnReply = msg.interactive?.button_reply;
              const listReply = msg.interactive?.list_reply;
              const replyId = btnReply?.id || listReply?.id || '';
              // Convert button IDs like "cmd_balance" → "balance"
              messageBody = replyId.replace('cmd_', '').replace('cashout_', '');
            }

            logger.info('WhatsApp message received', {
              from: senderPhone,
              type: messageType,
              body: (messageBody || '').substring(0, 100),
            });

            // Route to bot handler (no Redis dependency)
            if (messageBody) {
              try {
                await WhatsAppBot.handleMessage(senderPhone, messageBody);
              } catch (botErr) {
                logger.error('WhatsApp bot handler failed', { error: botErr.message });
              }
            }
          }
        }
      }

      // Always return 200 to Meta
      res.status(200).json({ success: true, message: 'Processed' });
    } catch (error) {
      logger.error('WhatsApp webhook error', { error: error.message });
      res.status(200).json({ success: true, message: 'Acknowledged' });
    }
  },
};

module.exports = webhooksController;
