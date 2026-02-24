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
        const { _id } = jwt.verify(token, process.env.SECRET);

        const userDoc = await User.findById(_id);
        if (!userDoc) {
            throw new Error('User not found');
        }

        const decrypted = User.toPublic(userDoc);
        req.user = {
            _id: userDoc._id,
            HospitalID: decrypted.HospitalID,
            name: decrypted.name,
            email: decrypted.email,
            role: decrypted.role,
        };

        next();
    } catch (error) {
        console.log('Auth Error:', error.message);
        return res.status(401).json({
            error: 'Request is not authorized'
        });
    }
}

module.exports = requireAuth;
