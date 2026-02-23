// ============================================================
// Razorpay SDK Client
// Lazy-initialized: only created when first accessed
// ============================================================

let _razorpayClient = null;
let _initialized = false;

function _init() {
  if (_initialized) return;
  _initialized = true;

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET ||
      process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock')) {
    // Skip in dev / mock mode
    return;
  }

  try {
    const Razorpay = require('razorpay');
    _razorpayClient = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log('✅ Razorpay client initialized');
  } catch (error) {
    console.error('❌ Razorpay init failed:', error.message);
  }
}

module.exports = {
  get razorpayClient() { _init(); return _razorpayClient; },
};
