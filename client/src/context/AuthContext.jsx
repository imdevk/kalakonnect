import React, { createContext, useState, useContext, useEffect } from 'react';
import * as jwtDecode from 'jwt-decode';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [notificationCount, setNotificationCount] = useState(0);


    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode.jwtDecode(token);
            const currentTime = Date.now() / 1000;
            if (decodedToken.exp > currentTime) {
                setIsLoggedIn(true);
                fetchUser();
                // setUser({
                //     id: decodedToken.id,
                //     username: decodedToken.username,
                //     name: decodedToken.name,
                //     email: decodedToken.email
                // });
            } else {
                logout();
            }
        }
    }, []);

    useEffect(() => {
        let interval;
        if (isLoggedIn) {
            fetchNotificationCount();
            interval = setInterval(fetchNotificationCount, 60000); // Fetch every minute
        }
        return () => clearInterval(interval);
    }, [isLoggedIn]);

    const fetchUser = async () => {
        try {
            const response = await api.get('/api/users/me');
            setUser(response.data);
            // fetchNotificationCount();
        } catch (error) {
            console.error('Error fetching user data:', error);
        }
    };

    const fetchNotificationCount = async () => {
        try {
            const response = await api.get('/api/notifications/count');
            setNotificationCount(response.data.count);
        } catch (error) {
            console.error('Error fetching notification count:', error);
        }
    };

    const login = async (token) => {
        localStorage.setItem('token', token);
        // const decodedToken = jwtDecode.jwtDecode(token);
        setIsLoggedIn(true);
        await fetchUser();
    };

    const logout = () => {
        localStorage.removeItem('token');
        setIsLoggedIn(false);
        setUser(null);
        setNotificationCount(0);
    };

    const updateUser = (updatedUserData) => {
        setUser(prevUser => ({ ...prevUser, ...updatedUserData }));
    };

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout, updateUser, notificationCount, fetchNotificationCount }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);