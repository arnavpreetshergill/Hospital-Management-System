// patientModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const patientSchema = new Schema({
    HospitalID: {
        type: String,
        index: true
    },
    HospitalIDEncrypted: { type: String },
    HospitalIDHash: { type: String, unique: true, sparse: true, index: true },
    medicalHistory: {
        type: Array
    },
    medicalHistoryEncrypted: { type: String },
    bloodType: { type: String },
    bloodTypeEncrypted: { type: String },
    aiSummary: { type: String },
    aiSummaryEncrypted: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
