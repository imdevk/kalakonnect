import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from './common/LoadingSpinner';

const SearchResults = () => {
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const handleSearchDropdownChange = (e) => {
            if (e.detail?.isOpen !== undefined) {
                setIsSearchOpen(e.detail.isOpen);
            }
        };

        window.addEventListener('searchDropdownStateChange', handleSearchDropdownChange);
        return () => {
            window.removeEventListener('searchDropdownStateChange', handleSearchDropdownChange);
        };
    }, []);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('q');

        if (query) {
            setSearchQuery(query);
            setIsLoading(true);
            api.get(`/api/artworks/search?q=${encodeURIComponent(query)}`)
                .then(response => {
                    setResults(response.data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error('Search error:', err);
                    setError('An error occurred while searching. Please try again.');
                    setIsLoading(false);
                });
        } else {
            // Handle the case when there's no query
            setSearchQuery('');
            setResults([]);
            setIsLoading(false);
        }
    }, [location.search]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <div className="text-center my-8 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-primary-darkest min-h-screen py-8">
            <div className={`transition-all duration-300 ${isSearchOpen ? 'pt-12' : 'pt-0'}`}>
                <div className="max-w-[1440px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-2xl font-bold text-primary-off-white mb-6">
                        {searchQuery ? `Search results for "${searchQuery}"` : 'Search Results'}
                    </h2>
                    {results.length === 0 ? (
                        <p className="text-center text-primary-off-white">No results found.</p>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-1">
                            {results.map((artwork) => (
                                <Link
                                    to={`/artwork/${artwork._id}`}
                                    key={artwork._id}
                                    className="block"
                                >
                                    <div className="relative pb-[100%] overflow-hidden rounded-lg group">
                                        {artwork.thumbnailUrl ? (
                                            <img src={artwork.thumbnailUrl} alt={artwork.title} className="absolute top-0 left-0 w-full h-full object-cover" />
                                        ) : artwork.imageUrls && artwork.imageUrls.length > 0 ? (
                                            <img src={artwork.imageUrls[0]} alt={artwork.title} className="absolute top-0 left-0 w-full h-full object-cover" />
                                        ) : (
                                            <div className="absolute top-0 left-0 w-full h-full bg-primary-darker flex items-center justify-center text-primary-light">No Image</div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-black bg-opacity-75 text-primary-off-white p-2 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out">
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
                </div>
            </div>
        </div>
    );
};

export default SearchResults;