import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import ImageCropper from './common/ImageCropper';
import { FaPencilAlt, FaInstagram, FaLinkedin, FaFacebook, FaTwitter, FaUserAlt, FaImages, FaLink, FaEye, FaTimes, FaUserPlus, FaUserCheck } from 'react-icons/fa';
import SliderNavigation from './common/SliderNavigation';
import LoadingSpinner from './common/LoadingSpinner';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import NotFound from './NotFound';
import { getFullImageUrl } from '../utils/api';

const UserProfile = () => {
    const [profileUser, setProfileUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [showFollowers, setShowFollowers] = useState(false);
    const [showFollowing, setShowFollowing] = useState(false);
    const { username } = useParams();
    const { isLoggedIn, user: currentUser, updateUser } = useAuth();

    const [activeTab, setActiveTab] = useState('posts');
    const [artworks, setArtworks] = useState([]);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [artworksError, setArtworksError] = useState(null);
    const [followLoading, setFollowLoading] = useState(false);
    const [loadingFollowStates, setLoadingFollowStates] = useState({});

    const observer = useRef();

    const [showProfileCropper, setShowProfileCropper] = useState(false);
    const [showCoverCropper, setShowCoverCropper] = useState(false);
    const [imageToEdit, setImageToEdit] = useState(null);
    const [imageType, setImageType] = useState(null);

    const [totalFollowers, setTotalFollowers] = useState(0);
    const [totalFollowing, setTotalFollowing] = useState(0);

    const [isLoadingMoreFollowers, setIsLoadingMoreFollowers] = useState(false);
    const [isLoadingMoreFollowing, setIsLoadingMoreFollowing] = useState(false);
    const [followersDisplayCount, setFollowersDisplayCount] = useState(10);
    const [followingDisplayCount, setFollowingDisplayCount] = useState(10);
    const [followersPage, setFollowersPage] = useState(1);
    const [followingPage, setFollowingPage] = useState(1);
    const [hasMoreFollowers, setHasMoreFollowers] = useState(true);
    const [hasMoreFollowing, setHasMoreFollowing] = useState(true);
    const [loadingMoreFollowers, setLoadingMoreFollowers] = useState(false);
    const [loadingMoreFollowing, setLoadingMoreFollowing] = useState(false);
    const [followers, setFollowers] = useState([]);
    const [following, setFollowing] = useState([]);
    const [cropLoading, setCropLoading] = useState(false);

    const ITEMS_PER_PAGE = 10;
    const INITIAL_DISPLAY = 7;

    const followersEndRef = useRef(null);
    const followingEndRef = useRef(null);

    const followersObserver = useRef();
    const followingObserver = useRef();

    const fileInputRef = useRef(null);

    const navigate = useNavigate();

    const tabs = [
        { id: 'posts', label: 'All posts', icon: FaImages },
        { id: 'about', label: 'About', icon: FaUserAlt },
    ];

    const lastArtworkElementRef = useCallback(node => {
        if (isLoadingMore) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prevPage => prevPage + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [isLoadingMore, hasMore]);

    const lastFollowerElementRef = useCallback(node => {
        if (loadingMoreFollowers) return;
        if (followersObserver.current) followersObserver.current.disconnect();
        followersObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreFollowers) {
                setFollowersPage(prev => prev + 1);
            }
        });
        if (node) followersObserver.current.observe(node);
    }, [loadingMoreFollowers, hasMoreFollowers]);

    const lastFollowingElementRef = useCallback(node => {
        if (loadingMoreFollowing || !hasMoreFollowing) return;
        if (followingObserver.current) followingObserver.current.disconnect();
        followingObserver.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMoreFollowing) {
                setFollowingPage(prev => prev + 1);
            }
        });
        if (node) followingObserver.current.observe(node);
    }, [loadingMoreFollowing, hasMoreFollowing]);

    useEffect(() => {
        if (!showFollowers || !profileUser) return;

        const fetchFollowers = async () => {
            try {
                setLoadingMoreFollowers(true);
                const response = await api.get(`/api/users/${profileUser._id}/followers?page=${followersPage}&limit=${ITEMS_PER_PAGE}`);

                const newFollowers = response.data.followers;

                // Only update if we got new items
                if (newFollowers.length > 0) {
                    setFollowers(prev => [...prev, ...newFollowers]);
                }

                // Update hasMore based on the response
                setHasMoreFollowers(response.data.hasMore);

                // If we didn't get any new items or hasMore is false, disconnect the observer
                if (newFollowers.length === 0 || !response.data.hasMore) {
                    if (followersObserver.current) {
                        followersObserver.current.disconnect();
                    }
                }
            } catch (error) {
                console.error('Error fetching followers:', error);
            } finally {
                setLoadingMoreFollowers(false);
            }
        };

        fetchFollowers();
    }, [profileUser?._id, followersPage, showFollowers]);

    useEffect(() => {
        if (!showFollowing || !profileUser) return;

        const fetchFollowing = async () => {
            try {
                setLoadingMoreFollowing(true);
                const response = await api.get(`/api/users/${profileUser._id}/following?page=${followingPage}&limit=${ITEMS_PER_PAGE}`);

                const newFollowing = response.data.following;

                // Only update if we got new items
                if (newFollowing.length > 0) {
                    setFollowing(prev => [...prev, ...newFollowing]);
                }

                // Update hasMore based on the response
                setHasMoreFollowing(response.data.hasMore);

                // If we didn't get any new items or hasMore is false, disconnect the observer
                if (newFollowing.length === 0 || !response.data.hasMore) {
                    if (followingObserver.current) {
                        followingObserver.current.disconnect();
                    }
                }
            } catch (error) {
                console.error('Error fetching following:', error);
            } finally {
                setLoadingMoreFollowing(false);
            }
        };

        fetchFollowing();
    }, [profileUser?._id, followingPage, showFollowing]);

    useEffect(() => {
        if (!showFollowers) {
            setFollowersPage(1);
            setFollowers([]);
            setHasMoreFollowers(true);
        }
    }, [showFollowers]);

    useEffect(() => {
        if (!showFollowing) {
            setFollowingPage(1);
            setFollowing([]);
            setHasMoreFollowing(true);
        }
    }, [showFollowing]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const userResponse = await api.get(`/api/users/profile/${username}`);
                setProfileUser(userResponse.data.user);
                setTotalFollowers(userResponse.data.followersCount);
                setTotalFollowing(userResponse.data.followingCount);
                if (isLoggedIn && currentUser) {
                    setIsFollowing(currentUser.following.includes(userResponse.data.user._id));
                }

                setPage(1);
            } catch (error) {
                if (error.response?.status === 404) {
                    setError({ status: 404 });
                } else {
                    setError('Failed to load user profile. Please try again.');
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [username, isLoggedIn, currentUser]);

    useEffect(() => {
        const fetchArtworks = async () => {
            if (!profileUser) {
                return;
            }
            try {
                setIsLoadingMore(true);
                setArtworksError(null);
                const response = await api.get(`/api/artworks/user/${profileUser._id}?page=${page}&limit=15`);
                if (Array.isArray(response.data.artworks)) {
                    setArtworks(prev => {
                        const newArtworks = page === 1 ? response.data.artworks : [...prev, ...response.data.artworks];
                        return newArtworks;
                    });
                    setHasMore(response.data.hasMore);
                } else {
                    setArtworksError('Received invalid artwork data');
                }
            } catch (error) {
                setArtworksError('Failed to load artworks. Please try again.');
            } finally {
                setIsLoadingMore(false);
            }
        };

        fetchArtworks();
    }, [profileUser, page]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <LoadingSpinner />
            </div>
        );
    }

    const toggleFollowers = () => setShowFollowers(!showFollowers);
    const toggleFollowing = () => setShowFollowing(!showFollowing);

    const getLocationDisplay = (cityState) => {
        if (!cityState) return '';
        const parts = cityState.split(',');

        if (!parts[0].trim()) {
            return parts[1].trim();
        }

        return cityState;
    };

    const handleFollow = async () => {
        if (!isLoggedIn) {
            alert('Please log in to follow users');
            return;
        }
        try {
            setFollowLoading(true);
            await api.post(`/api/users/follow/${profileUser._id}`);
            setIsFollowing(true);
            setTotalFollowers(prev => prev + 1); // Add this line to update followers count
            updateUser({
                ...currentUser,
                following: [...currentUser.following, profileUser._id]
            });
        } catch (error) {
            setError('Failed to follow user. Please try again.');
        } finally {
            setFollowLoading(false); // Add this line
        }
    };

    const handleUnfollow = async () => {
        try {
            setFollowLoading(true);
            await api.post(`/api/users/unfollow/${profileUser._id}`);
            setIsFollowing(false);
            setTotalFollowers(prev => prev - 1); // Add this line to update followers count
            updateUser({
                ...currentUser,
                following: currentUser.following.filter(id => id !== profileUser._id)
            });
        } catch (error) {
            setError('Failed to unfollow user. Please try again.');
        } finally {
            setFollowLoading(false); // Add this line
        }
    };

    const handleFollowUser = async (userId) => {
        if (!isLoggedIn) {
            alert('Please log in to follow users');
            return;
        }
        try {
            setLoadingFollowStates(prev => ({ ...prev, [userId]: true }));
            await api.post(`/api/users/follow/${userId}`);
            updateUser({
                ...currentUser,
                following: [...currentUser.following, userId]
            });
        } catch (error) {
            setError('Failed to follow user. Please try again.');
        } finally {
            setLoadingFollowStates(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleUnfollowUser = async (userId) => {
        try {
            setLoadingFollowStates(prev => ({ ...prev, [userId]: true }));
            await api.post(`/api/users/unfollow/${userId}`);
            updateUser({
                ...currentUser,
                following: currentUser.following.filter(id => id !== userId)
            });
        } catch (error) {
            setError('Failed to unfollow user. Please try again.');
        } finally {
            setLoadingFollowStates(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleImageSelect = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImageToEdit(reader.result);
                setImageType(type);
                if (type === 'profilePicture') {
                    setShowProfileCropper(true);
                } else if (type === 'coverImage') {
                    setShowCoverCropper(true);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleFileChange = (e) => {
        handleImageSelect(e, 'profilePicture');
    };

    const handleCropComplete = async (croppedImage) => {
        try {
            setCropLoading(true);
            const formData = new FormData();

            // Create a file from the cropped image blob
            const fileName = imageType === 'profilePicture' ? 'profile.jpg' : 'cover.jpg';
            const file = new File([croppedImage], fileName, { type: 'image/jpeg' });
            formData.append(imageType, file);

            const response = await api.put('/api/users/profile-image', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    // You can add progress indicator here if needed
                }
            });

            // Update the profile user state with the new image path
            setProfileUser(prevUser => ({
                ...prevUser,
                [imageType]: response.data.user[imageType]
            }));

            if (imageType === 'profilePicture') {
                setShowProfileCropper(false);
            } else if (imageType === 'coverImage') {
                setShowCoverCropper(false);
            }

            // Update the user in AuthContext with the new image path
            updateUser({
                ...currentUser,
                [imageType]: response.data.user[imageType]
            });
        } catch (error) {
            setError('Failed to update image. Please try again.');
            console.error('Image upload error:', error);
        } finally {
            setCropLoading(false);
        }
    };

    const handleArtworkClick = (artworkId) => {
        navigate(`/artwork/${artworkId}`);
    };

    if (error) {
        if (error.status === 404) {
            return <NotFound
                type="Profile"
                message="The user profile you're looking for doesn't exist."
            />;
        }
        return <div className="text-red-500">{error}</div>;
    }

    if (!profileUser) return <div className="text-center my-8">User not found</div>;

    const isOwnProfile = isLoggedIn && currentUser && currentUser.username === profileUser.username;

    const hasSocialLinks = profileUser?.socialLinks &&
        Object.values(profileUser.socialLinks).some(link => link && link.trim() !== '');


    const getStateFromCityState = (cityState) => {
        if (!cityState) return '';
        const parts = cityState.split(',');
        return parts.length > 1 ? parts[1].trim() : cityState.trim();
    };

    return (

        <div className="bg-primary-darkest min-h-screen px-4 pb-2">
            <div className="relative">
                {/* Cover Image */}
                <div className="flex justify-center">
                    <div className="w-full max-w-[1200px] relative">
                        <div className="relative w-full pb-[33.33%]">
                            {profileUser.coverImage !== 'none' ? (
                                <img src={getFullImageUrl(profileUser.coverImage)} alt="Cover" className="absolute top-0 left-0 w-full h-full object-cover" />
                            ) : (
                                <div className="absolute top-0 left-0 w-full h-full bg-primary-dark"></div>
                            )}
                            {isOwnProfile && (
                                <label htmlFor="coverImageUpload" className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-primary-medium text-primary-off-white p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-primary-dark transition duration-300">
                                    <FaPencilAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <input
                                        id="coverImageUpload"
                                        type="file"
                                        className="hidden"
                                        onChange={(e) => handleImageSelect(e, 'coverImage')}
                                        accept="image/*"
                                    />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* User Info Card */}
                <div className="max-w-[1200px] mx-auto px-4">
                    <div className="bg-primary-darker rounded-lg shadow-lg p-6 sm:p-4 relative -mt-6 sm:-mt-10">
                        <div className="flex flex-col md:flex-row md:items-start">
                            {/* Mobile Profile Section */}
                            <div className="w-full md:w-auto">
                                {/* Profile Picture and Basic Info Container */}
                                <div className="flex flex-col items-center md:block">
                                    {/* Profile Info Wrapper */}
                                    <div className="inline-flex items-center justify-center md:justify-start mb-6 md:mb-0">
                                        {/* Profile Picture */}
                                        <div className="relative md:mr-6 shrink-0">
                                            <img
                                                src={getFullImageUrl(profileUser.profilePicture)}
                                                alt="Profile"
                                                className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-primary-medium object-cover"
                                            />
                                            {isOwnProfile && (
                                                <>
                                                    <label
                                                        htmlFor="profileImageUpload"
                                                        className="absolute top-0 right-0 bg-primary-medium text-primary-off-white p-1.5 sm:p-2 rounded-full cursor-pointer hover:bg-primary-dark transition duration-300"
                                                    >
                                                        <FaPencilAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <input
                                                            id="profileImageUpload"
                                                            type="file"
                                                            className="hidden"
                                                            onChange={handleFileChange}
                                                            accept="image/*"
                                                            ref={fileInputRef}
                                                        />
                                                    </label>
                                                </>
                                            )}
                                        </div>

                                        {/* Mobile Name, Username, and Button */}
                                        <div className="ml-4 md:hidden flex flex-col justify-center shrink">
                                            <div>
                                                <h1 className="text-xl font-bold text-primary-off-white whitespace-nowrap">{profileUser.name}</h1>
                                                <p className="text-sm text-primary-light whitespace-nowrap">@{profileUser.username}</p>
                                            </div>
                                            <div className="mt-2">
                                                {!isOwnProfile && isLoggedIn ? (
                                                    <button
                                                        onClick={isFollowing ? handleUnfollow : handleFollow}
                                                        disabled={followLoading}
                                                        className={`px-4 py-1.5 text-sm rounded-full ${isFollowing ? 'bg-primary-medium text-primary-off-white' : 'bg-primary-light text-primary-darkest'
                                                            } hover:bg-primary-dark transition duration-300 flex items-center justify-center min-w-[80px]`}
                                                    >
                                                        {followLoading ? (
                                                            <AiOutlineLoading3Quarters className="animate-spin" />
                                                        ) : (
                                                            isFollowing ? 'Following' : 'Follow'
                                                        )}
                                                    </button>
                                                ) : isOwnProfile && (
                                                    <Link to="/edit-profile" className="bg-primary-medium text-primary-off-white px-4 py-1.5 text-sm rounded-full hover:bg-primary-dark transition duration-300">
                                                        Edit Profile
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Centered Info */}
                                    <div className="md:hidden flex flex-col items-center text-center w-full">
                                        <p className="text-primary-light">{profileUser.title}</p>
                                        {profileUser.link && (
                                            <a
                                                href={profileUser.link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center text-blue-400 hover:text-blue-300 mt-2 transition duration-300"
                                            >
                                                <FaLink className="mr-2" />
                                                {profileUser.link}
                                            </a>
                                        )}
                                        <div className="flex flex-col items-center text-primary-light mt-4">
                                            <div className="flex items-center space-x-6 mb-2">
                                                <button onClick={toggleFollowers} className="hover:text-primary-off-white transition duration-300">
                                                    <span className="font-bold">{totalFollowers}</span> Followers
                                                </button>
                                                <button onClick={toggleFollowing} className="hover:text-primary-off-white transition duration-300">
                                                    <span className="font-bold">{totalFollowing}</span> Following
                                                </button>
                                            </div>
                                            <div className="flex items-center mb-2">
                                                <FaEye className="mr-2" />
                                                <span><span className="font-bold">{profileUser.totalViews}</span> Views</span>
                                            </div>
                                            {profileUser.cityState && (
                                                <span className="text-primary-light font-semibold">
                                                    {getStateFromCityState(profileUser.cityState)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop User Info */}
                            <div className="flex-grow hidden md:block">
                                <div className="flex justify-between items-baseline">
                                    <div>
                                        <h1 className="text-2xl font-bold text-primary-off-white">{profileUser.name}</h1>
                                        <p className="text-md text-primary-light">@{profileUser.username}</p>
                                    </div>
                                    <div>
                                        {!isOwnProfile && isLoggedIn ? (
                                            <button
                                                onClick={isFollowing ? handleUnfollow : handleFollow}
                                                disabled={followLoading}
                                                className={`px-6 py-2 rounded-full ${isFollowing ? 'bg-primary-medium text-primary-off-white' : 'bg-primary-light text-primary-darkest'
                                                    } hover:bg-primary-dark transition duration-300 flex items-center justify-center min-w-[100px]`}
                                            >
                                                {followLoading ? (
                                                    <AiOutlineLoading3Quarters className="animate-spin" />
                                                ) : (
                                                    isFollowing ? 'Following' : 'Follow'
                                                )}
                                            </button>
                                        ) : isOwnProfile && (
                                            <Link to="/edit-profile" className="bg-primary-medium text-primary-off-white px-6 py-2 rounded-full hover:bg-primary-dark transition duration-300">
                                                Edit Profile
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Info Section */}
                                <p className="text-primary-light mt-2">{profileUser.title}</p>
                                {profileUser.link && (
                                    <a
                                        href={profileUser.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-blue-400 hover:text-blue-300 mt-2 transition duration-300"
                                    >
                                        <FaLink className="mr-2" />
                                        {profileUser.link}
                                    </a>
                                )}
                                <div className="flex items-center justify-between text-primary-light mt-4">
                                    <div className="flex items-center space-x-6">
                                        <button onClick={toggleFollowers} className="hover:text-primary-off-white transition duration-300">
                                            <span className="font-bold">{totalFollowers}</span> Followers
                                        </button>
                                        <button onClick={toggleFollowing} className="hover:text-primary-off-white transition duration-300">
                                            <span className="font-bold">{totalFollowing}</span> Following
                                        </button>
                                        <div className="flex items-center">
                                            <FaEye className="mr-2" />
                                            <span><span className="font-bold">{profileUser.totalViews}</span> Views</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        {profileUser.cityState && (
                                            <span className="text-primary-light font-semibold">
                                                {getStateFromCityState(profileUser.cityState)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Slider Navigation and Content  */}
            <div className="max-w-[1200px] mx-auto mt-6 px-4">
                <div className="flex justify-center mb-6">
                    <SliderNavigation activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
                </div>

                <div className="mt-6">
                    {activeTab === 'posts' && (
                        <>
                            {artworksError ? (
                                <div className="text-center my-4 text-red-500">{artworksError}</div>
                            ) : artworks.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-xl text-primary-light mb-2">No artworks yet</p>
                                    <p className="text-primary-light">
                                        {isOwnProfile
                                            ? "You haven't uploaded any artworks yet. Share your first artwork!"
                                            : `${profileUser.name} hasn't uploaded any artworks yet.`
                                        }
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-4 gap-1">
                                    {artworks.map((artwork, index) => (
                                        <Link
                                            to={`/artwork/${artwork._id}`}
                                            key={artwork._id}
                                            className="block"
                                            ref={index === artworks.length - 1 ? lastArtworkElementRef : null}
                                        >
                                            <div className="relative pb-[100%] overflow-hidden rounded-sm">
                                                {artwork.thumbnailUrl ? (
                                                    <img
                                                        src={getFullImageUrl(artwork.thumbnailUrl)}
                                                        alt={artwork.title}
                                                        className="absolute top-0 left-0 w-full h-full object-cover"
                                                    />
                                                ) : artwork.imageUrls && artwork.imageUrls.length > 0 ? (
                                                    <img
                                                        src={getFullImageUrl(artwork.imageUrls[0])}
                                                        alt={artwork.title}
                                                        className="absolute top-0 left-0 w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="absolute top-0 left-0 w-full h-full bg-primary-darker flex items-center justify-center text-primary-light">
                                                        No Image
                                                    </div>
                                                )}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                            {isLoadingMore && <div className="text-center my-4 text-primary-light">Loading more artworks...</div>}
                            {!hasMore && artworks.length > 0 && <div className="text-center my-4 text-primary-light">No more artworks to load</div>}
                        </>
                    )}
                    {activeTab === 'about' && (
                        <div className="text-primary-light">
                            <h2 className="text-xl font-bold mb-4 text-primary-off-white">Summary</h2>
                            <p className="mb-4">
                                {profileUser.summary || "This user hasn't added a summary yet."}
                            </p>

                            {profileUser.cityState && (
                                <>
                                    <h3 className="text-lg font-semibold mb-2 text-primary-off-white">Location</h3>
                                    <p className="mb-4">{getLocationDisplay(profileUser.cityState)}</p>
                                </>
                            )}

                            {hasSocialLinks && (
                                <>
                                    <h3 className="text-lg font-semibold mb-2 text-primary-off-white">Social Media</h3>
                                    <div className="flex space-x-4 mb-4">
                                        {profileUser.socialLinks?.instagram && (
                                            <a href={profileUser.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-primary-off-white transition duration-300">
                                                <FaInstagram size={24} />
                                            </a>
                                        )}
                                        {profileUser.socialLinks?.linkedin && (
                                            <a href={profileUser.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-primary-off-white transition duration-300">
                                                <FaLinkedin size={24} />
                                            </a>
                                        )}
                                        {profileUser.socialLinks?.facebook && (
                                            <a href={profileUser.socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-primary-off-white transition duration-300">
                                                <FaFacebook size={24} />
                                            </a>
                                        )}
                                        {profileUser.socialLinks?.twitter && (
                                            <a href={profileUser.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-primary-light hover:text-primary-off-white transition duration-300">
                                                <FaTwitter size={24} />
                                            </a>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Followers Modal */}
            {showFollowers && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-primary-darker p-6 rounded-lg w-[400px] relative " style={{
                        height: Math.min(
                            Math.max(160, (followers.length * 48) + 80), // Calculate height based on content
                            460 // Maximum height
                        )
                    }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-primary-off-white">Followers</h3>
                            <button
                                onClick={toggleFollowers}
                                className="text-primary-light hover:text-primary-off-white transition-colors duration-200"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <div className="h-[380px] overflow-y-auto custom-scrollbar pr-2">
                            {followers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-4 text-primary-light">
                                    <FaUserAlt className="text-2xl mb-2 opacity-50" />
                                    <p className="text-lg font-semibold mb-1">No followers yet</p>
                                </div>
                            ) : (
                                <>

                                    {followers.map((follower, index) => (
                                        <div
                                            key={follower._id}
                                            ref={index === followers.length - 1 ? lastFollowerElementRef : null}
                                            className="flex items-center justify-between mb-2"
                                        >
                                            <div className="flex items-center">
                                                <Link
                                                    to={`/profile/${follower.username}`}
                                                    onClick={toggleFollowers}
                                                    className="flex items-center hover:text-primary-off-white"
                                                >
                                                    <img src={getFullImageUrl(follower.profilePicture)} alt={follower.name} className="w-10 h-10 rounded-full mr-2" />
                                                    <span className="text-primary-light hover:text-primary-off-white">
                                                        {follower.name}
                                                    </span>
                                                </Link>
                                            </div>
                                            {isLoggedIn && currentUser._id !== follower._id && (
                                                <button
                                                    onClick={() => currentUser.following.includes(follower._id)
                                                        ? handleUnfollowUser(follower._id)
                                                        : handleFollowUser(follower._id)
                                                    } disabled={loadingFollowStates[follower._id]}
                                                    className="text-primary-light hover:text-primary-lightest"
                                                >
                                                    {loadingFollowStates[follower._id] ? (
                                                        <AiOutlineLoading3Quarters className="animate-spin" size={18} />
                                                    ) : currentUser.following.includes(follower._id) ? (
                                                        <FaUserCheck className="text-green-500 hover:text-primary-light" size={18} />
                                                    ) : (
                                                        <FaUserPlus size={18} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {loadingMoreFollowers && (
                                        <div className="text-center py-2 text-primary-light">Loading...</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showFollowing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-primary-darker p-6 rounded-lg max-w-md w-[400px] relative" style={{
                        height: Math.min(
                            Math.max(160, (following.length * 48) + 80), // Calculate height based on content
                            460 // Maximum height
                        )
                    }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-primary-off-white">Following</h3>
                            <button
                                onClick={toggleFollowing}
                                className="text-primary-light hover:text-primary-off-white transition-colors duration-200"
                            >
                                <FaTimes size={20} />
                            </button>
                        </div>
                        <div className="h-[380px] overflow-y-auto custom-scrollbar pr-2">
                            {following.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-4 text-primary-light">
                                    <FaUserAlt className="text-2xl mb-2 opacity-50" />
                                    <p className="text-lg font-semibold mb-1">No following yet</p>
                                </div>
                            ) : (
                                <>
                                    {following.map((followed, index) => (
                                        <div
                                            key={followed._id}
                                            ref={index === following.length - 1 ? lastFollowingElementRef : null}
                                            className="flex items-center justify-between mb-2"
                                        >
                                            <div className="flex items-center">
                                                <Link
                                                    to={`/profile/${followed.username}`}
                                                    onClick={toggleFollowing}
                                                    className="flex items-center hover:text-primary-off-white"
                                                >
                                                    <img src={getFullImageUrl(followed.profilePicture)} alt={followed.name} className="w-10 h-10 rounded-full mr-2" />
                                                    <span className="text-primary-light hover:text-primary-off-white">
                                                        {followed.name}
                                                    </span>
                                                </Link>
                                            </div>

                                            {isLoggedIn && currentUser._id !== followed._id && (
                                                <button
                                                    onClick={() => currentUser.following.includes(followed._id)
                                                        ? handleUnfollowUser(followed._id)
                                                        : handleFollowUser(followed._id)
                                                    }
                                                    disabled={loadingFollowStates[followed._id]}
                                                    className="text-primary-light hover:text-primary-lightest"
                                                >
                                                    {loadingFollowStates[followed._id] ? (
                                                        <AiOutlineLoading3Quarters className="animate-spin" size={18} />
                                                    ) : currentUser.following.includes(followed._id) ? (
                                                        <FaUserCheck className="text-green-500 hover:text-primary-light" size={18} />
                                                    ) : (
                                                        <FaUserPlus size={18} />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                    {loadingMoreFollowing && (
                                        <div className="text-center py-2 text-primary-light">Loading...</div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Image Croppers */}
            {showProfileCropper && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-primary-darker p-4 rounded-lg max-w-md w-full">
                        <ImageCropper
                            src={imageToEdit}
                            onCropComplete={handleCropComplete}
                            onCancel={() => setShowProfileCropper(false)}
                            aspect={1}
                            shape="circle"
                            loading={cropLoading}
                        />
                    </div>
                </div>
            )}

            {showCoverCropper && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-primary-darker p-4 rounded-lg max-w-3xl w-full">
                        <ImageCropper
                            src={imageToEdit}
                            onCropComplete={handleCropComplete}
                            onCancel={() => setShowCoverCropper(false)}
                            aspect={3}
                            shape="rectangle"
                            loading={cropLoading}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;