import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const VerifyUser = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();

    useEffect(() => {
        if (user?.isVerified) {
            navigate('/create');
        }
    }, [user, navigate]);

    const handleVerification = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.post('/api/auth/send-verification');
            setSuccess(true);
        } catch (error) {
            setError(error.response?.data?.message || 'An error occurred while sending the verification email.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center my-8">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        navigate('/login');
        return null;
    }

    if (user.isVerified) {
        navigate('/create');
        return null;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-primary-darkest">
            <div className="bg-primary-darker px-8 py-6 rounded-lg shadow-xl max-w-md w-full">
                <h1 className="text-3xl font-bold text-primary-lightest mb-6">Verify Your Email</h1>
                {!success ? (
                    <>
                        <p className="text-primary-light mb-6">
                            Click the button below to receive a verification email.
                        </p>
                        <button
                            onClick={handleVerification}
                            disabled={isLoading}
                            className="w-full bg-primary-medium text-primary-off-white px-4 py-2 rounded-md hover:bg-primary-dark transition duration-300"
                        >
                            {isLoading ? 'Sending...' : 'Send Verification Email'}
                        </button>
                    </>
                ) : (
                    <p className="text-primary-light">
                        Verification email sent! Please check your inbox and follow the instructions.
                    </p>
                )}
                {error && <p className="text-red-500 mb-4">{error}</p>}
            </div>
        </div>
    );
};

export default VerifyUser;