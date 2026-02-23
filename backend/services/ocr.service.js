// ============================================================
// OCR Service — Tesseract.js earnings screenshot processing
// ============================================================

const Tesseract = require('tesseract.js');
const logger = require('../utils/logger.utils');
const { rupeesToPaise } = require('../utils/formatters.utils');

// Platform-specific regex patterns for earnings screens
const PLATFORM_PATTERNS = {
  zomato: {
    earnings: /(?:total\s*earnings?|net\s*earnings?)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
    trips: /(?:orders?|deliveries?|trips?)\s*[:\-]?\s*(\d+)/i,
    date: /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/,
    incentive: /(?:incentive|bonus|surge)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
  },
  swiggy: {
    earnings: /(?:total\s*pay|earnings?|payout)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
    trips: /(?:orders?|deliveries?|completed)\s*[:\-]?\s*(\d+)/i,
    date: /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/,
    incentive: /(?:incentive|bonus|prime)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
  },
  ola: {
    earnings: /(?:total\s*earnings?|net\s*amount|trip\s*fare)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
    trips: /(?:rides?|trips?|completed)\s*[:\-]?\s*(\d+)/i,
    date: /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/,
    incentive: /(?:incentive|bonus|surge)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
  },
  uber: {
    earnings: /(?:total\s*earnings?|net\s*fare|trip\s*earnings?)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
    trips: /(?:trips?|rides?|completed)\s*[:\-]?\s*(\d+)/i,
    date: /(\d{1,2}[\/-]\d{1,2}[\/-]\d{2,4})/,
    incentive: /(?:quest|boost|surge|promotion)\s*[:\-]?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i,
  },
};

/**
 * Parse amount string "1,234.56" → number in rupees.
 */
function parseAmount(amountStr) {
  if (!amountStr) return 0;
  return parseFloat(amountStr.replace(/,/g, '')) || 0;
}

/**
 * Parse date string from screenshot.
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split(/[\/-]/);
  if (parts.length !== 3) return null;
  const [d, m, y] = parts;
  const year = y.length === 2 ? `20${y}` : y;
  return new Date(`${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`);
}

const OcrService = {
  /**
   * Extract earnings data from a screenshot buffer.
   * @param {Buffer} imageBuffer — image file buffer
   * @param {string} platform — 'zomato' | 'swiggy' | 'ola' | 'uber'
   * @returns {Promise<{totalEarnings: number, tripCount: number, date: Date|null, incentive: number, platform: string, rawText: string}|null>}
   */
  async extractEarnings(imageBuffer, platform) {
    const patterns = PLATFORM_PATTERNS[platform];
    if (!patterns) {
      const error = new Error(`Unsupported platform for OCR: ${platform}`);
      error.statusCode = 400;
      throw error;
    }

    try {
      logger.debug('Starting OCR processing', { platform });

      const {
        data: { text },
      } = await Tesseract.recognize(imageBuffer, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            logger.debug(`OCR progress: ${(m.progress * 100).toFixed(0)}%`);
          }
        },
      });

      if (!text || text.trim().length < 10) {
        logger.warn('OCR returned insufficient text');
        return null;
      }

      // Extract structured data using platform-specific patterns
      const earningsMatch = text.match(patterns.earnings);
      const tripsMatch = text.match(patterns.trips);
      const dateMatch = text.match(patterns.date);
      const incentiveMatch = text.match(patterns.incentive);

      const totalEarningsRupees = earningsMatch ? parseAmount(earningsMatch[1]) : 0;

      if (totalEarningsRupees === 0) {
        logger.warn('Could not extract earnings amount from screenshot', {
          platform,
          textLength: text.length,
        });
        return null;
      }

      const result = {
        totalEarnings: rupeesToPaise(totalEarningsRupees), // Store in paise
        tripCount: tripsMatch ? parseInt(tripsMatch[1], 10) : 0,
        date: dateMatch ? parseDate(dateMatch[1]) : new Date(),
        incentive: incentiveMatch ? rupeesToPaise(parseAmount(incentiveMatch[1])) : 0,
        platform,
        rawText: text.substring(0, 500), // Truncate for storage
      };

      logger.info('OCR extraction successful', {
        platform,
        earnings: totalEarningsRupees,
        trips: result.tripCount,
      });

      return result;
    } catch (error) {
      logger.error('OCR processing failed:', error.message);
      const err = new Error('Failed to process screenshot');
      err.statusCode = 500;
      throw err;
    }
  },
};

module.exports = OcrService;
