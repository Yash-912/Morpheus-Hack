// ============================================================
// User Routes — profile management
// ============================================================

const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate.middleware');
const authMiddleware = require('../middleware/auth.middleware');
const userController = require('../controllers/user.controller');

// GET /api/users/by-phone (INTERNAL — bot uses x-bot-secret, no JWT needed)
router.get('/by-phone', userController.getByPhone);

// All routes below require JWT authentication
router.use(authMiddleware);

// GET /api/users/profile
router.get('/profile', userController.getProfile);

// PATCH /api/users/profile
router.patch(
  '/profile',
  [
    body('name').optional().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('city').optional().isString(),
    body('languagePref').optional().isIn(['en', 'hi', 'kn', 'ta', 'te', 'mr']),
  ],
  validate,
  userController.updateProfile
);

module.exports = router;
