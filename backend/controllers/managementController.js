const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Patient = require('../models/patientModel');

const getPatients = async(req, res) => 
{
    const patients  = await Patient.find({}).sort({createdAt: -1});
    res.status(200).json(patients);
}

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

const deletePatient = async (req,res) => {
    const {id} = req.params;
    if(!mongoose.Types.ObjectId.isValid(id))
    {
        return res.status(400).json({error: 'No such patient'});
    }
    const patient  = await Patient.findOneAndDelete({_id: id});
    if (!patient)
    {
        return res.status(404).json({error: 'No such patient'});
    }
    res.status(200).json(patient);
}

const updatePatient = async (req,res) => {
    const {id} = req.params;
    if(!mongoose.Types.ObjectId.isValid(id))    
    {
        return res.status(400).json({error: 'No such patient'});
    }
    const patient  = await Patient.findOneAndUpdate({_id: id}, {...req.body});
    if (!patient){
        return res.status(404).json({error: 'No such patient'});
    }
    res.status(200).json(patient);
}

module.exports = { getPatients, getPatient, deletePatient, updatePatient };