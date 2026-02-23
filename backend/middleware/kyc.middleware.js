// ============================================================
// KYC Middleware — gate for KYC-required endpoints
// ============================================================

/**
 * Checks req.user.kycStatus === 'verified'.
 * Must be placed AFTER auth middleware.
 */
function kycMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
    });
  }

  if (req.user.kycStatus !== 'verified') {
    return res.status(403).json({
      success: false,
      error: {
        code: 'KYC_REQUIRED',
        message: 'KYC verification is required to access this resource',
        details: { currentStatus: req.user.kycStatus },
      },
    });
  }

  next();
}

module.exports = kycMiddleware;
