const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Patient = require('./patientModel');
const {
    encryptPatientData,
    encryptUserData,
    decryptUserData,
    hashValue,
} = require('../utils/encryption');

const Schema = mongoose.Schema;
const ALLOWED_ROLES = ['admin', 'doctor', 'patient'];

const userSchema = new Schema({
    // Legacy/plain fields are retained for backward compatibility but now store hashed values.
    HospitalID: { type: String, index: true },
    HospitalIDEncrypted: { type: String },
    HospitalIDHash: { type: String, unique: true, sparse: true, index: true },
    password: { type: String, required: true },
    name: { type: String },
    nameEncrypted: { type: String },
    email: { type: String },
    emailEncrypted: { type: String },
    phoneNumber: { type: String },
    phoneNumberEncrypted: { type: String },
    role: { type: String, index: true },
    roleEncrypted: { type: String },
    roleHash: { type: String, index: true },
}, { timestamps: true });

function requireNonEmpty(value, fieldName) {
    if (value === undefined || value === null) {
        throw new Error(`${fieldName} is required`);
    }
    const normalized = String(value).trim();
    if (!normalized) {
        throw new Error(`${fieldName} is required`);
    }
    return normalized;
}

function normalizeRole(role) {
    const normalized = requireNonEmpty(role || 'patient', 'Role').toLowerCase();
    if (!ALLOWED_ROLES.includes(normalized)) {
        throw new Error('Invalid role');
    }
    return normalized;
}

userSchema.statics.toPublic = function toPublic(userDoc) {
    if (!userDoc) return null;
    const user = decryptUserData(userDoc);
    return {
        _id: user._id,
        HospitalID: user.HospitalID,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
};

userSchema.statics.ensureEncryptedStorage = async function ensureEncryptedStorage(userDoc) {
    if (!userDoc) return;

    const user = this.toPublic(userDoc);
    if (!user || !user.HospitalID || !user.role) return;

    const encryptedData = encryptUserData({
        HospitalID: user.HospitalID,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
    });

    const fieldsToSync = [
        'HospitalID',
        'HospitalIDEncrypted',
        'HospitalIDHash',
        'name',
        'nameEncrypted',
        'email',
        'emailEncrypted',
        'phoneNumber',
        'phoneNumberEncrypted',
        'role',
        'roleEncrypted',
        'roleHash',
    ];

    let hasChanges = false;
    for (const field of fieldsToSync) {
        if (encryptedData[field] !== undefined && userDoc[field] !== encryptedData[field]) {
            userDoc[field] = encryptedData[field];
            hasChanges = true;
        }
    }

    if (hasChanges) {
        await userDoc.save();
    }
};

userSchema.statics.signup = async function signup(HospitalID, password, name, email, phoneNumber, role) {
    const normalizedHospitalID = requireNonEmpty(HospitalID, 'Hospital ID');
    const normalizedName = requireNonEmpty(name, 'Name');
    const normalizedEmail = requireNonEmpty(email, 'Email');
    const normalizedRole = normalizeRole(role);

    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('Password is required');
    }

    const hospitalHash = hashValue(normalizedHospitalID);
    const existing = await this.findOne({
        $or: [
            { HospitalIDHash: hospitalHash },
            { HospitalID: hospitalHash },
            { HospitalID: normalizedHospitalID },
        ],
    }).lean();

    if (existing) {
        throw new Error('Hospital ID already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const encryptedUser = encryptUserData({
        HospitalID: normalizedHospitalID,
        name: normalizedName,
        email: normalizedEmail,
        phoneNumber: phoneNumber === undefined || phoneNumber === null || phoneNumber === '' ? undefined : String(phoneNumber),
        role: normalizedRole,
    });

    const user = await this.create({
        ...encryptedUser,
        password: hash,
    });

    if (normalizedRole === 'patient') {
        const patientData = encryptPatientData({
            HospitalID: normalizedHospitalID,
            medicalHistory: [],
        });
        await Patient.create(patientData);
    }

    return user;
};

userSchema.statics.login = async function login(HospitalID, password) {
    const normalizedHospitalID = requireNonEmpty(HospitalID, 'Hospital ID');
    if (typeof password !== 'string' || password.length === 0) {
        throw new Error('Invalid Hospital ID or password');
    }

    const hospitalHash = hashValue(normalizedHospitalID);
    const user = await this.findOne({
        $or: [
            { HospitalIDHash: hospitalHash },
            { HospitalID: hospitalHash },
            { HospitalID: normalizedHospitalID },
        ],
    });

    if (!user) {
        throw new Error('Invalid Hospital ID or password');
    }

    const publicUser = this.toPublic(user);
    if (!publicUser || publicUser.HospitalID !== normalizedHospitalID) {
        throw new Error('Invalid Hospital ID or password');
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        throw new Error('Invalid Hospital ID or password');
    }

    await this.ensureEncryptedStorage(user);
    return user;
};

module.exports = mongoose.model('User', userSchema);
