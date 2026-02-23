// ============================================================
// Razorpay SDK Client
// ============================================================

const Razorpay = require('razorpay');

let razorpayClient = null;

try {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay client initialized');
  } else {
    console.warn('⚠️  Razorpay credentials not set — payouts disabled');
  }
} catch (error) {
  console.error('❌ Razorpay init failed:', error.message);
}

module.exports = { razorpayClient };
