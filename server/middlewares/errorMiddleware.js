const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ message: 'Validation Error', errors });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({ message: `Duplicate field value: ${field}` });
    }

    // JWT authentication error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // JWT expired error
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
    }

    // Mongoose CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        return res.status(404).json({
            message: 'Resource not found'
        });
    }

    // Username validation error
    if (err.message && err.message.includes('username')) {
        return res.status(400).json({
            message: err.message
        });
    }

    // Profile not found error
    if (err.message === 'User not found' || err.message === 'Profile not found') {
        return res.status(404).json({
            message: err.message
        });
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(error => error.message);
        return res.status(400).json({ message: 'Validation Error', errors });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({ message: `Duplicate field value: ${field}` });
    }

    // JWT authentication error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // JWT expired error
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
    }

    // Handle known custom errors (like 404s)
    if (err.status === 404) {
        return res.status(404).json({
            message: err.message || 'Resource not found'
        });
    }

    // Handle unauthorized access
    if (err.status === 403) {
        return res.status(403).json({
            message: err.message || 'Access forbidden'
        });
    }

    // Default to 500 server error
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

module.exports = errorHandler;