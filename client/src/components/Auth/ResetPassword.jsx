import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
            <div className="flex justify-center my-8">
                <LoadingSpinner />
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-primary-darkest">
            <div className="bg-primary-darker px-8 py-6 rounded-lg shadow-xl w-full max-w-md">
                <h2 className="text-3xl font-bold text-primary-lightest mb-6">Reset Password</h2>
                {isSuccess ? (
                    <p className="text-primary-light">Your password has been reset successfully. Redirecting to login...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="New Password"
                                className="w-full bg-primary-dark text-primary-lightest placeholder-primary-light p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-medium"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-light hover:text-primary-lightest transition-colors duration-200"
                            >
                                {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm New Password"
                                className="w-full bg-primary-dark text-primary-lightest placeholder-primary-light p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-medium"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary-light hover:text-primary-lightest transition-colors duration-200"
                            >
                                {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                            </button>
                        </div>
                        {error && <p className="text-red-500 mb-4">{error}</p>}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary-medium text-primary-off-white px-4 py-2 rounded-md hover:bg-primary-dark transition duration-300"
                        >
                            {isLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;