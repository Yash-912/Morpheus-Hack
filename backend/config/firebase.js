// ============================================================
// Firebase Admin SDK — FCM push notifications
// Lazy-initialized: only created when first accessed
// ============================================================

let _fcmMessaging = null;
let _admin = null;
let _initialized = false;

function _init() {
  if (_initialized) return;
  _initialized = true;

  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw || raw === '{}') return; // Skip in dev / mock mode

    const serviceAccount = JSON.parse(raw);
    if (!serviceAccount.project_id) return;

    _admin = require('firebase-admin');
    _admin.initializeApp({ credential: _admin.credential.cert(serviceAccount) });
    _fcmMessaging = _admin.messaging();
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    console.error('❌ Firebase init failed:', error.message);
  }
}

module.exports = {
  get fcmMessaging() { _init(); return _fcmMessaging; },
  get firebaseAdmin() { _init(); return _admin; },
};
