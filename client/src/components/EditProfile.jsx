import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Select from 'react-select';
import { indianCitiesAndStates } from '../data/indianCitiesAndStates';
import LoadingSpinner from './common/LoadingSpinner';

const EditProfile = () => {
    const [name, setName] = useState('');
    const [state, setState] = useState('');
    const [city, setCity] = useState('');
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');

    const [summary, setSummary] = useState('');
    const [socialLinks, setSocialLinks] = useState({
        instagram: '',
        linkedin: '',
        facebook: '',
        twitter: ''
    });
    const navigate = useNavigate();
    const { userId } = useAuth();
    const [username, setUsername] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const { user, login, logout } = useAuth();

    const stateOptions = Object.keys(indianCitiesAndStates).map(state => ({
        value: state,
        label: state
    }));

    const cityOptions = state
        ? indianCitiesAndStates[state].map(city => ({
            value: city,
            label: city
        }))
        : [];

    useEffect(() => {
        const fetchProfile = async () => {
            if (user && user.username) {
                try {
                    setIsLoading(true);
                    setError('');
                    const response = await api.get(`/api/users/profile/${user.username}`);
                    // const { name, username, cityState, bio, summary, socialLinks } = response.data;
                    const userData = response.data.user;
                    setName(userData.name || '');
                    setUsername(userData.username || '');
                    if (userData.cityState) {
                        const [cityValue, stateValue] = userData.cityState.split(', ');
                        setState(stateValue);
                        setCity(cityValue);
                    }
                    setTitle(userData.title || '');
                    setSummary(userData.summary || '');
                    setLink(userData.link || '');
                    setSocialLinks({
                        instagram: userData.socialLinks?.instagram || '',
                        linkedin: userData.socialLinks?.linkedin || '',
                        facebook: userData.socialLinks?.facebook || '',
                        twitter: userData.socialLinks?.twitter || ''
                    });
                } catch (error) {
                    setError('Failed to load profile. Please try again.');
                    if (error.response && error.response.status === 401) {
                        logout();
                    }
                } finally {
                    setIsLoading(false);
                }
            }
        };
        fetchProfile();
    }, [user, logout]);

    const handleSocialLinkChange = (platform) => (e) => {
        setSocialLinks(prev => ({ ...prev, [platform]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        const formData = new FormData();
        formData.append('name', name);
        formData.append('username', username);
        formData.append('cityState', `${city}, ${state}`);
        formData.append('title', title);
        formData.append('summary', summary);
        formData.append('link', link);
        formData.append('socialLinks', JSON.stringify(socialLinks));

        try {
            const response = await api.put('/api/users/profile', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            login(localStorage.getItem('token'), response.data.user);
            navigate(`/profile/${response.data.user.username}`);
        } catch (error) {
            setError('Failed to update profile. Please try again.');
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

    if (error) return <div className="text-center my-8 text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-primary-darkest text-primary-off-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl w-full space-y-8">
                <h2 className="text-2xl font-bold text-center mb-6">Edit Profile</h2>
                {user && (
                    <p className={`mb-4 ${user.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                        {user.isVerified
                            ? 'Your account is verified.'
                            : 'Your account is not verified. Please verify your email to access all features.'}
                    </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="name" className="block font-bold mb-2">Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="username" className="block font-bold mb-2">Username</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="state" className="block font-bold mb-2">State</label>
                        <Select
                            id="state"
                            options={stateOptions}
                            value={stateOptions.find(option => option.value === state)}
                            onChange={(selectedOption) => {
                                setState(selectedOption.value);
                                setCity('');
                            }}
                            className="basic-single"
                            classNamePrefix="select"
                            styles={{
                                control: (base) => ({
                                    ...base,
                                    backgroundColor: '#0b2b26',
                                    borderColor: '#235347',
                                }),
                                menu: (base) => ({
                                    ...base,
                                    backgroundColor: '#0b2b26',
                                }),
                                option: (base, state) => ({
                                    ...base,
                                    backgroundColor: state.isFocused ? '#163832' : '#0b2b26',
                                    color: '#edf5ef',
                                }),
                                singleValue: (base) => ({
                                    ...base,
                                    color: '#edf5ef',
                                }),
                            }}
                        />
                    </div>
                    {state && (
                        <div>
                            <label htmlFor="city" className="block font-bold mb-2">City</label>
                            <Select
                                id="city"
                                options={cityOptions}
                                value={cityOptions.find(option => option.value === city)}
                                onChange={(selectedOption) => setCity(selectedOption.value)}
                                className="basic-single"
                                classNamePrefix="select"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        backgroundColor: '#0b2b26',
                                        borderColor: '#235347',
                                    }),
                                    menu: (base) => ({
                                        ...base,
                                        backgroundColor: '#0b2b26',
                                    }),
                                    option: (base, state) => ({
                                        ...base,
                                        backgroundColor: state.isFocused ? '#163832' : '#0b2b26',
                                        color: '#edf5ef',
                                    }),
                                    singleValue: (base) => ({
                                        ...base,
                                        color: '#edf5ef',
                                    }),
                                }}
                            />
                        </div>
                    )}

                    <div>
                        <label htmlFor="title" className="block font-bold mb-2">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                        />
                    </div>
                    <div>
                        <label htmlFor="link" className="block font-bold mb-2">Link</label>
                        <input
                            type="url"
                            id="link"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                            className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                            placeholder="https://yourwebsite.com"
                        />
                    </div>
                    <div>
                        <label htmlFor="summary" className="block font-bold mb-2">Summary</label>
                        <textarea
                            id="summary"
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                            rows="3"
                        ></textarea>
                    </div>
                    <div>
                        <h3 className="block font-bold mb-2">Social Links</h3>
                        {Object.keys(socialLinks).map((platform) => (
                            <div key={platform} className="mb-2">
                                <label htmlFor={platform} className="block mb-1 capitalize">{platform}</label>
                                <input
                                    type="url"
                                    id={platform}
                                    value={socialLinks[platform]}
                                    onChange={handleSocialLinkChange(platform)}
                                    className="w-full px-3 py-2 bg-primary-darker text-primary-off-white border border-primary-medium rounded-lg focus:outline-none focus:border-primary-light"
                                    placeholder={`https://${platform}.com/yourusername`}
                                />
                            </div>
                        ))}
                    </div>
                    <button type="submit" className="w-full bg-primary-medium text-primary-off-white px-4 py-3 rounded-lg hover:bg-primary-dark disabled:bg-primary-darker disabled:cursor-not-allowed transition duration-300" disabled={isLoading}>
                        {isLoading ? 'Updating...' : 'Update Profile'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditProfile;