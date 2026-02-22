const express = require('express');
const {loginUser, signupUser} = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const Authorize = require('../middleware/roleAuth');
const router = express.Router();

router.post('/login', loginUser);
router.post('/signup', signupUser);
