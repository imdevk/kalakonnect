const express = require('express');
const {
    createArtwork,
    getArtworks,
    getArtworkById,
    likeArtwork,
    unlikeArtwork,
    deleteArtwork,
    addComment,
    likeComment,
    unlikeComment,
    incrementView,
    searchArtworks,
    getUserArtworks
} = require('../controllers/artworkController');
const auth = require('../middlewares/auth');
const optionalAuth = require('../middlewares/optionalAuth');



const router = express.Router();

router.get('/search', searchArtworks);

router.post('/', auth, createArtwork);
router.get('/', optionalAuth, getArtworks);
router.get('/:id', getArtworkById);
router.get('/user/:userId', getUserArtworks);
router.post('/:id/like', auth, likeArtwork);
router.post('/:id/unlike', auth, unlikeArtwork);
router.delete('/:id', auth, deleteArtwork);
router.post('/:id/comments', auth, addComment);
router.post('/:artworkId/comments/:commentId/like', auth, likeComment);
router.post('/:artworkId/comments/:commentId/unlike', auth, unlikeComment);
router.post('/:id/increment-view', incrementView);


module.exports = router;