const express = require('express');
const { updateProfile, getProfile, getCurrentUser, followUser, unfollowUser, updateProfileImage, getPaginatedFollowers, getPaginatedFollowing } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

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


module.exports = router;