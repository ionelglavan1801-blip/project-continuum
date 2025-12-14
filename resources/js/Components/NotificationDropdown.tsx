import { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, X } from 'lucide-react';
import axios from 'axios';

interface Notification {
    id: string;
    type: string;
    data: {
        message: string;
        task_id?: number;
        task_title?: string;
        project_name?: string;
    };
    read_at: string | null;
    created_at: string;
}

export default function NotificationDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const response = await axios.get(route('notifications.index'));
            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unread_count);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await axios.post(route('notifications.read', id));
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, read_at: new Date().toISOString() } : n
            ));
            setUnreadCount(Math.max(0, unreadCount - 1));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(route('notifications.read-all'));
            setNotifications(notifications.map(n => ({ ...n, read_at: new Date().toISOString() })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await axios.delete(route('notifications.destroy', id));
            const notification = notifications.find(n => n.id === id);
            setNotifications(notifications.filter(n => n.id !== id));
            if (notification && !notification.read_at) {
                setUnreadCount(Math.max(0, unreadCount - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.read_at) {
            markAsRead(notification.id);
        }
        if (notification.data.task_id) {
            window.location.href = route('tasks.show', notification.data.task_id);
        }
    };

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none"
            >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs text-indigo-600 hover:text-indigo-800"
                            >
                                Mark all as read
                            </button>
                        )}
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {loading && notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                Loading...
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-gray-500">
                                No notifications
                            </div>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`group flex items-start gap-3 border-b border-gray-100 px-4 py-3 last:border-0 ${
                                        !notification.read_at ? 'bg-indigo-50' : 'hover:bg-gray-50'
                                    }`}
                                >
                                    <button
                                        onClick={() => handleNotificationClick(notification)}
                                        className="flex-1 text-left"
                                    >
                                        <p className={`text-sm ${!notification.read_at ? 'font-medium text-gray-900' : 'text-gray-700'}`}>
                                            {notification.data.message}
                                        </p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {notification.created_at}
                                        </p>
                                    </button>
                                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                        {!notification.read_at && (
                                            <button
                                                onClick={() => markAsRead(notification.id)}
                                                className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
                                                title="Mark as read"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => deleteNotification(notification.id)}
                                            className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
