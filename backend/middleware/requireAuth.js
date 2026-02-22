const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const requireAuth = async (req, res, next) => {
    const { authorization } = req.headers;
    
    if(!authorization){
        return res.status(401).json({
            error: 'Authorization token required'
        });
    }
    
    const token = authorization.split(' ')[1];
    
    try {
        // FIX 1 & 2: Use process.env.SECRET to match your controller, and extract _id
        const { _id } = jwt.verify(token, process.env.SECRET);
        
        // FIX 3: Search the database using the _id we just extracted
        req.user = await User.findOne({ _id }).select('_id HospitalID name email role');
        
        // Safety check just in case the user was deleted from the DB
        if (!req.user) {
            throw new Error('User not found');
        }
        
        next();
    } catch (error) {
        // To help debug future issues, you can log the actual error in your console
        console.log("Auth Error:", error.message); 
        return res.status(401).json({
            error: 'Request is not authorized'
        });
    }
}

module.exports = requireAuth;