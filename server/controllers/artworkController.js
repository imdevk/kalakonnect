const Artwork = require('../models/Artwork');
const cloudinary = require('../config/cloudinary');
const Joi = require('joi');
const User = require('../models/User');
const { createNotification } = require('./notificationController');

const artworkSchema = Joi.object({
    title: Joi.string().required().min(1).max(100),
    description: Joi.string().allow('').max(1000),
    artStyle: Joi.string().required().max(50),
    software: Joi.array().items(Joi.string().max(50)),
    tags: Joi.array().items(Joi.string().max(30)),
    youtubeUrl: Joi.string().uri().allow('').max(200)
});

const commentSchema = Joi.object({
    content: Joi.string().required().min(1).max(1000)
});

exports.createArtwork = async (req, res, next) => {
    try {

        const user = await User.findById(req.userId);
        if (!user.isVerified) {
            const err = new Error('Your account is not verified. Please verify your email before posting.');
            err.status = 403;
            throw err;
        }


        const { title, description, artStyle, software, tags, youtubeUrl } = req.body;

        const { error } = artworkSchema.validate({
            title,
            description,
            artStyle,
            software: JSON.parse(software),
            tags: JSON.parse(tags),
            youtubeUrl
        });

        if (error) {
            const err = new Error(error.details[0].message);
            err.status = 400;
            throw err;
        }

        const imageFiles = req.files['images'];
        const videoFile = req.files['video'] ? req.files['video'][0] : null;
        const thumbnailFile = req.files['thumbnail'] ? req.files['thumbnail'][0] : null;

        // const files = req.files;

        // if (!files || files.length === 0) {
        //     const err = new Error('No files provided');
        //     err.status = 400;
        //     throw err;
        // }

        // const imageFiles = files.filter(file => file.mimetype.startsWith('image/'));
        // const videoFile = files.find(file => file.mimetype.startsWith('video/'));

        if (!imageFiles || imageFiles.length === 0) {
            const err = new Error('At least one image is required');
            err.status = 400;
            throw err;
        }

        let thumbnailResult;
        if (thumbnailFile) {
            thumbnailResult = await cloudinary.uploader.upload(thumbnailFile.path, {
                folder: "artwork_thumbnails",
                transformation: [
                    { width: 600, height: 600, crop: "fill" },
                    { quality: "auto:good", fetch_format: "auto" }
                ]
            });
        } else {
            // Use the first image as thumbnail if no specific thumbnail is provided
            thumbnailResult = await cloudinary.uploader.upload(imageFiles[0].path, {
                folder: "artwork_thumbnails",
                transformation: [
                    { width: 600, height: 600, crop: "fill" },
                    { quality: "auto:good", fetch_format: "auto" }
                ]
            });
        }

        const uploadPromises = imageFiles.map(file =>
            cloudinary.uploader.upload(file.path, {
                folder: "artwork_images",
                transformation: [
                    { quality: "auto:good", fetch_format: "auto" }
                ]
            }));

        let videoUploadResult;

        if (videoFile) {
            videoUploadResult = await cloudinary.uploader.upload(videoFile.path, {
                resource_type: "video",
                folder: "artwork_videos",
                eager: [
                    { width: 300, height: 300, crop: "pad" },
                    { width: 160, height: 100, crop: "crop", gravity: "south" }
                ],
                eager_async: true
            });
        }

        const uploadResults = await Promise.all(uploadPromises);

        const newArtwork = new Artwork({
            title,
            description,
            thumbnailUrl: thumbnailResult.secure_url,
            imageUrls: uploadResults.map(result => result.secure_url),
            videoUrl: videoUploadResult ? videoUploadResult.secure_url : null,
            youtubeUrl,
            artStyle,
            software: JSON.parse(software),
            tags: JSON.parse(tags),
            creator: req.userId
        });
        await newArtwork.save();

        await User.findByIdAndUpdate(req.userId, { $push: { artworks: newArtwork._id } });

        res.status(201).json(newArtwork);
    } catch (error) {
        next(error);
    }
};

exports.getArtworks = async (req, res, next) => {
    try {
        const { type = 'popular', page = 1 } = req.query;
        const limit = 45; // Number of artworks per page
        const skip = (page - 1) * limit;
        const userId = req.userId;

        let query = {};
        if (type === 'following' && userId) {
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            query = { creator: { $in: user.following } };
        }

        const artworks = await Artwork.find(query)
            .sort(type === 'popular' ? { likes: -1, views: -1, createdAt: -1 } : { createdAt: -1 })
            .skip(skip)
            .limit(limit + 1) // Fetch one extra to check if there are more
            .select('title artStyle thumbnailUrl imageUrls creator likes views')
            .populate('creator', 'name username profilePicture');

        const hasMore = artworks.length > limit;
        const artworksToSend = hasMore ? artworks.slice(0, -1) : artworks;

        res.status(200).json({
            artworks: artworksToSend,
            hasMore: hasMore,
            nextPage: hasMore ? parseInt(page) + 1 : null
        });
    } catch (error) {
        next(error);
    }
};

exports.getUserArtworks = async (req, res, next) => {
    try {
        const { userId } = req.params;
        const { page = 1, limit = 15 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const user = await User.findById(userId);
        if (!user) {
            const err = new Error('User not found');
            err.status = 404;
            throw err;
        }

        const totalArtworks = await Artwork.countDocuments({ creator: userId });

        const artworks = await Artwork.find({ creator: userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit) + 1)
            .select('title artStyle thumbnailUrl imageUrls likes views createdAt');

        const hasMore = artworks.length > limit;
        const artworksToSend = hasMore ? artworks.slice(0, -1) : artworks;

        res.status(200).json({
            artworks: artworksToSend,
            hasMore: hasMore,
            nextPage: hasMore ? parseInt(page) + 1 : null,
            totalPages: Math.ceil(totalArtworks / limit),
            currentPage: parseInt(page)
        });
    } catch (error) {
        next(error);
    }
};

exports.getArtworkById = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id)
            .populate('creator', 'name username profilePicture')
            .populate('likes', 'name username profilePicture')
            .populate({
                path: 'comments.user',
                select: 'name username'
            });
        if (!artwork) {
            const err = new Error('Artwork not found');
            err.status = 404;
            throw err;
        }

        // // Increment view count
        // artwork.views += 1;
        // await artwork.save();

        // // Increment creator's total views
        // await User.findByIdAndUpdate(artwork.creator._id, { $inc: { totalViews: 1 } });

        res.status(200).json(artwork);
    } catch (error) {
        next(error);
    }
};

exports.incrementView = async (req, res, next) => {
    try {
        const artwork = await Artwork.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );

        if (!artwork) {
            const err = new Error('Artwork not found');
            err.status = 404;
            throw err;
        }

        // Increment creator's total views
        await User.findByIdAndUpdate(
            artwork.creator,
            { $inc: { totalViews: 1 } },
            { new: true }
        );

        res.status(200).json({ views: artwork.views });
    } catch (error) {
        next(error);
    }
};

exports.likeArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork) {
            const err = new Error('Artwork not found');
            err.status = 404;
            throw err;
        }
        // if (artwork.likes.includes(req.userId)) {
        //     const err = new Error('Artwork already liked');
        //     err.status = 400;
        //     throw err;
        // }

        if (!artwork.likes.includes(req.userId)) {
            artwork.likes.push(req.userId);
            await artwork.save();

            // Create notification for like
            if (artwork.creator.toString() !== req.userId) {
                await createNotification(
                    artwork.creator,
                    req.userId,
                    'like',
                    artwork._id,
                    'liked your artwork'
                );
            }
        }

        // artwork.likes.push(req.userId);
        // await artwork.save();
        res.status(200).json(artwork);
    } catch (error) {
        next(error);
    }
};

exports.unlikeArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork) {
            const err = new Error('Artwork not found');
            err.status = 404;
            throw err;
        }
        if (!artwork.likes.includes(req.userId)) {
            const err = new Error('Artwork not liked yet');
            err.status = 400;
            throw err;
        }
        artwork.likes = artwork.likes.filter(id => id.toString() !== req.userId);
        await artwork.save();
        res.status(200).json(artwork);
    } catch (error) {
        next(error);
    }
};

exports.deleteArtwork = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.id);

        if (!artwork) {
            const err = new Error('Artwork not found');
            err.status = 404;
            throw err;
        }

        if (artwork.creator.toString() !== req.userId) {
            const err = new Error('User not authorized');
            err.status = 403;
            throw err;
        }


        for (const imageUrl of artwork.imageUrls) {
            const publicId = imageUrl.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
        }

        await Artwork.findByIdAndDelete(req.params.id);

        await User.findByIdAndUpdate(req.userId, { $pull: { artworks: req.params.id } });

        res.json({ message: 'Artwork deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.addComment = async (req, res, next) => {
    try {
        const { error } = commentSchema.validate(req.body);
        if (error) {
            const err = new Error(error.details[0].message);
            err.status = 400;
            throw err;
        }

        const { content } = req.body;
        const artwork = await Artwork.findById(req.params.id);
        if (!artwork) {
            const err = new Error('Artwork not found');
            err.status = 404;
            throw err;
        }
        const newComment = {
            user: req.userId,
            content,
            likes: []
        };
        artwork.comments.push(newComment);
        await artwork.save();



        // Create notification for comment
        if (artwork.creator.toString() !== req.userId) {
            await createNotification(
                artwork.creator,
                req.userId,
                'comment',
                artwork._id,
                'commented on your artwork'
            );
        }

        // // Fetching the updated artwork with populated fields for newly addedd comments
        const updatedArtwork = await Artwork.findById(req.params.id)
            .populate('creator', 'name username')
            .populate({
                path: 'comments.user',
                select: 'name username'
            });

        res.status(201).json(updatedArtwork);
    } catch (error) {
        next(error);
    }
};

exports.likeComment = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.artworkId);
        if (!artwork) {
            const err = new Error('Artwork not found');
            err.status = 404;
            throw err;
        }
        const comment = artwork.comments.id(req.params.commentId);
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            throw err;
        }
        if (comment.likes.includes(req.userId)) {
            const err = new Error('Comment already liked');
            err.status = 400;
            throw err;
        }
        comment.likes.push(req.userId);
        await artwork.save();

        // Create notification for comment like
        if (comment.user.toString() !== req.userId) {
            await createNotification(
                comment.user,
                req.userId,
                'commentLike',
                artwork._id,
                comment._id,
                'liked your comment'
            );
        }
        res.status(200).json(artwork);
    } catch (error) {
        next(error);
    }
};

exports.unlikeComment = async (req, res, next) => {
    try {
        const artwork = await Artwork.findById(req.params.artworkId);
        if (!artwork) {
            const err = new Error('Artwork not found');
            err.status = 404;
            throw err;
        }
        const comment = artwork.comments.id(req.params.commentId);
        if (!comment) {
            const err = new Error('Comment not found');
            err.status = 404;
            throw err;
        }
        if (!comment.likes.includes(req.userId)) {
            const err = new Error('Comment not liked yet');
            err.status = 400;
            throw err;
        }
        comment.likes = comment.likes.filter(id => id.toString() !== req.userId);
        await artwork.save();
        res.status(200).json(artwork);
    } catch (error) {
        next(error);
    }
};

exports.searchArtworks = async (req, res, next) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ message: 'Search query is required' });
        }

        const artworks = await Artwork.find({
            $or: [
                { title: { $regex: q, $options: 'i' } },
                { artStyle: { $regex: q, $options: 'i' } },
                { software: { $in: [new RegExp(q, 'i')] } },
                { tags: { $in: [new RegExp(q, 'i')] } }
            ]
        }).populate('creator', 'name username');

        // Perform a separate query for creators
        const creators = await User.find({
            $or: [
                { name: { $regex: q, $options: 'i' } },
                { username: { $regex: q, $options: 'i' } }
            ]
        }, '_id name username');

        // Find artworks by the matched creators
        const artworksByCreator = await Artwork.find({
            creator: { $in: creators.map(c => c._id) }
        }).populate('creator', 'name username');

        // Combine and deduplicate results
        const combinedResults = [...artworks, ...artworksByCreator];
        const uniqueResults = Array.from(new Set(combinedResults.map(a => a._id.toString())))
            .map(_id => combinedResults.find(a => a._id.toString() === _id));

        res.json(uniqueResults);
    } catch (error) {
        next(error);
    }
};