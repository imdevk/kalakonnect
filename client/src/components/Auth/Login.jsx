import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../common/LoadingSpinner';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await api.post('/api/auth/login', { email, password });
            login(response.data.token, response.data.user);
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await api.post('/api/auth/forgot-password', { email });
            setResetEmailSent(true);
        } catch (error) {
            setError(error.response?.data?.message || 'An error occurred while processing your request');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');
        setIsLoading(true);
        try {
            const response = await api.post('/api/auth/google', {
                credential: credentialResponse.credential
            });
            login(response.data.token, response.data.user);
            navigate('/');
        } catch (error) {
            setError(error.response?.data?.message || 'An error occurred during Google login');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google login failed. Please try again.');
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
                <h2 className="text-3xl font-bold text-primary-lightest mb-6">Log in to your account.</h2>
                <p className="text-primary-light mb-8">Not A Member Yet?
                    <Link to="/signup" className="text-primary-off-white hover:underline"> Join Now!
                    </Link></p>
                {error && <p className="text-red-500 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="w-full bg-primary-dark text-primary-lightest placeholder-primary-light p-3 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-medium"
                        required
                    />
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Password"
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
                    <div className="flex justify-between items-center">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-primary-medium text-primary-off-white px-4 py-2 rounded-md hover:bg-primary-dark transition duration-300"
                        >
                            {isLoading ? 'Logging in...' : 'Log in'}
                        </button>
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={isLoading}
                            className="text-primary-light hover:text-primary-lightest"
                        >
                            Forgot Password?
                        </button>
                    </div>
                </form>
                {resetEmailSent && (
                    <p className="mt-4 text-primary-light">A password reset email has been sent to your email address.</p>
                )}

                <div className="flex items-center my-6">
                    <div className="flex-grow border-t border-primary-light"></div>
                    <span className="flex-shrink mx-4 text-primary-light">or</span>
                    <div className="flex-grow border-t border-primary-light"></div>
                </div>

                <div className="mt-6 grid justify-items-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        auto_select={false}
                        type='icon'
                        theme="filled_black"
                        size="large"
                        text="continue_with"
                        shape="pill"
                        render={(renderProps) => (
                            <button
                                onClick={renderProps.onClick}
                                disabled={renderProps.disabled || isLoading}
                                className="w-full bg-light text-light py-3 px-4 rounded-md hover:bg-primary-dark transition duration-300 flex items-center justify-center"
                            >
                                <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24">
                                    <path
                                        fill="currentColor"
                                        d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                                    />
                                </svg>
                                Continue with Google
                            </button>
                        )}
                    />
                </div>
            </div>
        </div>
    );
};

export default Login;