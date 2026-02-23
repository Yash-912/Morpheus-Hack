// ============================================================
// AWS SDK Clients — S3 (file storage) + Rekognition (face verify)
// ============================================================

const { S3Client } = require('@aws-sdk/client-s3');
const { RekognitionClient } = require('@aws-sdk/client-rekognition');

const awsConfig = {
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

let s3Client = null;
let rekognitionClient = null;

try {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    s3Client = new S3Client(awsConfig);
    rekognitionClient = new RekognitionClient(awsConfig);
    console.log('✅ AWS clients initialized (S3 + Rekognition)');
  } else {
    console.warn('⚠️  AWS credentials not set — S3/Rekognition disabled');
  }
} catch (error) {
  console.error('❌ AWS SDK init failed:', error.message);
}

module.exports = { s3Client, rekognitionClient };
