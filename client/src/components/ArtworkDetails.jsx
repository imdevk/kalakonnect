import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaComment, FaTimes, FaShare, FaHeart, FaLink, FaTrash, FaEye, FaUserPlus, FaFacebook, FaTwitter, FaWhatsapp, FaLinkedin, FaUserCheck } from 'react-icons/fa';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';
import NotFound from './NotFound';
import { getFullImageUrl } from '../utils/api';

const ArtworkDetails = () => {
    const [artwork, setArtwork] = useState(null);
    // const [isLiked, setIsLiked] = useState(false);
    const [showFullDescription, setShowFullDescription] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showLikes, setShowLikes] = useState(false);
    const { id } = useParams();
    const { isLoggedIn, user } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [showShareDropdown, setShowShareDropdown] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const shareButtonRef = useRef(null);
    const dropdownRef = useRef(null);

    const navigate = useNavigate();

    const fetchArtwork = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get(`/api/artworks/${id}`);
            setArtwork(response.data);

            // Check if we should increment the view
            const shouldIncrementView = checkAndUpdateViewCount(id);

            if (shouldIncrementView) {
                // Only send the view increment to the backend if necessary
                await api.post(`/api/artworks/${id}/increment-view`);
            }

            // setIsLiked(response.data.likes.includes(user?.id));
            if (isLoggedIn && user && response.data.creator) {
                setIsFollowing(user.following?.includes(response.data.creator._id) || false);
            }

        } catch (error) {
            if (error.response?.status === 404) {
                setError({ status: 404 });  // Set error as an object with status
            } else {
                setError('Failed to load artwork. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [id, isLoggedIn, user]);

    useEffect(() => {
        fetchArtwork();
    }, [fetchArtwork]);


    const checkAndUpdateViewCount = (artworkId) => {
        const viewedArtworks = JSON.parse(localStorage.getItem('viewedArtworks') || '{}');
        const lastViewTime = viewedArtworks[artworkId];
        const currentTime = new Date().getTime();

        // Check if the artwork has been viewed in the last hour
        if (!lastViewTime || (currentTime - lastViewTime > 3600000)) { // 3600000 ms = 1 hour
            viewedArtworks[artworkId] = currentTime;
            localStorage.setItem('viewedArtworks', JSON.stringify(viewedArtworks));
            return true; // Should increment view
        }

        return false; // Should not increment view
    };
    // const isLiked = isLoggedIn && user && artwork?.likes?.includes(user._id);

    const getYouTubeVideoId = (url) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const handleLike = async () => {
        if (!isLoggedIn) {
            alert('Please log in to like artworks');
            return;
        }

        try {
            const isLiked = artwork.likes.some(like => like._id === user._id);
            const endpoint = isLiked ? 'unlike' : 'like';
            await api.post(`/api/artworks/${id}/${endpoint}`);
            // await fetchArtwork(); // Refetch the artwork to get the updated likes
            setArtwork(prevArtwork => ({
                ...prevArtwork,
                likes: isLiked
                    ? prevArtwork.likes.filter(like => like._id !== user._id)
                    : [...prevArtwork.likes, { _id: user._id, name: user.name, username: user.username }]
            }));
        } catch (error) {
            setError('Failed to update like status. Please try again.');
        }
    };


    const handleShare = (platform) => {
        const url = window.location.href;
        let shareUrl;

        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(artwork.title)}`;
                break;
            case 'whatsapp':
                shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${artwork.title} ${url}`)}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
                break;
            default:
                return;
        }

        window.open(shareUrl, '_blank', 'noopener,noreferrer');
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (shareButtonRef.current && !shareButtonRef.current.contains(event.target) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowShareDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleLikesList = () => {
        setShowLikes(!showLikes);
    };

    const handleFollow = async () => {
        if (!isLoggedIn) {
            alert('Please log in to follow artists');
            return;
        }

        try {
            await api.post(`/api/users/follow/${artwork.creator._id}`);
            setIsFollowing(true);
        } catch (error) {
            setError('Failed to follow user. Please try again.');
        }
    };

    const handleUnfollow = async () => {
        if (!isLoggedIn) {
            alert('Please log in to unfollow artists');
            return;
        }

        try {
            await api.post(`/api/users/unfollow/${artwork.creator._id}`);
            setIsFollowing(false);
        } catch (error) {
            setError('Failed to unfollow user. Please try again.');
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this artwork?')) {
            try {
                await api.delete(`/api/artworks/${id}`);
                navigate('/');
            } catch (error) {
                setError('Failed to delete artwork. Please try again.');
            }
        }
    };

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!isLoggedIn || !newComment.trim()) return;

        setIsAddingComment(true);
        setCommentError('');
        try {
            const response = await api.post(`/api/artworks/${id}/comments`, { content: newComment });

            // Get the newly created comment from the response
            const createdComment = response.data.comments[response.data.comments.length - 1];

            setArtwork(prevArtwork => ({
                ...prevArtwork,
                comments: [...prevArtwork.comments, createdComment]
            }));

            setNewComment('');
        } catch (error) {
            setCommentError('Failed to add comment. Please try again.');
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleLikeComment = async (commentId) => {
        if (!isLoggedIn) {
            alert('Please log in to like comments');
            return;
        }
        try {
            await api.post(`/api/artworks/${id}/comments/${commentId}/like`);

            // Update comment likes locally
            setArtwork(prevArtwork => ({
                ...prevArtwork,
                comments: prevArtwork.comments.map(comment => {
                    if (comment._id === commentId) {
                        return {
                            ...comment,
                            likes: [...comment.likes, user._id]
                        };
                    }
                    return comment;
                })
            }));
        } catch (error) {
            setError('Failed to like comment. Please try again.');
        }
    };

    const handleUnlikeComment = async (commentId) => {
        try {
            await api.post(`/api/artworks/${id}/comments/${commentId}/unlike`);

            // Update comment likes locally
            setArtwork(prevArtwork => ({
                ...prevArtwork,
                comments: prevArtwork.comments.map(comment => {
                    if (comment._id === commentId) {
                        return {
                            ...comment,
                            likes: comment.likes.filter(likeId => likeId !== user._id)
                        };
                    }
                    return comment;
                })
            }));
        } catch (error) {
            setError('Failed to unlike comment. Please try again.');
        }
    };

    const handleCopyLink = async () => {
        try {
            setIsCopying(true);
            await navigator.clipboard.writeText(window.location.href);
        } catch (err) {
            console.error('Failed to copy link:', err);
            alert('Failed to copy link');
        } finally {
            setTimeout(() => {
                setIsCopying(false);
            }, 200);
        }
    };
    const LikesModal = ({ isOpen, onClose, likes }) => {
        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-primary-darker p-6 rounded-lg w-[400px] relative" style={{
                    height: Math.min(
                        Math.max(160, (likes.length * 48) + 80), // Calculate height based on content
                        460 // Maximum height
                    )
                }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-primary-off-white">Liked by</h3>
                        <button
                            onClick={onClose}
                            className="text-primary-light hover:text-primary-off-white transition-colors duration-200"
                        >
                            <FaTimes size={20} />
                        </button>
                    </div>

                    <div className="h-[380px] overflow-y-auto custom-scrollbar pr-2">
                        {likes.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-4 text-primary-light">
                                <FaHeart className="text-2xl mb-2 opacity-50" />
                                <p className="text-lg font-semibold mb-1">No likes yet</p>
                            </div>
                        ) : (
                            likes.map((like) => (
                                <div key={like._id} className="flex items-center mb-2">
                                    <Link
                                        to={`/profile/${like.username}`}
                                        onClick={onClose}
                                        className="flex items-center hover:text-primary-off-white"
                                    >
                                        <img
                                            src={getFullImageUrl(like.profilePicture)}
                                            alt={like.name}
                                            className="w-10 h-10 rounded-full mr-2 object-cover"
                                        />
                                        <span className="text-primary-light hover:text-primary-off-white">
                                            {like.name}
                                        </span>
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDescription = () => {
        if (!artwork.description) return null;

        const truncated = truncateText(artwork.description);

        if (typeof truncated === 'string') {
            return <p className="mb-4 text-primary-off-white">{truncated}</p>;
        }

        return (
            <div className="mb-4">
                <p className="text-primary-off-white">
                    {showFullDescription ? artwork.description : truncated.truncated}
                    {truncated.hasMore && (
                        <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="ml-1 text-sm text-primary-light hover:text-primary-lightest focus:outline-none"
                        >
                            {showFullDescription ? 'show less' : 'show more'}
                        </button>
                    )}
                </p>
            </div>
        );
    };

    const truncateText = (text, maxLength = 160) => {
        if (text.length <= maxLength) return text;
        return {
            truncated: text.slice(0, maxLength).trim() + '...',
            hasMore: true
        };
    };

    if (isLoading) {
        return (
            <div className="flex justify-center my-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        if (error.status === 404) {  // Check for error object with status
            return <NotFound
                type="Artwork"
                message="The artwork you're looking for doesn't exist or has been removed."
            />;
        }
        return <div className="text-red-500">{error}</div>;
    }

    if (!artwork) return <div>Artwork not found</div>;


    return (
        <div className="bg-primary-darkest min-h-screen py-8">
            <div className="max-w-[1440px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                    {/* Left side - Artwork files */}
                    <div className="lg:flex-grow lg:w-[calc(100%-424px)]">
                        {artwork.imageUrls.map((imageUrl, index) => (
                            <div key={index}
                                className="mb-6 bg-primary-darker rounded-lg shadow-md overflow-hidden"
                            >
                                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>  {/* 56.25% = 9/16 * 100 */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-primary-darker">
                                        <img
                                            src={getFullImageUrl(imageUrl)}
                                            alt={`${artwork.title} - Image ${index + 1}`}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {artwork.videoUrl && (
                            <div className="mb-6 bg-primary-darker rounded-lg shadow-md overflow-hidden">
                                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>  {/* 16:9 aspect ratio */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <video
                                            src={getFullImageUrl(artwork.videoUrl)}
                                            controls
                                            className="absolute inset-0 w-full h-full object-contain"
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                </div>
                            </div>
                        )}
                        {artwork.youtubeUrl && (
                            <div className="mb-6 bg-primary-darker rounded-lg shadow-md overflow-hidden">
                                <div className="relative w-full" style={{ paddingTop: '56.25%' }}>  {/* 16:9 aspect ratio */}
                                    <iframe
                                        src={`https://www.youtube.com/embed/${getYouTubeVideoId(artwork.youtubeUrl)}`}
                                        allow="encrypted-media"
                                        allowFullScreen
                                        className="absolute inset-0 w-full h-full"
                                    ></iframe>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right side - Info card and comments card */}
                    <div className="lg:w-[400px] flex flex-col gap-6">
                        {/* Info Card */}
                        <div className="bg-primary-darker rounded-lg p-6 text-primary-off-white">
                            {artwork.creator && (
                                <div className="flex items-center justify-between mb-4">
                                    <Link to={`/profile/${artwork.creator.username}`} className="flex items-center">
                                        <img
                                            src={getFullImageUrl(artwork.creator.profilePicture)}
                                            alt={artwork.creator.name || 'Artist'}
                                            className="w-12 h-12 rounded-full mr-4"
                                        />
                                        <div>
                                            <p className="font-bold text-primary-light hover:underline">
                                                {artwork.creator.name || 'Unknown Artist'}
                                            </p>
                                            {artwork.creator.username && (
                                                <p className="text-sm text-primary-light">@{artwork.creator.username}</p>
                                            )}
                                        </div>
                                    </Link>
                                    {isLoggedIn && user && artwork.creator && artwork.creator._id !== user._id && (
                                        <button
                                            onClick={isFollowing ? handleUnfollow : handleFollow}
                                            className="text-primary-light hover:text-primary-lightest transition-colors duration-200"
                                            title={isFollowing ? "Unfollow" : "Follow"}
                                        >
                                            {isFollowing ? (
                                                <FaUserCheck size={20} className="text-green-500 hover:text-primary-light" />
                                            ) : (
                                                <FaUserPlus size={20} />
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            <h1 className="text-2xl font-bold mb-2">{artwork.title}</h1>
                            {renderDescription()}

                            <div className="flex items-center mb-4">
                                <FaEye className="mr-2 text-primary-light" />
                                <span className="text-sm text-primary-light">{artwork.views || 0} views</span>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="flex items-center">
                                    <button onClick={handleLike} className="flex items-center text-primary-light hover:text-primary-lightest mr-2">
                                        <FaHeart className={`${artwork.likes.some(like => like._id === user?._id) ? 'text-red-500' : ''}`} />
                                    </button>
                                    <button
                                        onClick={() => setShowLikes(true)}
                                        className="text-primary-light hover:text-primary-lightest"
                                    >
                                        {artwork.likes.length}
                                    </button>
                                </div>
                                <button className="flex items-center text-primary-light hover:text-primary-lightest">
                                    <FaComment className="mr-2" />
                                    {artwork.comments.length}
                                </button>
                                <div className="relative" ref={shareButtonRef}>
                                    <button
                                        className="flex items-center text-primary-light hover:text-primary-lightest"
                                        onClick={() => setShowShareDropdown(!showShareDropdown)}
                                    >
                                        <FaShare className="mr-2" />
                                    </button>
                                    {showShareDropdown && (
                                        <div
                                            ref={dropdownRef}
                                            className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-primary-dark rounded-lg shadow-lg z-10 p-2"
                                            style={{ width: 'max-content' }}
                                        >
                                            <div className="flex space-x-2">
                                                <button
                                                    className="p-2 text-primary-off-white hover:bg-primary-medium rounded-full"
                                                    onClick={() => handleShare('facebook')}
                                                    title="Share on Facebook"
                                                >
                                                    <FaFacebook />
                                                </button>
                                                <button
                                                    className="p-2 text-primary-off-white hover:bg-primary-medium rounded-full"
                                                    onClick={() => handleShare('twitter')}
                                                    title="Share on X (Twitter)"
                                                >
                                                    <FaTwitter />
                                                </button>
                                                <button
                                                    className="p-2 text-primary-off-white hover:bg-primary-medium rounded-full"
                                                    onClick={() => handleShare('whatsapp')}
                                                    title="Share on WhatsApp"
                                                >
                                                    <FaWhatsapp />
                                                </button>
                                                <button
                                                    className="p-2 text-primary-off-white hover:bg-primary-medium rounded-full"
                                                    onClick={() => handleShare('linkedin')}
                                                    title="Share on LinkedIn"
                                                >
                                                    <FaLinkedin />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleCopyLink}
                                    className={`flex items-center transition-colors duration-200 
        ${isCopying
                                            ? 'text-primary-lightest'
                                            : 'text-primary-light hover:text-primary-lightest'
                                        }`}
                                    title="Copy link"
                                >
                                    <FaLink className="mr-2" />
                                </button>
                                {isLoggedIn && user && artwork.creator && artwork.creator._id === user._id && (
                                    <button
                                        onClick={handleDelete}
                                        className="flex items-center text-primary-light hover:text-red-500"
                                    >
                                        <FaTrash className="mr-2" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Art Style, Tags, and Software Card */}
                        <div className="bg-primary-darker rounded-lg p-6 text-primary-off-white space-y-3">
                            {/* Art Style */}
                            <div>
                                <p className="text-sm font-semibold text-primary-light mb-1.5">Art Style</p>
                                <div className="bg-primary-medium text-primary-off-white px-3 py-1.5 rounded-md text-sm inline-block">
                                    {artwork.artStyle}
                                </div>
                            </div>

                            {/* Software Section */}
                            {artwork.software && artwork.software.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-primary-light mb-1.5">Software Used</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {artwork.software.map((sw, index) => (
                                            <span key={index} className="bg-primary-medium text-primary-off-white px-3 py-1.5 rounded-md text-sm">
                                                {sw}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Tags Section */}
                            {artwork.tags && artwork.tags.length > 0 && (
                                <div>
                                    <p className="text-sm font-semibold text-primary-light mb-1.5">Tags</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {artwork.tags.map((tag, index) => (
                                            <span key={index} className="bg-primary-medium text-primary-off-white px-3 py-1.5 rounded-full text-sm">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Comments Section */}
                        <div className="bg-primary-darker rounded-lg p-6 pb-0 text-primary-off-white">
                            {artwork.comments.length > 0 && (
                                <>
                                    <h3 className="text-xl font-bold mb-4 text-primary-off-white">Comments</h3>
                                    <div className="max-h-[220px] overflow-y-auto mb-1 custom-scrollbar">
                                        {artwork.comments.map((comment) => (
                                            <div key={comment._id} className="bg-primary-dark p-4 rounded-lg shadow mb-4 text-primary-off-white">
                                                <p className="mb-2">{comment.content}</p>
                                                <div className="flex items-center justify-between text-sm text-primary-light">
                                                    <span>By {comment.user?.name || 'Unknown User'}</span>
                                                    {isLoggedIn && user && (
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => comment.likes?.includes(user._id) ? handleUnlikeComment(comment._id) : handleLikeComment(comment._id)}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <FaHeart
                                                                    className={comment.likes?.includes(user._id) ? 'text-red-500' : 'text-primary-light hover:text-primary-lightest'}
                                                                />
                                                                <span>{comment.likes?.length || 0}</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Comment Form or Login Message */}
                            {isLoggedIn ? (
                                <form onSubmit={handleAddComment}>
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="w-full p-2 border rounded-lg bg-primary-dark text-primary-off-white resize-none"
                                        placeholder="Add a comment..."
                                        rows="3"
                                        required
                                    ></textarea>
                                    {commentError && <p className="text-red-500 mt-2">{commentError}</p>}
                                    <button
                                        type="submit"
                                        className="mt-2 mb-6 bg-primary-medium text-primary-off-white px-4 py-2 rounded-lg hover:bg-primary-dark disabled:bg-primary-darker"
                                        disabled={isAddingComment}
                                    >
                                        {isAddingComment ? 'Adding Comment...' : 'Add Comment'}
                                    </button>
                                </form>
                            ) : (
                                <div className="text-center py-4 text-primary-light bg-primary-dark rounded-lg mb-6">
                                    Please <Link to="/login" className="text-blue-400 hover:text-blue-300">login</Link> to add a comment
                                </div>
                            )}
                        </div>

                    </div>
                </div>


                <LikesModal isOpen={showLikes} onClose={() => setShowLikes(false)} likes={artwork.likes} />
            </div>
        </div>
    );
};

export default ArtworkDetails;