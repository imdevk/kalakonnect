import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Notifications from './Notifications';
import debounce from 'lodash/debounce';
import { FaBars, FaSearch, FaBell, FaUserCircle, FaPlus, FaSignOutAlt, FaInfoCircle } from 'react-icons/fa';
import logo from '../assets/KalaKonnect.svg';

const Navigation = () => {
    const { isLoggedIn, logout, user, notificationCount } = useAuth();
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const menuRef = useRef(null);
    const searchRef = useRef(null);
    const notificationsRef = useRef(null);

    const debouncedSearch = useCallback(
        debounce((term) => {
            navigate(`/search?q=${encodeURIComponent(term)}`);
        }, 300),
        [navigate]
    );

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        if (term.length > 2) {
            debouncedSearch(term);
        }
    };

    const controlNavbar = useCallback(() => {
        if (typeof window !== 'undefined') {
            if (window.scrollY > lastScrollY) { // if scroll down hide the navbar
                setIsVisible(false);
            } else { // if scroll up show the navbar
                setIsVisible(true);
            }

            // remember current page location to use in the next move
            setLastScrollY(window.scrollY);
        }
    }, [lastScrollY]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('scroll', controlNavbar);

            // cleanup function
            return () => {
                window.removeEventListener('scroll', controlNavbar);
            };
        }
    }, [controlNavbar]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }

            if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
                setIsNotificationsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        // Clear search term when navigating to any page other than search
        if (!location.pathname.startsWith('/search')) {
            setSearchTerm('');
        }
    }, [location]);

    // Add this after your other useEffect hooks in the Navigation component
    useEffect(() => {
        // Dispatch custom event when search dropdown state changes
        window.dispatchEvent(new CustomEvent('searchDropdownStateChange', {
            detail: { isOpen: isSearchOpen }
        }));
    }, [isSearchOpen]);

    return (
        <nav className={`bg-primary-darkest w-full fixed top-0 left-0 z-50 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="max-w-[1440px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <Link to="/" className="mr-4">
                            <img
                                src={logo}
                                alt="ThriveinArt"
                                className="h-8 w-auto"  // Adjusted height for SVG
                            />
                        </Link>
                        <Link to="/" className="text-primary-off-white hover:bg-primary-dark hover:text-primary-lightest px-3 py-2 rounded-md text-md font-medium">
                            Explore
                        </Link>
                    </div>
                    {/* Desktop Search - Hidden on mobile */}
                    <div ref={searchRef} className="hidden md:flex flex-grow justify-center px-2 lg:px-0 absolute left-1/2 transform -translate-x-1/2">
                        <div className="w-[500px] relative xl:w-[500px] lg:w-[400px] md:w-[300px]">
                            <input
                                type="text"
                                placeholder="Search artworks, artists, styles..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="w-full px-3 py-2 pl-10 rounded-md bg-primary-darker text-primary-off-white placeholder-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light"
                            />
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-off-white" />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {/* Mobile Search Icon - Visible only on mobile */}
                        <button
                            className="md:hidden text-primary-off-white hover:bg-primary-dark hover:text-primary-lightest p-1 rounded-full"
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                        >
                            <FaSearch className="h-5 w-5" />
                        </button>

                        {isLoggedIn ? (
                            <>
                                <Link to="/create" className="text-primary-off-white hover:bg-primary-dark hover:text-primary-lightest p-1 rounded-full" title='Upload'>
                                    <FaPlus className="h-5 w-5" />
                                </Link>
                                <div className="relative" ref={notificationsRef}>
                                    <button
                                        onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                                        className="text-primary-off-white hover:bg-primary-dark hover:text-primary-lightest p-1 rounded-full" title='Notifications'
                                    >
                                        <FaBell className="h-5 w-5" />
                                        {notificationCount > 0 && (
                                            <span className="absolute top-0 right-0 bg-red-500 text-primary-off-white rounded-full px-1 text-xs">
                                                {notificationCount}
                                            </span>
                                        )}
                                    </button>
                                    <Notifications isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
                                </div>
                                {user && (
                                    <Link to={`/profile/${user.username}`} className="text-primary-off-white hover:bg-primary-dark hover:text-primary-lightest p-1 rounded-full" title='Profile'>
                                        <FaUserCircle className="h-5 w-5" />
                                    </Link>
                                )}
                                <div className="relative" ref={menuRef}>
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="text-primary-off-white hover:bg-primary-dark hover:text-primary-lightest p-1 rounded-full"
                                    >
                                        <FaBars className="h-5 w-5" />
                                    </button>
                                    {isMenuOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-primary-darker rounded-md shadow-lg py-1">
                                            <Link
                                                to="/about"
                                                className="block w-full text-left px-4 py-2 text-sm text-primary-light hover:bg-primary-dark hover:text-primary-lightest"
                                                onClick={() => setIsMenuOpen(false)}
                                            >
                                                <FaInfoCircle className="inline-block mr-2 h-4 w-4" />
                                                About
                                            </Link>
                                            <button
                                                onClick={logout}
                                                className="block w-full text-left px-4 py-2 text-sm text-primary-light hover:bg-primary-dark hover:text-primary-lightest"
                                            >
                                                <FaSignOutAlt className="inline-block mr-2 h-4 w-4" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-primary-off-white hover:bg-primary-dark hover:text-primary-lightest px-3 py-2 rounded-md text-md font-medium">
                                    Login
                                </Link>
                                <Link to="/signup" className="text-primary-off-white hover:bg-primary-dark hover:text-primary-lightest px-3 py-2 rounded-md text-md font-medium">
                                    Signup
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {/* Mobile Search Dropdown */}
            <div
                className={`md:hidden transition-all duration-300 ease-in-out ${isSearchOpen
                    ? 'max-h-[500px] opacity-100 border-t border-primary-medium'
                    : 'max-h-0 opacity-0 overflow-hidden'
                    }`}
            >
                <div className="px-4 py-3 bg-primary-darker">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search artworks, artists, styles..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                            className="w-full px-3 py-2 pl-10 rounded-md bg-primary-dark text-primary-off-white placeholder-primary-light focus:outline-none focus:ring-2 focus:ring-primary-light"
                        />
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-primary-off-white" />
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;