// utils/fileProcessing.js
const sharp = require('sharp');
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');

// Ensure directory exists
const ensureDir = async (dirPath) => {
    try {
        await fs.access(dirPath);
    } catch {
        await fs.mkdir(dirPath, { recursive: true });
    }
};

// Safe file deletion
const safeDelete = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        // Log error but don't throw - we'll let the system clean up temporary files later
        console.log(`Warning: Could not delete file ${filePath}:`, error.message);
    }
};

// Process and save image
const processImage = async (file, outputPath, options = {}) => {
    const {
        width,
        height,
        quality = 80,
        fit = 'cover'
    } = options;

    await ensureDir(path.dirname(outputPath));

    try {
        // Create a sharp instance and get the buffer
        const sharpInstance = sharp(file.path);

        if (width || height) {
            sharpInstance.resize(width, height, { fit });
        }

        // Process the image and write directly to output
        await sharpInstance
            .jpeg({ quality })
            .toFile(outputPath);

        // Close the sharp instance
        await sharpInstance.destroy();

        // Try to delete the temp file, but don't throw if it fails
        await safeDelete(file.path);

        return true;
    } catch (error) {
        // If something goes wrong, try to clean up the output file
        await safeDelete(outputPath);
        throw error;
    }
};

// Process artwork images
const processArtworkImage = async (file, username) => {
    const filename = `${Date.now()}-${path.basename(file.originalname)}`;
    const outputPath = path.join('public', 'uploads', 'artworks', 'images', username, filename);

    await processImage(file, outputPath, {
        quality: 80
    });

    return `/uploads/artworks/images/${username}/${filename}`;
};

// Process thumbnail
const processArtworkThumbnail = async (file, username) => {
    const filename = `${Date.now()}-thumb-${path.basename(file.originalname)}`;
    const outputPath = path.join('public', 'uploads', 'artworks', 'thumbnails', username, filename);

    await processImage(file, outputPath, {
        width: 600,
        height: 600,
        quality: 80,
        fit: 'cover'
    });

    return `/uploads/artworks/thumbnails/${username}/${filename}`;
};

// Save video
const saveVideo = async (file, username) => {
    const sanitizedOriginalname = file.originalname
        .replace(/[#&?%]/g, '') // Remove special characters
        .replace(/\s+/g, '_')   // Replace spaces with underscores
        .replace(/__+/g, '_');
    const filename = `${Date.now()}-${path.basename(sanitizedOriginalname)}`;
    const outputPath = path.join('public', 'uploads', 'artworks', 'videos', username, filename);

    await ensureDir(path.dirname(outputPath));

    try {
        // Use streams for video copying to handle large files better
        await new Promise((resolve, reject) => {
            const readStream = fsSync.createReadStream(file.path);
            const writeStream = fsSync.createWriteStream(outputPath);

            readStream.on('error', reject);
            writeStream.on('error', reject);
            writeStream.on('finish', resolve);

            readStream.pipe(writeStream);
        });

        // Try to delete the temp file
        await safeDelete(file.path);

        return `/uploads/artworks/videos/${username}/${filename}`;
    } catch (error) {
        // If something goes wrong, try to clean up the output file
        await safeDelete(outputPath);
        throw error;
    }
};

// Process profile picture
const processProfilePicture = async (file, username) => {
    const filename = `${Date.now()}-${path.basename(file.originalname)}`;
    // Create username-specific directory path
    const outputPath = path.join('public', 'uploads', 'profiles', 'profilepicture', username, filename);

    await processImage(file, outputPath, {
        width: 400,
        height: 400,
        quality: 80,
        fit: 'cover'
    });

    return `/uploads/profiles/profilepicture/${username}/${filename}`;
};

// Process cover image
const processCoverImage = async (file, username) => {
    const filename = `${Date.now()}-${path.basename(file.originalname)}`;
    // Create username-specific directory path
    const outputPath = path.join('public', 'uploads', 'profiles', 'cover', username, filename);

    await processImage(file, outputPath, {
        width: 1200,
        height: 400,
        quality: 80,
        fit: 'cover'
    });

    return `/uploads/profiles/cover/${username}/${filename}`;
};

module.exports = {
    processArtworkImage,
    processArtworkThumbnail,
    saveVideo,
    processProfilePicture,
    processCoverImage
};