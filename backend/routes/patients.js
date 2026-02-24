const express = require('express');
const { getPatients, getPatient, deletePatient, updatePatient, regenerateAiSummary } = require('../controllers/managementController');
const requireAuth = require('../middleware/requireAuth');
const roleAuth = require('../middleware/roleAuth');

const router = express.Router();
router.use(requireAuth);

router.get('/', roleAuth('admin', 'doctor', 'patient'), getPatients);
router.post('/:id/ai-summary', roleAuth('admin', 'doctor'), regenerateAiSummary);
router.get('/:id', roleAuth('admin', 'doctor', 'patient'), getPatient);
router.delete('/:id', roleAuth('admin'), deletePatient);
router.patch('/:id', roleAuth('admin', 'doctor'), updatePatient);

module.exports = router;
