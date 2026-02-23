// ============================================================
// Auth Routes — OTP auth, KYC, biometric registration
// ============================================================

const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter.middleware');
const { uploadSingle } = require('../middleware/upload.middleware');
const authController = require('../controllers/auth.controller');

// POST /api/auth/send-otp
router.post(
  '/send-otp',
  authLimiter,
  otpLimiter,
  [
    body('phone')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\+91\d{10}$/).withMessage('Must be a valid Indian phone (+91XXXXXXXXXX)'),
  ],
  validate,
  authController.sendOtp
);

// POST /api/auth/verify-otp
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('phone')
      .notEmpty().withMessage('Phone number is required')
      .matches(/^\+91\d{10}$/).withMessage('Must be a valid Indian phone (+91XXXXXXXXXX)'),
    body('otp')
      .notEmpty().withMessage('OTP is required')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  ],
  validate,
  authController.verifyOtp
);

// POST /api/auth/refresh
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  authController.refreshToken
);

// POST /api/auth/logout (auth required)
router.post('/logout', authMiddleware, authController.logout);

// ---- KYC Endpoints (auth required) ----

// POST /api/auth/kyc/aadhaar/init
router.post(
  '/kyc/aadhaar/init',
  authMiddleware,
  [
    body('aadhaarNumber')
      .notEmpty().withMessage('Aadhaar number is required')
      .matches(/^\d{12}$/).withMessage('Aadhaar must be 12 digits'),
  ],
  validate,
  authController.initAadhaarKyc
);

// POST /api/auth/kyc/aadhaar/verify
router.post(
  '/kyc/aadhaar/verify',
  authMiddleware,
  [
    body('aadhaarNumber').notEmpty().withMessage('Aadhaar number is required'),
    body('otp').notEmpty().withMessage('OTP is required'),
    body('txnId').notEmpty().withMessage('Transaction ID is required'),
  ],
  validate,
  authController.verifyAadhaarKyc
);

// POST /api/auth/kyc/selfie
router.post(
  '/kyc/selfie',
  authMiddleware,
  uploadSingle('selfie'),
  authController.verifySelfie
);

// ---- Biometric (WebAuthn) Endpoints ----

// POST /api/auth/biometric/register
router.post(
  '/biometric/register',
  authMiddleware,
  [
    body('credentialId').notEmpty().withMessage('Credential ID is required'),
    body('publicKey').notEmpty().withMessage('Public key is required'),
  ],
  validate,
  authController.registerBiometric
);

// POST /api/auth/biometric/challenge
router.post('/biometric/challenge', authMiddleware, authController.getBiometricChallenge);

// POST /api/auth/biometric/authenticate
router.post(
  '/biometric/authenticate',
  authMiddleware,
  [body('assertion').notEmpty().withMessage('Assertion is required')],
  validate,
  authController.authenticateBiometric
);

module.exports = router;
