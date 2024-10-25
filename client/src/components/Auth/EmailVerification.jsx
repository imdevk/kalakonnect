import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';

const EmailVerification = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useParams();
    const navigate = useNavigate();
    const { updateUser } = useAuth();

    useEffect(() => {
        const verifyEmail = async () => {
            try {
                const response = await api.get(`/api/auth/verify/${token}`);
                updateUser({ isVerified: true });
                const userResponse = await api.get('/api/users/me');
                updateUser(userResponse.data);
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } catch (error) {
                setError(error.response?.data?.message || 'Failed to verify email. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        verifyEmail();
    }, [token, navigate, updateUser]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[200px]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h2>Email Verified Successfully!</h2>
            <p>You will be redirected to the home page in a few seconds.</p>
        </div>
    );
};

export default EmailVerification;