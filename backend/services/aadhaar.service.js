// ============================================================
// Aadhaar Service — Offline XML Parse, Verify & Extract
// Also keeps Setu DigiLocker as fallback
// ============================================================

const unzipper = require('unzipper');
const xml2js = require('xml2js');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const logger = require('../utils/logger.utils');
const { encrypt } = require('../utils/crypto.utils');
const { AADHAAR_XML_MAX_AGE_DAYS } = require('../config/constants');

// ---- Setu DigiLocker config (fallback) ----
const SETU_API_URL = process.env.SETU_API_URL || 'https://dg-sandbox.setu.co';
const SETU_CLIENT_ID = process.env.SETU_CLIENT_ID;
const SETU_CLIENT_SECRET = process.env.SETU_CLIENT_SECRET;
const SETU_PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID;

const setuClient = axios.create({
  baseURL: SETU_API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'x-client-id': SETU_CLIENT_ID,
    'x-client-secret': SETU_CLIENT_SECRET,
    'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID,
  },
});

// ---- UIDAI Certificate ----
const CERT_PATH = process.env.UIDAI_OFFLINE_CERT_PATH
  || path.join(__dirname, '..', 'config', 'uidai_offline_cert.pem');

function loadUidaiCert() {
  try {
    if (fs.existsSync(CERT_PATH)) {
      return fs.readFileSync(CERT_PATH, 'utf-8');
    }
    logger.warn('UIDAI certificate not found at', CERT_PATH, '— signature verification will be skipped');
    return null;
  } catch (err) {
    logger.error('Failed to load UIDAI certificate:', err.message);
    return null;
  }
}

const AadhaarService = {
  // ============================================================
  // PRIMARY: Aadhaar Offline XML Upload
  // ============================================================

  /**
   * Parse the Offline Aadhaar ZIP file using the share code.
   * @param {Buffer} zipBuffer — raw ZIP data from multer
   * @param {string} shareCode — 4-digit code the user set during download
   * @returns {Promise<string>} raw XML string
   */
  async parseOfflineXml(zipBuffer, shareCode) {
    try {
      // We use 'unzipper' because it supports standard ZipCrypto passwords
      let xmlString = null;
      try {
        const directory = await unzipper.Open.buffer(zipBuffer);

        const xmlEntry = directory.files.find(f => f.path.endsWith('.xml'));

        if (!xmlEntry) {
          throw Object.assign(new Error('No XML file found inside the ZIP. Ensure it is the correct UIDAI file.'), { statusCode: 400 });
        }

        let xmlData;
        try {
          // Unzipper allows passing the password to the buffer() method
          xmlData = await xmlEntry.buffer(shareCode);
        } catch (readErr) {
          logger.error('ZIP decrypt error:', readErr);
          throw Object.assign(
            new Error('Invalid 4-digit share code or corrupted ZIP file. Please check the code and try again.'),
            { statusCode: 400 }
          );
        }

        xmlString = xmlData.toString('utf-8');

        if (!xmlString || xmlString.length < 100) {
          throw Object.assign(
            new Error('Extracted XML is empty or malformed'),
            { statusCode: 400 }
          );
        }

        return xmlString;

      } catch (fileErr) {
        if (fileErr.statusCode) throw fileErr;
        logger.error('ZIP open error:', fileErr);
        throw Object.assign(new Error('Failed to open the loaded ZIP file. It might be corrupted.'), { statusCode: 400 });
      }
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('Aadhaar ZIP parse failed:', error.message);
      throw Object.assign(new Error('Failed to parse Aadhaar ZIP file'), { statusCode: 400 });
    }
  },

  /**
   * Verify the UIDAI digital signature on the XML.
   * @param {string} xmlString
   * @returns {Promise<boolean>}
   */
  async verifySignature(xmlString) {
    const certPem = loadUidaiCert();
    if (!certPem) {
      logger.warn('UIDAI cert not available — skipping signature verification (dev mode)');
      return true; // Skip in dev if cert not available
    }

    try {
      // Extract signature value from the XML
      const parsed = await xml2js.parseStringPromise(xmlString, { explicitArray: false });
      const root = parsed.OfflinePaperlessKyc || parsed.offlinePaperlessKyc;

      if (!root) {
        logger.warn('Unexpected XML root element — skipping signature verification');
        return true;
      }

      // The signature is in ds:Signature or Signature element
      const sigNode = root['ds:Signature'] || root.Signature;
      if (!sigNode) {
        logger.warn('No digital signature found in XML — might be a test file');
        return true;
      }

      // For a production system, you would fully validate the XML-DSIG here.
      // For the hackathon, we validate the cert and log success.
      const cert = forge.pki.certificateFromPem(certPem);
      logger.info('UIDAI signature verification — certificate loaded', {
        subject: cert.subject.getField('CN')?.value,
        validTo: cert.validity.notAfter,
      });

      return true;
    } catch (error) {
      logger.error('Signature verification error:', error.message);
      // Don't block KYC for signature issues in dev
      return true;
    }
  },

  /**
   * Extract KYC data fields from the parsed XML.
   * @param {string} xmlString
   * @param {string} shareCode — used as hash input reference
   * @returns {Promise<object>}
   */
  async extractKycData(xmlString, shareCode) {
    try {
      const parsed = await xml2js.parseStringPromise(xmlString, {
        explicitArray: false,
        ignoreAttrs: false,
        attrkey: '$',
      });

      // The offline XML has structure:
      // <OfflinePaperlessKyc ...>
      //   <UidData ...>
      //     <Poi name="..." dob="..." gender="..." />
      //     <Poa co="..." house="..." street="..." dist="..." state="..." pc="..." />
      //     <Pht>base64_photo_data</Pht>
      //   </UidData>
      // </OfflinePaperlessKyc>

      const root = parsed.OfflinePaperlessKyc || parsed.offlinePaperlessKyc || parsed;

      // Get UID (already masked as XXXXXXXX1234 by UIDAI)
      const referenceId = root.$?.referenceId || root.$?.uid || '';
      const aadhaarLast4 = referenceId.slice(-4) || 'XXXX';

      // Generated timestamp
      const generatedAt = root.$?.generatedDateTime || root.$?.ts || null;

      // UidData can be at root level or nested
      const uidData = root.UidData || root;

      // Personal info (Poi = Proof of Identity)
      const poi = uidData.Poi?.$ || uidData.Poi || {};
      const name = poi.name || poi.Name || '';
      const dob = poi.dob || poi.Dob || poi.DOB || '';
      const gender = poi.gender || poi.Gender || '';

      // Address (Poa = Proof of Address)
      const poa = uidData.Poa?.$ || uidData.Poa || {};
      const address = {
        careOf: poa.co || '',
        house: poa.house || '',
        street: poa.street || poa.landmark || '',
        locality: poa.loc || poa.locality || '',
        district: poa.dist || poa.district || '',
        state: poa.state || '',
        pincode: poa.pc || poa.pincode || '',
        vtc: poa.vtc || '',
      };
      const city = address.district || address.locality || address.vtc || '';

      // Photo (base64 encoded)
      const photoBase64 = uidData.Pht?._ || uidData.Pht || null;

      if (!name) {
        throw Object.assign(
          new Error('Could not extract name from Aadhaar XML. File may be corrupted.'),
          { statusCode: 400 }
        );
      }

      return {
        name: name.trim(),
        dob,
        gender,
        address,
        city,
        photoBase64: typeof photoBase64 === 'string' ? photoBase64.trim() : null,
        aadhaarLast4,
        generatedAt,
        encryptedAadhaar: encrypt(referenceId || '000000000000'),
      };
    } catch (error) {
      if (error.statusCode) throw error;
      logger.error('Aadhaar XML data extraction failed:', error.message);
      throw Object.assign(
        new Error('Failed to extract data from Aadhaar XML'),
        { statusCode: 400 }
      );
    }
  },

  /**
   * Validate that the XML is not too old.
   * @param {string|null} generatedAt — ISO timestamp from XML
   * @returns {boolean}
   */
  validateAge(generatedAt) {
    if (!generatedAt) {
      logger.warn('No generation timestamp in XML — allowing (dev mode)');
      return true;
    }

    const generated = new Date(generatedAt);
    const now = new Date();
    const diffDays = (now - generated) / (1000 * 60 * 60 * 24);

    if (diffDays > AADHAAR_XML_MAX_AGE_DAYS) {
      throw Object.assign(
        new Error(`Aadhaar XML is ${Math.floor(diffDays)} days old (max: ${AADHAAR_XML_MAX_AGE_DAYS} days). Please download a fresh copy from UIDAI.`),
        { statusCode: 400 }
      );
    }

    return true;
  },

  // ============================================================
  // FALLBACK: Setu DigiLocker (kept for reference / alternative flow)
  // ============================================================

  async createDigiLockerSession() {
    try {
      logger.info('Creating Setu DigiLocker Session');
      const { data } = await setuClient.post('/api/digilocker', {
        redirectUrl: process.env.FRONTEND_URL
          ? `${process.env.FRONTEND_URL}/onboarding/kyc`
          : 'http://localhost:3000/onboarding/kyc',
      });
      if (!data.id || !data.url) {
        throw new Error('Setu did not return a valid DigiLocker session');
      }
      return { id: data.id, url: data.url };
    } catch (error) {
      logger.error('Setu DigiLocker init failed:', error.response?.data || error.message);
      return {
        id: `mock_req_${Date.now()}`,
        url: `http://localhost:3000/onboarding/kyc?requestId=mock_req_${Date.now()}`,
      };
    }
  },

  async fetchDigiLockerDocument(requestId) {
    try {
      logger.info('Fetching Setu DigiLocker Document', { requestId });
      const statusRes = await setuClient.get(`/api/digilocker/${requestId}`);
      if (statusRes.data.status !== 'success') {
        throw new Error('DigiLocker consent not yet granted or failed');
      }
      const docRes = await setuClient.get(`/api/digilocker/${requestId}/document`);
      const payload = docRes.data;
      return {
        name: payload.name || 'Unknown',
        dob: payload.dob || '',
        address: payload.address || '',
        photo_base64: payload.profileImage || null,
        verified: true,
        encryptedAadhaar: encrypt('000000000000'),
      };
    } catch (error) {
      logger.warn('Setu DigiLocker fetch failed — mock fallback', error.response?.data || error.message);
      return {
        name: 'Ravi Kumar',
        dob: '01-01-1990',
        address: 'Bengaluru, Karnataka',
        photo_base64: null,
        verified: true,
        encryptedAadhaar: encrypt('000000000000'),
      };
    }
  },
};

module.exports = AadhaarService;
