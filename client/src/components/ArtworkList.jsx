import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import BackToTopButton from './common/backToTopButton';
import SliderNavigation from './common/SliderNavigation';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const ArtworkList = () => {
    const [artworks, setArtworks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('popular');
    const [error, setError] = useState(null);
    const { isLoggedIn } = useAuth();
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);

    const tabs = [
        { id: 'popular', label: 'Popular' },
        { id: 'following', label: 'Following' }
    ];

    const fetchArtworks = useCallback(async (pageNumber, tabType = activeTab) => {
        if (!hasMore && pageNumber !== 1) return;

        try {
            setLoading(true);
            const type = isLoggedIn ? tabType : 'popular';
            const response = await api.get(`/api/artworks?type=${type}&page=${pageNumber}`);

            setArtworks(prevArtworks => {
                if (pageNumber === 1) {
                    return response.data.artworks || [];
                } else {
                    return [...prevArtworks, ...(response.data.artworks || [])];
                }
            });

            setHasMore(response.data.hasMore);
            setError(null);
        } catch (error) {
            setError('Failed to fetch artworks. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, [isLoggedIn]);

    const handleScroll = useCallback(() => {
        if (loading || !hasMore) return;

        const scrollTop = (document.documentElement && document.documentElement.scrollTop) || document.body.scrollTop;
        const scrollHeight = (document.documentElement && document.documentElement.scrollHeight) || document.body.scrollHeight;
        const clientHeight = document.documentElement.clientHeight || window.innerHeight;
        const scrolledToBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight - 300; // 300px before bottom

        if (scrolledToBottom) {
            setPage(prevPage => prevPage + 1);
        }
    }, [loading, hasMore]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);

    const handleTabChange = (newTab) => {
        setActiveTab(newTab);
        setPage(1);
        setArtworks([]);
        setHasMore(true);
        fetchArtworks(1, newTab);
    };

    useEffect(() => {
        if (page > 1) {
            fetchArtworks(page, activeTab);
        }
    }, [page, fetchArtworks, activeTab]);

    // Initial load
    useEffect(() => {
        fetchArtworks(1, activeTab);
    }, [fetchArtworks]);

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            setPage(prevPage => prevPage + 1);
        }
    };

    if (error) {
        return <div className="text-center my-8 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-primary-darkest min-h-screen py-5">
            <div className="max-w-[1440px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                {isLoggedIn && (
                    <div className="flex justify-center mb-8">
                        <SliderNavigation
                            activeTab={activeTab}
                            setActiveTab={handleTabChange}
                            tabs={tabs}
                        />
                    </div>
                )}
                {artworks.length === 0 && !loading ? (
                    <div className="text-center my-8 text-primary-off-white">No artworks found.</div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-1">
                        {artworks.map((artwork) => (
                            <Link
                                to={`/artwork/${artwork._id}`}
                                key={artwork._id}
                                className="block"
                            >
                                <div className="relative pb-[100%] overflow-hidden rounded-sm group">
                                    {artwork.thumbnailUrl ? (
                                        <img src={artwork.thumbnailUrl} alt={artwork.title} className="absolute top-0 left-0 w-full h-full object-cover" />
                                    ) : artwork.imageUrls && artwork.imageUrls.length > 0 ? (
                                        <img src={artwork.imageUrls[0]} alt={artwork.title} className="absolute top-0 left-0 w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute top-0 left-0 w-full h-full bg-primary-darker flex items-center justify-center text-primary-light">No Image</div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-50 text-primary-off-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
                                        <h3 className="font-bold text-sm mb-1 truncate">{artwork.title}</h3>
                                        <div className="flex items-center">
                                            {artwork.creator && artwork.creator.profilePicture && (
                                                <img
                                                    src={artwork.creator.profilePicture}
                                                    alt={artwork.creator.name}
                                                    className="w-5 h-5 rounded-full mr-1 object-cover"
                                                />
                                            )}
                                            <p className="text-primary-light text-xs truncate">
                                                {artwork.creator ? artwork.creator.name : 'Unknown Artist'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
                {loading && <div className="flex justify-center my-8">
                    <LoadingSpinner />
                </div>}
                {!loading && hasMore && (
                    <div className="flex justify-center mt-8">
                        <button
                            onClick={handleLoadMore}
                            className="bg-primary-medium text-primary-off-white px-4 py-2 rounded-full hover:bg-primary-dark transition duration-300"
                        >
                            Load More
                        </button>
                    </div>
                )}
                <BackToTopButton />
            </div>
        </div >
    );
};

export default ArtworkList;