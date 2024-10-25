const express = require('express');
const { signup, login, googleLogin, sendVerificationEmail, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const auth = require('../middlewares/auth');

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', async (req, res, next) => {
    try {
        console.log('Received Google login request:', req.body);
        await googleLogin(req, res);
    } catch (error) {
        console.error('Error in Google login route:', error);
        next(error);
    }
});
router.post('/send-verification', auth, sendVerificationEmail);
router.get('/verify/:token', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
