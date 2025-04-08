const jwt = require('jsonwebtoken');
const Factory = require('../models/Factories');
const dotenv = require('dotenv').config();
const verifyFactory = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized - No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.Factory = await Factory.findById(decoded.factoryId)
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(401).json({ message: 'Unauthorized - Invalid token' });
    }
};

module.exports = verifyFactory;
