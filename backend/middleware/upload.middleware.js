// ============================================================
// Upload Middleware — Multer config for file uploads
// Memory storage (buffer → S3), size/type validation
// ============================================================

const multer = require('multer');
const path = require('path');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf', 'text/csv', 'application/vnd.ms-excel'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const storage = multer.memoryStorage();

/**
 * File filter — rejects files with disallowed MIME types.
 */
function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new multer.MulterError(
        'LIMIT_UNEXPECTED_FILE',
        `Unsupported file type: ${file.mimetype}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      )
    );
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
});

/**
 * Single file upload middleware.
 * Usage: router.post('/upload', uploadSingle('image'), handler)
 * File available as req.file (buffer in req.file.buffer)
 */
function uploadSingle(fieldName = 'file') {
  return (req, res, next) => {
    const uploadHandler = upload.single(fieldName);

    uploadHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`,
            },
          });
        }
        return res.status(400).json({
          success: false,
          error: { code: 'UPLOAD_ERROR', message: err.message || err.field },
        });
      }
      if (err) {
        return res.status(500).json({
          success: false,
          error: { code: 'UPLOAD_ERROR', message: 'File upload failed' },
        });
      }
      next();
    });
  };
}

module.exports = { upload, uploadSingle };
