const express = require('express');
const router = express.Router();
const { loginUser, signupUser, getMe, getDoctors, getDoctor, deleteUser } = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const Authorize = require('../middleware/roleAuth');

router.post('/login', loginUser);
router.post('/signup', requireAuth, Authorize('admin', 'doctor'), signupUser);
router.get('/me', requireAuth, getMe);
router.get('/doctors', requireAuth, Authorize('admin'), getDoctors);
router.get('/doctors/:id', requireAuth, Authorize('admin'), getDoctor);
router.delete('/:id', requireAuth, Authorize('admin'), deleteUser);

module.exports = router;