import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const EmailVerification = () => {
    const [verificationStatus, setVerificationStatus] = useState('loading'); // 'loading' | 'success' | 'error'
    const [error, setError] = useState(null);
    const { token } = useParams();
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await api.get(`/api/auth/verify/${token}`);
                // Always update user data on success
                const userResponse = await api.get('/api/users/me');
                updateUser(userResponse.data);
                setVerificationStatus('success');
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to verify email. Please try again.');
                setVerificationStatus('error');
            }
        };

        verifyEmail();
    }, [token, navigate, updateUser]);

    const renderContent = () => {
        switch (verificationStatus) {
            case 'loading':
                return (
                    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-primary-darkest">
                        <div className="bg-primary-darker px-8 py-6 rounded-lg shadow-xl max-w-md w-full text-center">
                            <h2 className="text-3xl font-bold text-primary-lightest mb-6">Verifying Email</h2>
                            <div className="flex justify-center">
                                <LoadingSpinner />
                            </div>
                            <p className="text-primary-light mt-4">Please wait while we verify your email...</p>
                        </div>
                    </div>
                );

            case 'error':
                return (
                    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-primary-darkest">
                        <div className="bg-primary-darker px-8 py-6 rounded-lg shadow-xl max-w-md w-full text-center">
                            <h2 className="text-3xl font-bold text-primary-lightest mb-6">Verification Failed</h2>
                            <p className="text-primary-light">{error}</p>
                        </div>
                    </div>
                );

            case 'success':
                return (
                    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-primary-darkest">
                        <div className="bg-primary-darker px-8 py-6 rounded-lg shadow-xl max-w-md w-full text-center">
                            <h2 className="text-3xl font-bold text-primary-lightest mb-6">Email Verified Successfully!</h2>
                            <p className="text-primary-light">You will be redirected to the home page in a few seconds.</p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return renderContent();
};

export default EmailVerification;