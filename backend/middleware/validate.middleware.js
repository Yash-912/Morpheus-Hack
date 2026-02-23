// ============================================================
// Validation Middleware — express-validator runner
// ============================================================

const { validationResult } = require('express-validator');

/**
 * Runs the express-validator chain and returns 400 with detailed
 * errors if validation fails. Use after validation rules array.
 *
 * Usage:
 *   router.post('/foo', [body('name').notEmpty()], validate, controller.foo)
 */
function validate(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formatted = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: formatted,
      },
    });
  }

  next();
}

module.exports = validate;
