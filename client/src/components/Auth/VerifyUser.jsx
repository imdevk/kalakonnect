import React, { useState } from 'react';
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
            <div className="flex justify-center items-center min-h-[200px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (!user) {
        navigate('/login');
        return null;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Verify Your Email</h1>
            {!success ? (
                <>
                    <p className="mb-4">Click the button below to receive a verification email.</p>
                    <button
                        onClick={handleVerification}
                        disabled={isLoading}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                    >
                    </button>
                </>
            ) : (
                <p className="text-green-600">Verification email sent! Please check your inbox and follow the instructions.</p>
            )}
            {error && <p className="text-red-500 mt-4">{error}</p>}
        </div>
    );
};

export default VerifyUser;