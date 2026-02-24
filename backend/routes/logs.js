const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logsController');
const requireAuth = require('../middleware/requireAuth');
const roleAuth = require('../middleware/roleAuth');

router.get('/', requireAuth, roleAuth('admin'), getLogs);

module.exports = router;
