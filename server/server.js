const config = require('./config');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const errorHandler = require('./middlewares/errorMiddleware');

dotenv.config();

const authRoutes = require('./routes/auth');
const artworkRoutes = require('./routes/artwork');
const userRoutes = require('./routes/user');
const notificationRoutes = require('./routes/notification');

const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname))
    }
});

// const upload = multer({ storage: storage });
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'images' || file.fieldname === 'video' || file.fieldname === 'thumbnail') {
        cb(null, true);
    } else {
        cb(new Error('Unexpected field'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB limit
        fieldSize: 100 * 1024 * 1024 // 100 MB limit for text fields
    }
});

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));


app.use('/public', express.static('public'));
app.use('/api/auth', authRoutes);
app.use('/api/artworks', upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), artworkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));