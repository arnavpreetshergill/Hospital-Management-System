const express = require('express');
const router = express.Router();
const {loginUser, signupUser} = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const Authorize = require('../middleware/roleAuth');


router.post('/login', loginUser);
router.post('/signup', requireAuth, Authorize('admin'), signupUser);

module.exports = router;