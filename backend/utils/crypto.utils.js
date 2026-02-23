// ============================================================
// Crypto Utilities — AES-256-GCM encryption for sensitive fields
// (Aadhaar numbers, bank account numbers, etc.)
// ============================================================

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128-bit IV
const TAG_LENGTH = 16; // 128-bit auth tag
const ENCODING = 'base64';

// 32-byte key from hex env (64 hex chars)
function getKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt a plaintext string.
 * @param {string} text — plaintext to encrypt
 * @returns {string} — base64-encoded string: `iv:tag:ciphertext`
 */
function encrypt(text) {
  if (!text) return text;

  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', ENCODING);
  encrypted += cipher.final(ENCODING);

  const tag = cipher.getAuthTag();

  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted}`;
}

/**
 * Decrypt an encrypted string.
 * @param {string} encryptedString — `iv:tag:ciphertext` base64-encoded
 * @returns {string} — decrypted plaintext
 */
function decrypt(encryptedString) {
  if (!encryptedString) return encryptedString;

  const key = getKey();
  const parts = encryptedString.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format');
  }

  const [ivB64, tagB64, ciphertext] = parts;
  const iv = Buffer.from(ivB64, ENCODING);
  const tag = Buffer.from(tagB64, ENCODING);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(ciphertext, ENCODING, 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Hash a value with SHA-256 (one-way, for lookups).
 * @param {string} text
 * @returns {string} — hex hash
 */
function hash(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

module.exports = { encrypt, decrypt, hash };
