const crypto = require('crypto');

const ALGORITHM_AES = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;
const KEY_LENGTH = 32;

/**
 * AES-256-GCM encryption for sensitive patient data at rest.
 * Uses AES_KEY from env (32-byte hex string or base64).
 */
function getAesKey() {
    const key = process.env.AES_KEY;
    if (!key || key === 'YOUR_AES_KEY_HERE') return null;
    if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
        return Buffer.from(key, 'hex');
    }
    return Buffer.from(key, 'base64');
}

function encryptAes(plaintext) {
    if (plaintext === null || plaintext === undefined) return plaintext;
    const key = getAesKey();
    if (!key) return plaintext;
    const str = typeof plaintext === 'string' ? plaintext : JSON.stringify(plaintext);
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM_AES, key, iv);
    let encrypted = cipher.update(str, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${encrypted}:${authTag.toString('base64')}`;
}

function decryptAes(encrypted) {
    if (!encrypted || typeof encrypted !== 'string' || !encrypted.includes(':') || !getAesKey()) {
        return encrypted;
    }
    try {
        const [ivB64, cipherB64, authTagB64] = encrypted.split(':');
        if (!ivB64 || !cipherB64 || !authTagB64) return encrypted;
        const key = getAesKey();
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');
        const decipher = crypto.createDecipheriv(ALGORITHM_AES, key, iv);
        decipher.setAuthTag(authTag);
        return decipher.update(cipherB64, 'base64', 'utf8') + decipher.final('utf8');
    } catch {
        return encrypted;
    }
}

/**
 * RSA for signing audit log entries (integrity verification).
 * Uses RSA_PRIVATE_KEY (PEM) from env.
 */
function getRsaKeys() {
    const privateKey = process.env.RSA_PRIVATE_KEY;
    if (!privateKey) return null;
    return { privateKey };
}

function signRsa(data) {
    const keys = getRsaKeys();
    if (!keys) return null;
    try {
        const sig = crypto.sign('sha256', data, keys.privateKey);
        return sig.toString('base64');
    } catch {
        return null;
    }
}

function encryptPatientData(patient) {
    const obj = patient.toObject ? patient.toObject() : { ...patient };
    if (obj.medicalHistory && Array.isArray(obj.medicalHistory)) {
        try {
            obj.medicalHistoryEncrypted = encryptAes(JSON.stringify(obj.medicalHistory));
            delete obj.medicalHistory;
        } catch (e) {
            console.warn('Encryption of medicalHistory failed:', e.message);
        }
    }
    if (obj.bloodType && typeof obj.bloodType === 'string') {
        try {
            obj.bloodTypeEncrypted = encryptAes(obj.bloodType);
            delete obj.bloodType;
        } catch (e) {
            console.warn('Encryption of bloodType failed:', e.message);
        }
    }
    return obj;
}

function decryptPatientData(doc) {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    if (obj.medicalHistoryEncrypted) {
        try {
            const dec = decryptAes(obj.medicalHistoryEncrypted);
            obj.medicalHistory = JSON.parse(dec);
            delete obj.medicalHistoryEncrypted;
        } catch {
            obj.medicalHistory = [];
        }
    }
    if (obj.bloodTypeEncrypted) {
        try {
            obj.bloodType = decryptAes(obj.bloodTypeEncrypted);
            delete obj.bloodTypeEncrypted;
        } catch {
            obj.bloodType = null;
        }
    }
    return obj;
}

module.exports = {
    encryptAes,
    decryptAes,
    signRsa,
    encryptPatientData,
    decryptPatientData,
};
