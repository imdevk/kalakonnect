const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String },
    profilePicture: { type: String, default: 'https://res.cloudinary.com/dn2ltgq5m/image/upload/v1727890022/defaultProfilePicture_fvpse2.jpg' },
    coverImage: { type: String, default: 'none' },
    cityState: { type: String },
    title: { type: String },
    summary: { type: String },
    googleId: { type: String },
    isVerified: { type: Boolean, default: false },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    link: {
        type: String,
        trim: true
    },
    socialLinks: {
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' }
    },
    artworks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artwork' }],
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    totalViews: { type: Number, default: 0 },
    notifications: [{
        notification: { type: mongoose.Schema.Types.ObjectId, ref: 'Notification' },
        read: { type: Boolean, default: false }
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);