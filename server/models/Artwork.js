const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now }
});

const artworkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    thumbnailUrl: { type: String, required: true },
    imageUrls: [{ type: String, required: true }],
    videoUrl: { type: String },
    youtubeUrl: { type: String },
    artStyle: { type: String, required: true },
    software: [{ type: String }],
    tags: [String],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    comments: [commentSchema],
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Artwork', artworkSchema);