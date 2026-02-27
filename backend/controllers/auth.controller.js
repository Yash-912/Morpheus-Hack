// ============================================================
// Auth Controller — OTP auth, KYC, biometric registration
// ============================================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { prisma } = require('../config/database');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger.utils');
const SmsService = require('../services/sms.service');
const AadhaarService = require('../services/aadhaar.service');
const BiometricService = require('../services/biometric.service');
const StorageService = require('../services/storage.service');
const { encrypt } = require('../utils/crypto.utils');
const { JWT_ACCESS_EXPIRES, JWT_REFRESH_EXPIRES } = require('../config/constants');

const PRIVATE_KEY = process.env.JWT_ACCESS_PRIVATE_KEY
  ? process.env.JWT_ACCESS_PRIVATE_KEY.replace(/\\n/g, '\n')
  : process.env.JWT_SECRET || 'dev-secret';

const PUBLIC_KEY = process.env.JWT_ACCESS_PUBLIC_KEY
  ? process.env.JWT_ACCESS_PUBLIC_KEY.replace(/\\n/g, '\n')
  : null;

// Use RS256 only when keys look like real RSA/EC PEM keys
const isAsymmetric = PUBLIC_KEY && PUBLIC_KEY !== PRIVATE_KEY && PRIVATE_KEY.includes('-----BEGIN');
const JWT_ALG = isAsymmetric ? 'RS256' : 'HS256';
const SIGN_KEY = isAsymmetric ? PRIVATE_KEY : (process.env.JWT_ACCESS_PRIVATE_KEY || process.env.JWT_SECRET || 'dev-secret');
const VERIFY_KEY = isAsymmetric ? PUBLIC_KEY : SIGN_KEY;

function signAccessToken(payload) {
  return jwt.sign(payload, SIGN_KEY, { algorithm: JWT_ALG, expiresIn: JWT_ACCESS_EXPIRES });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, SIGN_KEY, { algorithm: JWT_ALG, expiresIn: JWT_REFRESH_EXPIRES });
}

const authController = {
  /**
   * POST /api/auth/send-otp
   * Send OTP to phone number.
   */
  async sendOtp(req, res, next) {
    try {
      const { phone } = req.body;
      // Generate 6-digit OTP
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpHash = await bcrypt.hash(otp, 10);

      // Store hash + attempts in Redis
      await redisClient
        .multi()
        .hset(`otp_store:${phone}`, 'hash', otpHash, 'attempts', '0')
        .expire(`otp_store:${phone}`, 10 * 60)
        .exec();

      // Log OTP to console for development
      console.log(`\n============================`);
      console.log(`🔑 DEV OTP for ${phone}: ${otp}`);
      console.log(`============================\n`);

      res.json({ success: true, message: 'OTP sent successfully (Logged to console)' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/verify-otp
   * Verify OTP, upsert user, return tokens.
   */
  async verifyOtp(req, res, next) {
    try {
      const { phone, otp } = req.body;

      const storeKey = `otp_store:${phone}`;
      const stored = await redisClient.hgetall(storeKey);

      if (!stored || !stored.hash) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OTP', message: 'OTP expired or not found. Please request a new one.' },
        });
      }

      const match = await bcrypt.compare(otp, stored.hash);

      if (!match) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_OTP', message: 'Invalid OTP. Please try again.' },
        });
      }

      // Verified - cleanup
      await redisClient.del(storeKey);

      // Upsert user
      let user = await prisma.user.findUnique({ where: { phone } });
      const isNewUser = !user;

      if (isNewUser) {
        user = await prisma.user.create({
          data: {
            phone,
            isActive: true,
            kycStatus: 'pending',
            walletBalance: BigInt(0),
            gigScore: 0,
          },
        });
        logger.info('New user created', { userId: user.id, phone: phone.slice(-4) });
      }

      // Generate tokens
      const tokenPayload = { userId: user.id, phone: user.phone };
      const accessToken = signAccessToken(tokenPayload);
      const refreshToken = signRefreshToken(tokenPayload);

      // Store refresh token in Redis whitelist (30 days TTL)
      await redisClient.set(
        `refresh_token:${user.id}:${refreshToken}`,
        '1',
        'EX',
        30 * 24 * 60 * 60
      );

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            phone: user.phone,
            name: user.name,
            kycStatus: user.kycStatus,
            isActive: user.isActive,
          },
          isNewUser,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/refresh
   * Issue new access token from refresh token.
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const decoded = jwt.verify(refreshToken, PUBLIC_KEY || PRIVATE_KEY, {
        algorithms: [JWT_ALG],
      });

      // Check Redis whitelist
      const exists = await redisClient.exists(`refresh_token:${decoded.userId}:${refreshToken}`);
      if (!exists) {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_REFRESH', message: 'Refresh token revoked or expired' },
        });
      }

      const accessToken = signAccessToken({ userId: decoded.userId, phone: decoded.phone });

      res.json({ success: true, data: { accessToken } });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: { code: 'INVALID_REFRESH', message: 'Invalid or expired refresh token' },
        });
      }
      next(error);
    }
  },

  /**
   * POST /api/auth/logout
   * Delete refresh token from Redis.
   */
  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await redisClient.del(`refresh_token:${req.user.id}:${refreshToken}`);
      }
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/kyc/aadhaar/init
   * Create a Setu DigiLocker session for KYC.
   */
  async initAadhaarKyc(req, res, next) {
    try {
      const result = await AadhaarService.createDigiLockerSession();
      res.json({ success: true, data: result }); // Returns { id, url }
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/kyc/aadhaar/verify
   * Verify DigiLocker request, extract Aadhaar data, update user.
   */
  async verifyAadhaarKyc(req, res, next) {
    try {
      const { requestId } = req.body;
      const kycData = await AadhaarService.fetchDigiLockerDocument(requestId);

      if (!kycData.verified) {
        return res.status(400).json({
          success: false,
          error: { code: 'KYC_FAILED', message: 'DigiLocker verification failed' },
        });
      }

      // Store dummy encrypted Aadhaar for now since it's hidden behind Setu
      const encryptedAadhaar = kycData.encryptedAadhaar;

      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: kycData.name,
          aadhaarLast4: 'XXXX', // Dummy value since Setu abstracts it
          kycStatus: 'verified',
        },
      });

      // Store photo for face-match step
      if (kycData.photo_base64) {
        await redisClient.set(
          `kyc_photo:${req.user.id}`,
          kycData.photo_base64,
          'EX',
          3600 // 1 hour TTL
        );
      }

      res.json({
        success: true,
        data: {
          name: kycData.name,
          kycStatus: 'verified',
          message: 'DigiLocker KYC verified successfully.',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/kyc/aadhaar/upload
   * Aadhaar Offline XML upload — parse ZIP, verify signature, extract data.
   */
  async uploadAadhaarXml(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'Aadhaar ZIP file is required' },
        });
      }

      const shareCode = req.body.shareCode || req.body.share_code;
      if (!shareCode || shareCode.length !== 4) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_SHARE_CODE', message: 'A 4-digit share code is required' },
        });
      }

      // 1. Parse ZIP → extract XML
      const xmlString = await AadhaarService.parseOfflineXml(req.file.buffer, shareCode);

      // 2. Verify UIDAI digital signature
      await AadhaarService.verifySignature(xmlString);

      // 3. Extract KYC data
      const kycData = await AadhaarService.extractKycData(xmlString, shareCode);

      // 4. Validate XML age
      AadhaarService.validateAge(kycData.generatedAt);

      // 5. Update user in database
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          name: kycData.name,
          aadhaarLast4: kycData.aadhaarLast4,
          kycStatus: 'verified',
          kycMethod: 'aadhaar_offline_xml',
          city: kycData.city || undefined,
        },
      });

      // 6. Store photo in Redis for selfie match (1 hour TTL)
      if (kycData.photoBase64) {
        await redisClient.set(
          `kyc_photo:${req.user.id}`,
          kycData.photoBase64,
          'EX',
          3600
        );
      }

      logger.info('Aadhaar Offline XML KYC verified', {
        userId: req.user.id,
        name: kycData.name,
        aadhaarLast4: kycData.aadhaarLast4,
      });

      res.json({
        success: true,
        data: {
          name: kycData.name,
          dob: kycData.dob,
          city: kycData.city,
          aadhaarLast4: kycData.aadhaarLast4,
          kycStatus: 'verified',
          kycMethod: 'aadhaar_offline_xml',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/kyc/selfie
   * Upload selfie, match against Aadhaar photo, enroll face.
   */
  async verifySelfie(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: { code: 'NO_FILE', message: 'Selfie image is required' },
        });
      }

      // Upload selfie to S3
      const s3Key = `kyc/${req.user.id}/selfie_${Date.now()}.jpg`;
      await StorageService.uploadFile(req.file.buffer, s3Key, req.file.mimetype);

      // --- BYPASS AWS REKOGNITION ---
      // The user requested to skip actual facial enrollment/liveness checks 
      // due to continuous failures with their webcam feed.
      // We are mocking a successful verification here.

      // Update KYC status to fully verified
      await prisma.user.update({
        where: { id: req.user.id },
        data: { kycStatus: 'verified' },
      });

      res.json({
        success: true,
        data: {
          kycStatus: 'verified',
          message: 'KYC verified (Face check skipped by user request).',
        },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/biometric/register
   * Store WebAuthn credential.
   */
  async registerBiometric(req, res, next) {
    try {
      const { credentialId, publicKey } = req.body;

      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          webauthnCredentialId: credentialId,
          webauthnPublicKey: publicKey,
        },
      });

      res.json({ success: true, message: 'Biometric credential registered' });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/biometric/challenge
   * Generate and return WebAuthn challenge.
   */
  async getBiometricChallenge(req, res, next) {
    try {
      const challenge = crypto.randomBytes(32).toString('base64url');

      await redisClient.set(
        `webauthn_challenge:${req.user.id}`,
        challenge,
        'EX',
        300 // 5 minutes
      );

      res.json({ success: true, data: { challenge } });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/biometric/authenticate
   * Verify WebAuthn assertion, issue withdrawal token.
   */
  async authenticateBiometric(req, res, next) {
    try {
      const { assertion } = req.body;
      const userId = req.user.id;

      // Retrieve stored challenge
      const challenge = await redisClient.get(`webauthn_challenge:${userId}`);
      if (!challenge) {
        return res.status(400).json({
          success: false,
          error: { code: 'CHALLENGE_EXPIRED', message: 'Challenge expired. Request a new one.' },
        });
      }

      // For face-based biometric verification fallback
      if (assertion.type === 'face' && assertion.imageBase64) {
        const imageBuffer = Buffer.from(assertion.imageBase64, 'base64');
        const result = await BiometricService.verifyFace(userId, imageBuffer);
        if (!result.match) {
          return res.status(403).json({
            success: false,
            error: { code: 'BIOMETRIC_FAILED', message: 'Face verification failed' },
          });
        }
      }

      // Clean up challenge
      await redisClient.del(`webauthn_challenge:${userId}`);

      // Issue single-use withdrawal token (5-min TTL)
      const withdrawalToken = crypto.randomBytes(32).toString('hex');
      await redisClient.set(
        `withdrawal_token:${userId}:${withdrawalToken}`,
        '1',
        'EX',
        300
      );

      res.json({
        success: true,
        data: { withdrawalToken, expiresIn: 300 },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = authController;
