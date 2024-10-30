const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const Joi = require('joi');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            username: user.username,
            name: user.name,
            email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

//Validation Schemas
const signupSchema = Joi.object({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    // password: Joi.string().required().min(8),
    password: Joi.string()
        .required()
        .min(8)
        .pattern(new RegExp('^[a-zA-Z0-9!@#$%^&*]{8,30}$')) // Only allow specific characters
        .pattern(new RegExp('(?=.*[0-9])')) // At least one number
        .pattern(new RegExp('(?=.*[a-zA-Z])')) // At least one letter
        .pattern(new RegExp('(?=.*[!@#$%^&*])')) // At least one special character
        .messages({
            'string.pattern.base': 'Password must contain at least one letter, one number, and one special character.',
            'string.min': 'Password must be at least {#limit} characters long.',
        }),
    username: Joi.string().alphanum().min(3).max(30).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.signup = async (req, res, next) => {
    try {
        const { error } = signupSchema.validate(req.body);
        if (error) {
            const err = new Error(error.details[0].message);
            err.status = 400;
            throw err;
        }

        const { name, email, password, username } = req.body;

        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            const err = new Error('Username is already taken');
            err.status = 400;
            throw err;
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            const err = new Error('User already exists');
            err.status = 400;
            throw err;
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: hashedPassword, username, isVerified: false });
        const token = generateToken(user);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.sendVerificationEmail = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'User is already verified' });
        }

        const verificationToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        // Send verification email
        const transporter = nodemailer.createTransport({
            // Configure your email service here
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: 'Verify Your Email',
            text: `Please click on this link to verify your email: ${process.env.CLIENT_URL}/verify/${verificationToken}`
        };

        await transporter.sendMail(mailOptions);

        res.json({ message: 'Verification email sent. Please check your email.' });
    } catch (error) {
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.params;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        if (user.isVerified) {
            return res.status(200).json({
                message: 'Email verified successfully.',
                status: 'success'
            });
        }

        user.isVerified = true;
        await user.save();

        res.status(200).json({
            message: 'Email verified successfully. You can now post artworks.',
            status: 'verified'
        });
    } catch (error) {
        console.error('Error verifying email:', error);
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(400).json({ message: 'Invalid or expired verification token' });
        }
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
        await user.save();

        const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: user.email,
            subject: 'Password Reset',
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
                   Please click on the following link, or paste this into your browser to complete the process:\n\n
                   ${resetURL}\n\n
                   If you did not request this, please ignore this email and your password will remain unchanged.\n`
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
};

exports.resetPassword = async (req, res, next) => {
    try {
        const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpires: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        user.password = await bcrypt.hash(req.body.password, 12);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset' });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { error } = loginSchema.validate(req.body);

        if (error) {
            const err = new Error(error.details[0].message);
            err.status = 400;
            throw err;
        }

        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            const err = new Error('Invalid credentials');
            err.status = 400;
            throw err;
        }

        const token = generateToken(user);
        res.status(200).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.googleLogin = async (req, res) => {
    const { credential } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { email, name, picture } = payload;

        let user = await User.findOne({ email });

        if (!user) {
            let username = email.split('@')[0];
            let usernameTaken = await User.findOne({ username });
            let counter = 1;

            while (usernameTaken) {
                username = `${email.split('@')[0]}${counter}`;
                usernameTaken = await User.findOne({ username });
                counter++;
            }

            user = new User({
                email,
                name,
                profilePicture: picture,
                googleId: payload['sub'],
                username,
                isVerified: true
            });
            await user.save();
        } else if (!user.isVerified) {
            // If the user exists but wasn't verified, set isVerified to true
            user.isVerified = true;
            await user.save();
        }

        const token = generateToken(user);

        res.json({
            token, user: {
                id: user._id,
                name: user.name,
                email: user.email,
                username: user.username,
                isVerified: user.isVerified
            }
        });
    } catch (error) {
        console.error('Google auth error:', error);
        res.status(500).json({ message: 'Authentication failed', error: error.message });
    }
};