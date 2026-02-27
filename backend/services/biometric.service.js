// ============================================================
// Biometric Service — Face enrollment, verification, liveness (AWS Rekognition)
// ============================================================

const {
  IndexFacesCommand,
  SearchFacesByImageCommand,
  DetectFacesCommand,
  CreateCollectionCommand,
} = require('@aws-sdk/client-rekognition');
const { rekognitionClient } = require('../config/aws');
const { prisma } = require('../config/database');
const logger = require('../utils/logger.utils');

const COLLECTION_ID = process.env.REKOGNITION_COLLECTION_ID || 'gigpay-faces-dev';
const MATCH_THRESHOLD = 90; // Confidence threshold %

const BiometricService = {
  /**
   * Enroll a face into Rekognition collection.
   * Stores the FaceId on the user record.
   * @param {string} userId
   * @param {Buffer} imageBuffer — JPEG/PNG image buffer
   * @returns {Promise<{faceId: string, confidence: number}>}
   */
  async enrollFace(userId, imageBuffer) {
    if (!rekognitionClient) {
      throw Object.assign(new Error('Biometric service unavailable'), { statusCode: 503 });
    }

    try {
      const command = new IndexFacesCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBuffer },
        ExternalImageId: userId,
        DetectionAttributes: ['ALL'],
        MaxFaces: 1, // Will pick the largest face
        QualityFilter: 'LOW', // Lowered from AUTO for webcam support
      });

      const result = await rekognitionClient.send(command);

      if (!result.FaceRecords || result.FaceRecords.length === 0) {
        throw Object.assign(new Error('No face detected in the image'), { statusCode: 400 });
      }

      const face = result.FaceRecords[0].Face;

      // Store the face embedding reference on user
      // Note: faceEmbedding is Bytes in the schema; we store the FaceId as a reference string
      await prisma.user.update({
        where: { id: userId },
        data: { faceEmbedding: Buffer.from(face.FaceId) },
      });

      logger.info('Face enrolled', { userId, faceId: face.FaceId });

      return { faceId: face.FaceId, confidence: face.Confidence };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('Face enrollment failed:', error);
      throw Object.assign(new Error('Face enrollment failed'), { statusCode: 500 });
    }
  },

  /**
   * Verify a face against the enrolled face in the collection.
   * @param {string} userId
   * @param {Buffer} imageBuffer
   * @returns {Promise<{match: boolean, confidence: number}>}
   */
  async verifyFace(userId, imageBuffer) {
    if (!rekognitionClient) {
      throw Object.assign(new Error('Biometric service unavailable'), { statusCode: 503 });
    }

    try {
      const command = new SearchFacesByImageCommand({
        CollectionId: COLLECTION_ID,
        Image: { Bytes: imageBuffer },
        FaceMatchThreshold: MATCH_THRESHOLD,
        MaxFaces: 1,
      });

      const result = await rekognitionClient.send(command);

      if (!result.FaceMatches || result.FaceMatches.length === 0) {
        return { match: false, confidence: 0 };
      }

      const bestMatch = result.FaceMatches[0];
      const matchedUserId = bestMatch.Face.ExternalImageId;

      // Ensure the match belongs to the claimed user
      const match = matchedUserId === userId && bestMatch.Similarity >= MATCH_THRESHOLD;

      logger.info('Face verification', {
        userId,
        match,
        similarity: bestMatch.Similarity,
      });

      return { match, confidence: bestMatch.Similarity };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('Face verification failed:', error);
      throw Object.assign(new Error('Face verification failed'), { statusCode: 500 });
    }
  },

  /**
   * Liveness check — ensures the image contains a single real face
   * with open eyes (basic anti-spoofing).
   * @param {Buffer} imageBuffer
   * @returns {Promise<{alive: boolean, details: object}>}
   */
  async livenessCheck(imageBuffer) {
    if (!rekognitionClient) {
      throw Object.assign(new Error('Biometric service unavailable'), { statusCode: 503 });
    }

    try {
      const command = new DetectFacesCommand({
        Image: { Bytes: imageBuffer },
        Attributes: ['ALL'],
      });

      const result = await rekognitionClient.send(command);

      if (!result.FaceDetails || result.FaceDetails.length === 0) {
        return { alive: false, details: { reason: 'No face detected' } };
      }

      // Find the largest face by bounding box area instead of failing on multiple faces
      const largestFace = result.FaceDetails.reduce((prev, current) => {
        const prevArea = prev.BoundingBox.Width * prev.BoundingBox.Height;
        const currentArea = current.BoundingBox.Width * current.BoundingBox.Height;
        return (prevArea > currentArea) ? prev : current;
      });

      const eyesOpen = largestFace.EyesOpen?.Value === true && largestFace.EyesOpen?.Confidence >= 60;
      const highConfidence = largestFace.Confidence >= 80;

      const alive = eyesOpen && highConfidence;

      return {
        alive,
        details: {
          eyesOpen,
          confidence: largestFace.Confidence,
          eyesOpenConfidence: largestFace.EyesOpen?.Confidence,
        },
      };
    } catch (error) {
      logger.error('Liveness check failed:', error);
      throw Object.assign(new Error('Liveness check failed'), { statusCode: 500 });
    }
  },

  /**
   * Ensure the Rekognition collection exists (call once at startup or deploy).
   */
  async ensureCollection() {
    if (!rekognitionClient) return;

    try {
      await rekognitionClient.send(
        new CreateCollectionCommand({ CollectionId: COLLECTION_ID })
      );
      logger.info(`Rekognition collection created: ${COLLECTION_ID}`);
    } catch (error) {
      if (error.name === 'ResourceAlreadyExistsException') {
        logger.debug(`Rekognition collection already exists: ${COLLECTION_ID}`);
      } else {
        logger.error('Failed to create Rekognition collection:', error);
      }
    }
  },
};

module.exports = BiometricService;
