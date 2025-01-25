const jwt = require('jsonwebtoken');

const verifyTokenMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }


    const secretKey = process.env.JWT_SECRET || 'your_secret_key_here'; // Replace with your actual secret key
    const decoded = jwt.verify(token, secretKey);

    req.user = decoded;

    res.locals.userData = {
      FactoryID: decoded.factoryId,
      user: decoded.user,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

module.exports = verifyTokenMiddleware;
