import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { token } = useParams();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setError('');
        setIsLoading(true);
        try {
            await api.post(`/api/auth/reset-password/${token}`, { password });
            setIsSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (error) {
            setError(error.response?.data?.message || 'An error occurred while resetting your password');
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-primary-darkest">
            <div className="bg-primary-darker p-8 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-primary-lightest mb-6">Reset Password</h2>
                {isSuccess ? (
                    <p className="text-primary-light">Your password has been reset successfully. Redirecting to login...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="New Password"
                            className="w-full bg-primary-dark text-primary-lightest placeholder-primary-light p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-medium"
                            required
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm New Password"
                            className="w-full bg-primary-dark text-primary-lightest placeholder-primary-light p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-medium"
                            required
                        />
                        {error && <p className="text-red-500">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary-medium text-primary-lightest p-3 rounded-md hover:bg-primary-dark transition duration-300"
                        >
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;