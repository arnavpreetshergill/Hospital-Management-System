// patientModel.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const patientSchema = new Schema({
    // Link to the User auth schema
    HospitalID: {
        type: String,
        required: true,
        unique: true
    },
    medicalHistory: {
        type: Array,
        default: []
    },
    bloodType: {
        type: String
    }
    // Add other patient-specific medical fields here
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);