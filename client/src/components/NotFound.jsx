import React from 'react';
import { Link } from 'react-router-dom';
import { FaHome } from 'react-icons/fa';

const NotFound = ({ type = "Page", message = "The page you're looking for doesn't exist or has been moved." }) => {
    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-primary-darkest p-4">
            <div className="text-center">
                <h1 className="text-8xl font-bold text-primary-light mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-primary-off-white mb-4">
                    {type === "Page" ? "Page Not Found" : `${type} Not Found`}
                </h2>
                <p className="text-primary-light mb-8">{message}</p>
                <Link
                    to="/"
                    className="inline-flex items-center bg-primary-medium text-primary-off-white px-6 py-3 rounded-lg hover:bg-primary-dark transition duration-300"
                >
                    <FaHome className="mr-2" />
                    Back to Home
                </Link>
            </div>
        </div>
    );
};

export default NotFound;