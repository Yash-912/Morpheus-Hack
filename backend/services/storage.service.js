// ============================================================
// Storage Service — AWS S3 file operations
// ============================================================

const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl: s3GetSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client } = require('../config/aws');
const logger = require('../utils/logger.utils');

const BUCKET = process.env.AWS_S3_BUCKET || 'gigpay-uploads';
const REGION = process.env.AWS_REGION || 'ap-south-1';

const StorageService = {
  /**
   * Upload a file buffer to S3.
   * @param {Buffer} buffer — file content
   * @param {string} key — S3 object key (e.g. "kyc/userId/selfie.jpg")
   * @param {string} contentType — MIME type
   * @returns {Promise<string>} public URL of the uploaded object
   */
  async uploadFile(buffer, key, contentType) {
    try {
      await s3Client.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ServerSideEncryption: 'AES256',
        })
      );

      const url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
      logger.info('File uploaded to S3', { key, size: buffer.length });
      return url;
    } catch (error) {
      logger.error('S3 upload failed:', error.message);
      const err = new Error('File upload failed');
      err.statusCode = 500;
      throw err;
    }
  },

  /**
   * Generate a pre-signed download URL.
   * @param {string} key — S3 object key
   * @param {number} [expiresIn=3600] — seconds until URL expires
   * @returns {Promise<string>} pre-signed URL
   */
  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: key,
      });

      const url = await s3GetSignedUrl(s3Client, command, { expiresIn });

      logger.debug('Pre-signed URL generated', { key, expiresIn });
      return url;
    } catch (error) {
      logger.error('S3 signed URL generation failed:', error.message);
      const err = new Error('Failed to generate download URL');
      err.statusCode = 500;
      throw err;
    }
  },

  /**
   * Delete a file from S3.
   * @param {string} key — S3 object key
   * @returns {Promise<boolean>}
   */
  async deleteFile(key) {
    try {
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: BUCKET,
          Key: key,
        })
      );

      logger.info('File deleted from S3', { key });
      return true;
    } catch (error) {
      logger.error('S3 delete failed:', error.message);
      return false;
    }
  },
};

module.exports = StorageService;
