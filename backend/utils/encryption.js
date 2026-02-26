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

function hashValue(value) {
    if (value === undefined || value === null) return value;
    let normalized;
    if (typeof value === 'string') {
        normalized = value;
    } else {
        try {
            normalized = JSON.stringify(value);
        } catch {
            normalized = String(value);
        }
    }
    return crypto.createHash('sha256').update(normalized).digest('hex');
}

function encryptUserData(user) {
    const obj = user?.toObject ? user.toObject() : { ...(user || {}) };

    if (obj.HospitalID !== undefined && obj.HospitalID !== null && obj.HospitalID !== '') {
        const hospitalId = String(obj.HospitalID);
        obj.HospitalIDHash = hashValue(hospitalId);
        obj.HospitalIDEncrypted = encryptAes(hospitalId);
        obj.HospitalID = obj.HospitalIDHash;
    }

    if (obj.name !== undefined && obj.name !== null && obj.name !== '') {
        const name = String(obj.name);
        obj.nameEncrypted = encryptAes(name);
        obj.name = hashValue(name);
    }

    if (obj.email !== undefined && obj.email !== null && obj.email !== '') {
        const email = String(obj.email);
        obj.emailEncrypted = encryptAes(email);
        obj.email = hashValue(email);
    }

    if (obj.phoneNumber !== undefined && obj.phoneNumber !== null && obj.phoneNumber !== '') {
        const phone = String(obj.phoneNumber);
        obj.phoneNumberEncrypted = encryptAes(phone);
        obj.phoneNumber = hashValue(phone);
    }

    if (obj.role !== undefined && obj.role !== null && obj.role !== '') {
        const role = String(obj.role).toLowerCase();
        obj.roleHash = hashValue(role);
        obj.roleEncrypted = encryptAes(role);
        obj.role = obj.roleHash;
    }

    return obj;
}

function decryptUserData(doc) {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : { ...doc };

    if (obj.HospitalIDEncrypted) {
        try {
            obj.HospitalID = decryptAes(obj.HospitalIDEncrypted);
        } catch {
            // Keep existing value for legacy compatibility.
        }
    }

    if (obj.nameEncrypted) {
        try {
            obj.name = decryptAes(obj.nameEncrypted);
        } catch {
            // Keep existing value for legacy compatibility.
        }
    }

    if (obj.emailEncrypted) {
        try {
            obj.email = decryptAes(obj.emailEncrypted);
        } catch {
            // Keep existing value for legacy compatibility.
        }
    }

    if (obj.phoneNumberEncrypted) {
        try {
            obj.phoneNumber = decryptAes(obj.phoneNumberEncrypted);
        } catch {
            // Keep existing value for legacy compatibility.
        }
    }

    if (obj.roleEncrypted) {
        try {
            obj.role = decryptAes(obj.roleEncrypted);
        } catch {
            // Keep existing value for legacy compatibility.
        }
    }

    return obj;
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
    if (obj.HospitalID !== undefined && obj.HospitalID !== null && obj.HospitalID !== '') {
        const hospitalId = String(obj.HospitalID);
        obj.HospitalIDHash = hashValue(hospitalId);
        obj.HospitalIDEncrypted = encryptAes(hospitalId);
        obj.HospitalID = obj.HospitalIDHash;
    }
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
    if (obj.aiSummary && typeof obj.aiSummary === 'string') {
        try {
            obj.aiSummaryEncrypted = encryptAes(obj.aiSummary);
            obj.aiSummary = hashValue(obj.aiSummary);
        } catch (e) {
            console.warn('Encryption of aiSummary failed:', e.message);
        }
    }
    return obj;
}

function decryptPatientData(doc) {
    if (!doc) return doc;
    const obj = doc.toObject ? doc.toObject() : { ...doc };
    if (obj.HospitalIDEncrypted) {
        try {
            obj.HospitalID = decryptAes(obj.HospitalIDEncrypted);
        } catch {
            // Keep existing value for legacy compatibility.
        }
    }
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
    if (obj.aiSummaryEncrypted) {
        try {
            obj.aiSummary = decryptAes(obj.aiSummaryEncrypted);
            delete obj.aiSummaryEncrypted;
        } catch {
            // Keep existing value for legacy compatibility.
        }
    }
    return obj;
}

module.exports = {
    encryptAes,
    decryptAes,
    hashValue,
    encryptUserData,
    decryptUserData,
    signRsa,
    encryptPatientData,
    decryptPatientData,
};
