const mongoose = require('mongoose');
const User = require('../models/userModel');
const Patient = require('../models/patientModel');
const jwt = require('jsonwebtoken');
const { logActivity } = require('../utils/activityLogger');
const { hashValue } = require('../utils/encryption');

const createToken = (_id) => {
    return jwt.sign({ _id }, process.env.SECRET, { expiresIn: '3d' });
};

const loginUser = async (req, res) => {
    const { HospitalID, password } = req.body;
    try {
        const user = await User.login(HospitalID, password);
        const token = createToken(user._id);
        const decryptedUser = User.toPublic(user);
        await logActivity(
            'login',
            { _id: user._id, HospitalID: decryptedUser.HospitalID, role: decryptedUser.role },
            { success: true },
            req
        );
        res.status(200).json({ HospitalID: decryptedUser.HospitalID, token });
    } catch (error) {
        await logActivity('login', null, { HospitalID, success: false, error: error.message }, req);
        res.status(400).json({ error: error.message });
    }
};

const signupUser = async (req, res) => {
    const { HospitalID, password, name, email, phoneNumber, role } = req.body;
    const requestedRole = String(role || 'patient').toLowerCase();
    try {
        // Doctors can only create patients
        if (req.user.role === 'doctor' && requestedRole !== 'patient') {
            return res.status(403).json({ error: 'Doctors can only create patient accounts' });
        }

        const user = await User.signup(HospitalID, password, name, email, phoneNumber, requestedRole);
        const decryptedUser = User.toPublic(user);
        await logActivity('signup', req.user, { createdHospitalID: HospitalID, createdRole: requestedRole }, req);
        if (requestedRole === 'patient') {
            await logActivity('patient_create', req.user, { HospitalID }, req);
        }
        res.status(200).json({ HospitalID: decryptedUser.HospitalID });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getMe = async (req, res) => {
    res.status(200).json({
        HospitalID: req.user.HospitalID,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
    });
};

const getDoctors = async (req, res) => {
    const doctorHash = hashValue('doctor');
    const users = await User.find({
        $or: [
            { roleHash: doctorHash },
            { role: doctorHash },
            { role: 'doctor' },
        ],
    })
        .sort({ createdAt: -1 })
        .lean();

    const doctors = users
        .map((doc) => User.toPublic(doc))
        .filter((doc) => doc?.role === 'doctor')
        .map((doc) => ({
            _id: doc._id,
            HospitalID: doc.HospitalID,
            name: doc.name,
            email: doc.email,
            phoneNumber: doc.phoneNumber,
            createdAt: doc.createdAt,
        }));

    res.status(200).json(doctors);
};

const getDoctor = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid doctor ID' });
    }

    const user = await User.findById(id).lean();
    const decryptedUser = User.toPublic(user);
    if (!decryptedUser || decryptedUser.role !== 'doctor') {
        return res.status(404).json({ error: 'Doctor not found' });
    }

    res.status(200).json(decryptedUser);
};

const deleteUser = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user ID' });
    }

    if (req.user._id.toString() === id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const decryptedUser = User.toPublic(user);
    if (decryptedUser?.role === 'doctor') {
        await logActivity('doctor_delete', req.user, { deletedHospitalID: decryptedUser.HospitalID }, req);
    }

    if (decryptedUser?.role === 'patient' && decryptedUser.HospitalID) {
        const hospitalHash = hashValue(decryptedUser.HospitalID);
        await Patient.findOneAndDelete({
            $or: [
                { HospitalIDHash: hospitalHash },
                { HospitalID: hospitalHash },
                { HospitalID: decryptedUser.HospitalID },
            ],
        });
    }

    res.status(200).json({ message: 'User deleted' });
};

module.exports = { loginUser, signupUser, getMe, getDoctors, getDoctor, deleteUser };
