const User = require('../models/User');
const Joi = require('joi');
const { createNotification } = require('./notificationController');
const { processProfilePicture, processCoverImage } = require('../utils/fileProcessing');
const fs = require('fs').promises;
const path = require('path');

const updateProfileSchema = Joi.object({
    name: Joi.string().min(2).max(50),
    username: Joi.string().alphanum().min(3).max(30),
    cityState: Joi.string().allow('').max(100),
    title: Joi.string().allow('').max(500),
    summary: Joi.string().allow('').max(1000),
    coverImage: Joi.string().allow('none'),
    link: Joi.string().uri().allow(''),
    socialLinks: Joi.object({
        instagram: Joi.string().uri().allow(''),
        linkedin: Joi.string().uri().allow(''),
        facebook: Joi.string().uri().allow(''),
        twitter: Joi.string().uri().allow('')
    })
}).min(1); // Ensure at least one field is being updated

exports.updateProfileImage = async (req, res, next) => {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        let updateData = {};

        if (req.files) {
            if (req.files.profilePicture) {
                const profilePictureUrl = await processProfilePicture(
                    req.files.profilePicture[0],
                    user.username
                );

                // Delete old profile picture if it exists and isn't the default
                if (user.profilePicture && !user.profilePicture.includes('default-profile.jpg')) {
                    const oldFilePath = path.join(__dirname, '..', 'public', user.profilePicture);
                    try {
                        await fs.access(oldFilePath);
                        await fs.unlink(oldFilePath);
                    } catch (error) {
                        console.log('Old profile picture not found or could not be deleted');
                    }
                }

                updateData.profilePicture = profilePictureUrl;
            }

            if (req.files.coverImage) {
                const coverImageUrl = await processCoverImage(
                    req.files.coverImage[0],
                    user.username
                );

                // Delete old cover image if it exists and isn't the default
                if (user.coverImage && !user.coverImage.includes('default-cover.jpg')) {
                    const oldFilePath = path.join(__dirname, '..', 'public', user.coverImage);
                    try {
                        await fs.access(oldFilePath);
                        await fs.unlink(oldFilePath);
                    } catch (error) {
                        console.log('Old cover image not found or could not be deleted');
                    }
                }

                updateData.coverImage = coverImageUrl;
            }
        }

        if (Object.keys(updateData).length === 0) {
            const err = new Error('No image file provided');
            err.status = 400;
            throw err;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true })
            .select('-password');

        if (!updatedUser) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        res.json({
            user: {
                id: updatedUser._id,
                profilePicture: updatedUser.profilePicture,
                coverImage: updatedUser.coverImage
            }
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to safely delete a file
const safeDeleteFile = async (filePath) => {
    try {
        await fs.access(filePath);
        await fs.unlink(filePath);
    } catch (error) {
        console.log(`File ${filePath} does not exist or could not be deleted`);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        if (typeof req.body.socialLinks === 'string') {
            req.body.socialLinks = JSON.parse(req.body.socialLinks);
        }

        const { error } = updateProfileSchema.validate(req.body);
        if (error) {
            const err = new Error(error.details[0].message);
            err.status = 400;
            throw err;
        }


        const { name, cityState, title, summary, username, socialLinks, link } = req.body;
        const userId = req.userId;

        let updateData = { name, cityState, title, summary, link };

        if (socialLinks) {
            updateData.socialLinks = socialLinks;
        }

        if (username) {
            const existingUser = await User.findOne({ username, _id: { $ne: userId } });
            if (existingUser) {
                const err = new Error('Username is already taken');
                err.status = 400;
                throw err;
            }
            updateData.username = username;
        }

        const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true }).select('-password');

        if (!updatedUser) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        res.json({
            user: {
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                username: updatedUser.username,
                profilePicture: updatedUser.profilePicture,
                coverImage: updatedUser.coverImage,
                cityState: updatedUser.cityState,
                title: updatedUser.title,
                link: updatedUser.link,
                summary: updatedUser.summary,
                socialLinks: updatedUser.socialLinks
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const user = await User.findOne({ username: req.params.username })
            .select('-password')

        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        // Get counts
        const followersCount = user.followers.length;
        const followingCount = user.following.length;

        res.json({
            user,
            followersCount,
            followingCount
        });
    } catch (error) {
        next(error);
    }
};

exports.getCurrentUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId).select('-password');
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }
        res.json(user);
    } catch (error) {
        next(error);
    }
};

exports.getPaginatedFollowing = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // First, get the total count of following
        const user = await User.findById(userId);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const totalFollowing = user.following.length;

        // Then get the paginated following list
        const paginatedUser = await User.findById(userId)
            .populate({
                path: 'following',
                select: 'name username profilePicture',
                options: {
                    skip: skip,
                    limit: limit
                }
            });

        res.json({
            following: paginatedUser.following,
            total: totalFollowing,
            currentPage: page,
            hasMore: totalFollowing > (skip + limit)
        });
    } catch (error) {
        next(error);
    }
};

exports.getPaginatedFollowers = async (req, res, next) => {
    try {
        const userId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // First, get the total count of followers
        const user = await User.findById(userId);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const totalFollowers = user.followers.length;

        // Then get the paginated followers list
        const paginatedUser = await User.findById(userId)
            .populate({
                path: 'followers',
                select: 'name username profilePicture',
                options: {
                    skip: skip,
                    limit: limit
                }
            });

        res.json({
            followers: paginatedUser.followers,
            total: totalFollowers,
            currentPage: page,
            hasMore: totalFollowers > (skip + limit)
        });
    } catch (error) {
        next(error);
    }
};

exports.followUser = async (req, res, next) => {
    try {
        const userToFollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.userId);

        if (!userToFollow) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        if (userToFollow._id.toString() === currentUser._id.toString()) {
            const err = new Error('You cannot follow yourself');
            err.status = 400;
            throw err;
        }

        if (currentUser.following.includes(userToFollow._id)) {
            const err = new Error('You are already following this user');
            err.status = 400;
            throw err;
        }

        currentUser.following.push(userToFollow._id);
        userToFollow.followers.push(currentUser._id);

        await currentUser.save();
        await userToFollow.save();

        // Create notification for follow
        await createNotification(
            userToFollow._id,
            currentUser._id,
            'follow',
            null,
            `${currentUser.name} started following you`
        );

        res.status(200).json({ message: 'Successfully followed user' });
    } catch (error) {
        next(error);
    }
};

exports.unfollowUser = async (req, res, next) => {
    try {
        const userToUnfollow = await User.findById(req.params.id);
        const currentUser = await User.findById(req.userId);

        if (!userToUnfollow) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        if (!currentUser.following.includes(userToUnfollow._id)) {
            const err = new Error('You are not following this user');
            err.status = 400;
            throw err;
        }

        currentUser.following = currentUser.following.filter(
            id => id.toString() !== userToUnfollow._id.toString()
        );
        userToUnfollow.followers = userToUnfollow.followers.filter(
            id => id.toString() !== currentUser._id.toString()
        );

        await currentUser.save();
        await userToUnfollow.save();

        res.status(200).json({ message: 'Successfully unfollowed user' });
    } catch (error) {
        next(error);
    }
};