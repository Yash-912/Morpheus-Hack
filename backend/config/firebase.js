// ============================================================
// Firebase Admin SDK — FCM push notifications
// ============================================================

const admin = require('firebase-admin');

let fcmMessaging = null;

try {
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : null;

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    fcmMessaging = admin.messaging();
    console.log('✅ Firebase Admin initialized');
  } else {
    console.warn('⚠️  FIREBASE_SERVICE_ACCOUNT not set — FCM push disabled');
  }
} catch (error) {
  console.error('❌ Firebase init failed:', error.message);
}

module.exports = { fcmMessaging, firebaseAdmin: admin };
