// ============================================================
// AWS SDK Clients — S3 (file storage) + Rekognition (face verify)
// Lazy-initialized: only created when first accessed
// ============================================================

let _s3Client = null;
let _rekognitionClient = null;
let _initialized = false;

function _init() {
  if (_initialized) return;
  _initialized = true;

  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.AWS_ACCESS_KEY_ID === 'AKIAIOSFODNN7EXAMPLE') {
    // Skip in dev / mock mode
    return;
  }

  try {
    const { S3Client } = require('@aws-sdk/client-s3');
    const { RekognitionClient } = require('@aws-sdk/client-rekognition');
    const cfg = {
      region: process.env.AWS_REGION || 'ap-south-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    };
    _s3Client = new S3Client(cfg);
    _rekognitionClient = new RekognitionClient(cfg);
    console.log('✅ AWS clients initialized (S3 + Rekognition)');
  } catch (error) {
    console.error('❌ AWS SDK init failed:', error.message);
  }
}

module.exports = {
  get s3Client() { _init(); return _s3Client; },
  get rekognitionClient() { _init(); return _rekognitionClient; },
};
