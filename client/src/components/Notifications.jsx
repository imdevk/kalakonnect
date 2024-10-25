import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const Notifications = ({ isOpen, onClose }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const { user, notificationCount, fetchNotificationCount } = useAuth();

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async (pageNumber = 1) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/notifications?page=${pageNumber}&limit=10`);
            if (response.data && Array.isArray(response.data.notifications)) {
                if (pageNumber === 1) {
                    setNotifications(response.data.notifications);
                } else {
                    setNotifications(prev => [...prev, ...response.data.notifications]);
                }
                setHasMore(response.data.hasMore);
                setPage(pageNumber);
            } else {
                console.error('Invalid response format:', response.data);
                setNotifications([]);
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async () => {
        try {
            await api.post('/api/notifications/mark-read');
            fetchNotifications();
            fetchNotificationCount();
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            try {
                await api.post(`/api/notifications/${notification._id}/mark-read`);
                fetchNotificationCount();
                setNotifications(prevNotifications =>
                    prevNotifications.map(n =>
                        n._id === notification._id ? { ...n, read: true } : n
                    )
                );
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }
        onClose();
    };

    const loadMore = () => {
        fetchNotifications(page + 1);
    };

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 mt-2 w-80 bg-primary-darker rounded-md shadow-lg overflow-hidden z-20">
            <div className="px-4 py-2 bg-primary-dark flex justify-between items-center">
                <h3 className="text-lg font-semibold text-primary-off-white">Notifications ({notificationCount})</h3>
                <button onClick={markAsRead} className="text-sm text-primary-light hover:text-primary-lightest">
                    Mark all as read
                </button>
            </div>
            <div className="py-2">

                <div className="max-h-80 overflow-y-auto">
                    {loading && page === 1 ? (
                        <p className="px-4 py-2 text-primary-light">Loading notifications...</p>
                    ) : notifications.length === 0 ? (
                        <p className="px-4 py-2 text-primary-light">No new notifications</p>
                    ) : (
                        notifications.map((notification) => (
                            <Link
                                key={notification._id}
                                to={notification.link}
                                className={`block px-4 py-2 hover:bg-primary-dark ${notification.read ? 'opacity-50' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <p className="text-sm text-primary-off-white">{notification.content}</p>
                                <p className="text-xs text-primary-light">{new Date(notification.createdAt).toLocaleString()}</p>
                            </Link>
                        ))
                    )}
                    {hasMore && (
                        <div className="px-4 py-2">
                            <button
                                onClick={loadMore}
                                className="w-full text-center text-sm text-primary-light hover:text-primary-lightest bg-primary-dark hover:bg-primary-medium px-4 py-2 rounded-md transition duration-300"
                            >
                                Show More
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="px-4 py-2 bg-primary-dark">
                <button onClick={onClose} className="w-full text-center text-sm text-primary-light hover:text-primary-lightest">
                    Close
                </button>
            </div>
        </div>
    );
};

export default Notifications;