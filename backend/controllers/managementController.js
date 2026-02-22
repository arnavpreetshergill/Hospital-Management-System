const express = require('express');
const {loginUser, signupUser} = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');
const Authorize = require('../middleware/roleAuth');
const mongoose = require('mongoose');
const router = express.Router();
const Patient = require('../models/patientModel');

const getPatient = async(requireAuth,res)=>
{

    const HospitalID = requireAuth.params;
    if(!mongoose.Types.ObjectId.isValid(id))
    {
        return res.status(400).json({message: "Invalid patient ID"});
    }
    const patient = await Patient.find({HospitalID: HospitalID});

    if(!patient || patient.length === 0){
        return res.status(404).json({error: 'no such patient'});
    }
    res.status(200).json(patient);
}