const jwt = require('jsonwebtoken');

const optionalAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        // No token provided, continue without setting userId
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
    } catch (err) {
        // Invalid token, but we'll continue without setting userId
        console.error('Invalid token in optional auth:', err);
    }

    next();
};

module.exports = optionalAuth;