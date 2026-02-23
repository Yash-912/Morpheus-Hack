// ============================================================
// User Routes — profile management
// ============================================================

const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// All user routes require authentication
router.use(authMiddleware);

// GET /api/users/profile
router.get('/profile', userController.getProfile);

// PATCH /api/users/profile
router.patch(
  '/profile',
  [
    body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('primaryCity').optional().isString(),
    body('preferredLanguage').optional().isIn(['en', 'hi', 'kn', 'ta', 'te', 'mr']),
    body('upiId').optional().isString(),
  ],
  validate,
  userController.updateProfile
);

module.exports = router;
