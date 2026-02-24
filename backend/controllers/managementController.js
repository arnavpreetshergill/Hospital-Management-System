const mongoose = require('mongoose');
const Patient = require('../models/patientModel');
const { encryptPatientData, decryptPatientData, hashValue } = require('../utils/encryption');
const { generatePatientSummary } = require('../services/geminiService');
const { logActivity } = require('../utils/activityLogger');

function hospitalLookupFilter(hospitalId) {
    const hospitalHash = hashValue(hospitalId);
    return {
        $or: [
            { HospitalIDHash: hospitalHash },
            { HospitalID: hospitalHash },
            { HospitalID: hospitalId },
        ],
    };
}

function isSamePatientOwner(reqUser, patientObj) {
    if (reqUser?.role !== 'patient') return true;
    return Boolean(patientObj?.HospitalID) && patientObj.HospitalID === reqUser.HospitalID;
}

const getPatients = async (req, res) => {
    const filter = req.user?.role === 'patient'
        ? hospitalLookupFilter(req.user.HospitalID)
        : {};

    const patients = await Patient.find(filter).sort({ createdAt: -1 });
    const decrypted = patients
        .map((p) => decryptPatientData(p))
        .filter((p) => isSamePatientOwner(req.user, p))
        .map((p) => {
            if (req.user?.role === 'patient') delete p.aiSummary;
            return p;
        });

    res.status(200).json(decrypted);
};

const getPatient = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid patient ID" });
    }
    const patient = await Patient.findOne({ _id: id });
    if (!patient) {
        return res.status(404).json({ error: 'no such patient' });
    }

    const obj = decryptPatientData(patient);
    if (!isSamePatientOwner(req.user, obj)) {
        return res.status(403).json({ error: 'Forbidden: cannot access another patient record' });
    }

    if (req.user?.role === 'patient') delete obj.aiSummary;
    res.status(200).json(obj);
};

const deletePatient = async (req, res) => {
    if (req.user?.role === 'patient') {
        return res.status(403).json({ error: 'Patients cannot delete records' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'No such patient' });
    }

    const patient = await Patient.findOneAndDelete({ _id: id });
    if (!patient) {
        return res.status(404).json({ error: 'No such patient' });
    }

    const decrypted = decryptPatientData(patient);
    await logActivity('patient_delete', req.user, { patientId: id, HospitalID: decrypted.HospitalID }, req);
    res.status(200).json(decrypted);
};

const updatePatient = async (req, res) => {
    if (req.user?.role === 'patient') {
        return res.status(403).json({ error: 'Patients cannot edit records' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'No such patient' });
    }

    const updates = {};
    const unsets = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'medicalHistory')) {
        if (!Array.isArray(req.body.medicalHistory)) {
            return res.status(400).json({ error: 'medicalHistory must be an array' });
        }
        const encrypted = encryptPatientData({ medicalHistory: req.body.medicalHistory });
        updates.medicalHistoryEncrypted = encrypted.medicalHistoryEncrypted;
        unsets.medicalHistory = '';
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'bloodType')) {
        if (req.body.bloodType === undefined || req.body.bloodType === null || req.body.bloodType === '') {
            unsets.bloodTypeEncrypted = '';
            unsets.bloodType = '';
        } else {
            const encrypted = encryptPatientData({ bloodType: req.body.bloodType });
            updates.bloodTypeEncrypted = encrypted.bloodTypeEncrypted;
            unsets.bloodType = '';
        }
    }

    if (Object.keys(updates).length === 0 && Object.keys(unsets).length === 0) {
        return res.status(400).json({ error: 'No valid updates provided' });
    }

    const updateDoc = {};
    if (Object.keys(updates).length > 0) updateDoc.$set = updates;
    if (Object.keys(unsets).length > 0) updateDoc.$unset = unsets;

    const patient = await Patient.findOneAndUpdate({ _id: id }, updateDoc, { new: true, runValidators: true });
    if (!patient) {
        return res.status(404).json({ error: 'No such patient' });
    }

    const obj = decryptPatientData(patient);
    await logActivity('patient_update', req.user, { patientId: id, HospitalID: obj.HospitalID }, req);
    if (req.user?.role === 'patient') delete obj.aiSummary;
    res.status(200).json(obj);
};

const regenerateAiSummary = async (req, res) => {
    if (req.user?.role === 'patient') {
        return res.status(403).json({ error: 'Patients cannot generate AI summaries' });
    }

    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid patient ID' });
    }
    try {
        const summary = await generatePatientSummary(id);
        await logActivity('ai_summary_generated', req.user, { patientId: id }, req);
        res.status(200).json({ aiSummary: summary });
    } catch (err) {
        res.status(500).json({ error: err.message || 'Failed to generate AI summary' });
    }
};

module.exports = { getPatients, getPatient, deletePatient, updatePatient, regenerateAiSummary };
