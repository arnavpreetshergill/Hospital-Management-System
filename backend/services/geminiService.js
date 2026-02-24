const { GoogleGenAI } = require('@google/genai');
const Patient = require('../models/patientModel');
const { decryptPatientData, encryptPatientData } = require('../utils/encryption');

/**
 * Generate AI summary for a patient using Gemini.
 * Place your API key in .env as GEMINI_API_KEY=your_key_here
 */
async function generatePatientSummary(patientId) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        throw new Error('GEMINI_API_KEY not configured. Add it to .env');
    }

    const patient = await Patient.findById(patientId);
    if (!patient) throw new Error('Patient not found');

    const doc = patient.toObject();
    const decrypted = decryptPatientData(patient);

    const payload = {
        HospitalID: decrypted.HospitalID || doc.HospitalID,
        bloodType: decrypted.bloodType || doc.bloodType,
        medicalHistory: decrypted.medicalHistory || doc.medicalHistory || [],
    };

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `You are a medical assistant. Create a concise clinical summary 6-8 for a doctor based on this patient data. Focus on key health indicators and notable history.if you think anything of note or any pattern in observed, include it into the summary

Patient data:
${JSON.stringify(payload, null, 2)}

Provide only the summary text, no labels or preamble.`,

    });

    const text = response.text?.trim() || '';
    if (!text) throw new Error('Gemini returned empty response');

    const encryptedSummary = encryptPatientData({ aiSummary: text });
    await Patient.findByIdAndUpdate(patientId, {
        aiSummary: encryptedSummary.aiSummary,
        aiSummaryEncrypted: encryptedSummary.aiSummaryEncrypted,
    });
    return text;
}

module.exports = { generatePatientSummary };
