const mongoose = require('mongoose');
const bcrypt = require('bcrypt'); // Added bcrypt import
const Patient = require('./patientModel'); // 1. Import your Patient model

const Schema = mongoose.Schema;

const userSchema = new Schema({
    HospitalID: { type: String, required: true, unique: true }, 
    password: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phoneNumber: { type: Number },
    role: { 
        type: String,
        enum: ['admin', 'doctor', 'patient'],
        required: true,
        default: 'patient'
    }
}, { timestamps: true });

userSchema.statics.signup = async function (HospitalID, password, name, email, phoneNumber, role) {
    // Note: corrected 'gensalt' to 'genSalt'
    const salt  = await bcrypt.genSalt(10); 
    const hash = await bcrypt.hash(password, salt);
    
    // 2. Create the User auth record
    const user = await this.create({ HospitalID, password: hash, name, email, phoneNumber, role });
    
    // 3. If the role is patient, create the linked Patient profile
    if (role === 'patient') {
        await Patient.create({
            HospitalID: user.HospitalID,
            // You can initialize other empty patient fields here if needed
            medicalHistory: [],
            assignedDoctor: null
        });
    }
    
    return user;
}

// ... your login method remains exactly the same ...

module.exports = mongoose.model('User', userSchema);