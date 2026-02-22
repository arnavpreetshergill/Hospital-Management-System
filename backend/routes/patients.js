const express = require('express');
const { getPatients, getPatient, deletePatient, updatePatient } = require('../controllers/managementController');
const requireAuth = require('../middleware/requireAuth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();
router.use(requireAuth);
const Patient = require('../models/patientModel');

router.get('/patients',roleAuth('admin', 'doctor'), getPatients);
router.get('/patients/:id', roleAuth('admin', 'doctor', 'Patient'), getPatient);
router.delete('/patients/:id', roleAuth('admin'), deletePatient);
router.patch('/patients/:id', roleAuth('admin', 'doctor'), updatePatient);

module.exports = router;