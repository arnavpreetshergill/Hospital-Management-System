const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

const createToken = (_id) => {
    return jwt.sign({_id}, process.env.SECRET, {expiresIn: '3d'});
}

const loginUser = async(req,res) => {
    const {HospitalID, password} = req.body;
    try{
        const user = await User.login(HospitalID, password);
        const token = createToken(user._id);
        res.status(200).json({HospitalID, token});
    }
    catch (error){
        res.status(400).json({error: error.message});
    }
}

const signupUser = async(req,res) => {

    const {HospitalID, password, name, email, phoneNumber, role} = req.body;
    try{
        const user = await User.signup(HospitalID, password, name, email, phoneNumber, role);
        const token = createToken(user._id);
        res.status(200).json({HospitalID, token});
    }
    catch (error){
        res.status(400).json({error: error.message});
    }
}
module.exports = {loginUser, signupUser};