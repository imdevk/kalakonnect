const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const errorHandler = require('./middlewares/errorMiddleware');
const fs = require('fs');
// const cleanupTempFiles = require('./utils/cleanup');

dotenv.config();

const authRoutes = require('./routes/auth');
const artworkRoutes = require('./routes/artwork');
const userRoutes = require('./routes/user');
const notificationRoutes = require('./routes/notification');

const app = express();

// cleanupTempFiles();


// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const tempDir = path.join(__dirname, 'public', 'uploads', 'temp');
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

// const upload = multer({ storage: storage });
const fileFilter = (req, file, cb) => {
    // Allow images
    if (file.fieldname === 'images' || file.fieldname === 'profilePicture' ||
        file.fieldname === 'coverImage' || file.fieldname === 'thumbnail') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
    // Allow videos
    else if (file.fieldname === 'video') {
        if (file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
    else {
        cb(new Error('Unexpected field'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 1024, // 1GB limit for videos
        fieldSize: 50 * 1024 * 1024 // 50MB limit for fields
    }
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));
// app.use('/public', express.static('public'));
app.use('/api/auth', authRoutes);
app.use('/api/artworks', upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), artworkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling for multer errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File is too large. Videos must be under 1GB and images under 50MB.'
            });
        }
        return res.status(400).json({ message: err.message });
    }
    next(err);
});


app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));