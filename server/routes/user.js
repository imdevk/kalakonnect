const express = require('express');
const { updateProfile, getProfile, getCurrentUser, followUser, unfollowUser, updateProfileImage, getPaginatedFollowers, getPaginatedFollowing } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for user profile uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, '..', 'public', 'uploads', 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true, mode: 0o777 });
        }
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit for images
    }
});

router.put('/profile', auth, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), updateProfile);
router.get('/profile/:username', getProfile);
router.get('/me', auth, getCurrentUser);
router.post('/follow/:id', auth, followUser);
router.post('/unfollow/:id', auth, unfollowUser);
router.put('/profile-image', auth, upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
]), updateProfileImage);
router.get('/:id/followers', getPaginatedFollowers);
router.get('/:id/following', getPaginatedFollowing);

// Error handling middleware for this router
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File is too large. Images must be under 50MB.'
            });
        }
        return res.status(400).json({ message: err.message });
    }
    next(err);
});

module.exports = router;