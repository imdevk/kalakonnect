const Notification = require('../models/Notification');
const User = require('../models/User');

exports.getNotifications = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const user = await User.findById(req.userId)
            .populate({
                path: 'notifications.notification',
                populate: [
                    { path: 'sender', select: 'name username' },
                    { path: 'artworkId', select: 'title' }
                ]
            });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.notifications || user.notifications.length === 0) {
            return res.json({
                notifications: [],
                hasMore: false
            });
        }

        const sortedNotifications = user.notifications
            .filter(n => n.notification) // Filter out any null notifications
            .sort((a, b) => new Date(b.notification.createdAt) - new Date(a.notification.createdAt))
            .slice(skip, skip + limit + 1);

        const notifications = sortedNotifications.map(n => ({
            ...n.notification.toObject(),
            read: n.read
        }));

        const hasMore = notifications.length > limit;
        const notificationsToSend = hasMore ? notifications.slice(0, -1) : notifications;

        res.json({
            notifications: notificationsToSend,
            hasMore: hasMore
        });
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        // Update all notifications
        await Notification.updateMany(
            { recipient: req.userId, read: false },
            { $set: { read: true } }
        );

        // Update all notifications in the user's array
        await User.findByIdAndUpdate(
            req.userId,
            {
                '$set': {
                    'notifications.$[].read': true
                }
            }
        );

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        next(error);
    }
};

exports.markOneAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        if (notification.recipient.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized to mark this notification as read' });
        }

        // Update the notification document
        notification.read = true;
        await notification.save();

        // Update the read status in the user's notifications array
        await User.findByIdAndUpdate(
            req.userId,
            {
                '$set': {
                    'notifications.$[elem].read': true
                }
            },
            {
                arrayFilters: [{ 'elem.notification': notification._id }],
                new: true
            }
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

exports.createNotification = async (recipientId, senderId, type, artworkId, commentId = null, action) => {
    try {

        const sender = await User.findById(senderId);
        if (!sender) {
            throw new Error('Sender not found');
        }

        let content, link;
        switch (type) {
            case 'like':
                content = `${sender.name} liked your artwork`;
                link = `/artwork/${artworkId}`;
                break;
            case 'comment':
                content = `${sender.name} commented on your artwork`;
                link = `/artwork/${artworkId}`;
                break;
            case 'follow':
                content = `${sender.name} started following you`;
                link = `/profile/${sender.username}`;
                break;
            case 'commentLike':
                content = `${sender.name} liked your comment`;
                link = `/artwork/${artworkId}#comment-${commentId}`;
                break;
            default:
                content = action;
        }

        const newNotification = new Notification({
            recipient: recipientId,
            sender: senderId,
            type,
            artworkId,
            commentId,
            content,
            link
        });
        const savedNotification = await newNotification.save();

        const updatedUser = await User.findByIdAndUpdate(
            recipientId,
            {
                $push: {
                    notifications: {
                        notification: savedNotification._id,
                        read: false
                    }
                }
            },
            { new: true }
        );
    } catch (error) {
        console.error('Error creating notification:', error);
    }
};

exports.getNotificationCount = async (req, res, next) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const count = user.notifications.filter(n => !n.read).length;
        res.json({ count });
    } catch (error) {
        console.error('Error in getNotificationCount:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};