/**
 * InboxView Component
 *
 * Displays aggregated notifications from availability, tasks, equipment, and fixtures.
 */

import React, { useState, useEffect } from 'react';
import EmptyState, { EMPTY_STATE_PRESETS } from './EmptyState';
import {
  Bell,
  Check,
  AlertTriangle,
  Users,
  ClipboardList,
  Package,
  Calendar,
  Loader2,
  RefreshCw,
  Filter,
  CheckCircle,
  Trash2,
} from 'lucide-react';
import { Club, Fixture } from '../types';
import {
  getAllNotifications,
  Notification,
  NotificationType,
} from '../services/notificationService';

interface InboxViewProps {
  club: Club;
  fixtures: Fixture[];
  onNavigate: (tab: string) => void;
}

const categoryConfig: Record<Notification['category'], {
  label: string;
  icon: React.ReactNode;
  color: string;
}> = {
  availability: {
    label: 'Availability',
    icon: <Users size={14} />,
    color: 'text-blue-400 bg-blue-500/20',
  },
  tasks: {
    label: 'Tasks',
    icon: <ClipboardList size={14} />,
    color: 'text-amber-400 bg-amber-500/20',
  },
  equipment: {
    label: 'Equipment',
    icon: <Package size={14} />,
    color: 'text-purple-400 bg-purple-500/20',
  },
  content: {
    label: 'Content',
    icon: <Bell size={14} />,
    color: 'text-pink-400 bg-pink-500/20',
  },
  fixtures: {
    label: 'Fixtures',
    icon: <Calendar size={14} />,
    color: 'text-green-400 bg-green-500/20',
  },
  system: {
    label: 'System',
    icon: <Bell size={14} />,
    color: 'text-slate-400 bg-slate-500/20',
  },
};

const priorityConfig: Record<Notification['priority'], {
  label: string;
  dotColor: string;
  badgeColor: string;
}> = {
  high: {
    label: 'Urgent',
    dotColor: 'bg-red-500',
    badgeColor: 'bg-red-500/10 text-red-400 border-red-500/30',
  },
  medium: {
    label: 'Attention',
    dotColor: 'bg-amber-500',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  low: {
    label: 'Info',
    dotColor: 'bg-green-500',
    badgeColor: 'bg-green-500/10 text-green-400 border-green-500/30',
  },
};

const InboxView: React.FC<InboxViewProps> = ({ club, fixtures, onNavigate }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Notification['category'] | 'all'>('all');
  const [readNotifications, setReadNotifications] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(`pitchside_read_notifications_${club.id}`);
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await getAllNotifications(
        club.id,
        fixtures,
        club.players,
        { limit: 50 }
      );
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [club.id, fixtures]);

  // Save read notifications to localStorage
  useEffect(() => {
    localStorage.setItem(
      `pitchside_read_notifications_${club.id}`,
      JSON.stringify([...readNotifications])
    );
  }, [readNotifications, club.id]);

  const markAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    setReadNotifications(new Set(notifications.map(n => n.id)));
  };

  const clearRead = () => {
    setReadNotifications(new Set());
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.actionTab) {
      onNavigate(notification.actionTab);
    }
  };

  const filteredNotifications = selectedCategory === 'all'
    ? notifications
    : notifications.filter(n => n.category === selectedCategory);

  const unreadCount = notifications.filter(n => !readNotifications.has(n.id)).length;

  // Group by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let groupKey: string;
    if (date.toDateString() === today.toDateString()) {
      groupKey = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      groupKey = 'Yesterday';
    } else {
      groupKey = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' });
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const categories: Array<Notification['category'] | 'all'> = [
    'all',
    'availability',
    'tasks',
    'equipment',
    'fixtures',
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-white">Inbox</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-green-500 text-black text-xs font-bold rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Notifications, alerts, and updates from your club
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadNotifications}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:border-white/20 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-lg text-sm text-green-400 hover:bg-green-500/20 transition-colors"
            >
              <CheckCircle size={14} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {categories.map(cat => {
          const isAll = cat === 'all';
          const config = isAll ? null : categoryConfig[cat];
          const count = isAll
            ? notifications.length
            : notifications.filter(n => n.category === cat).length;

          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-green-500 text-black'
                  : 'bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              {config ? (
                <>
                  {config.icon}
                  {config.label}
                </>
              ) : (
                <>
                  <Filter size={14} />
                  All
                </>
              )}
              <span className={`text-xs ${selectedCategory === cat ? 'opacity-70' : 'text-slate-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-xl">
          <EmptyState
            {...EMPTY_STATE_PRESETS.notifications}
            description={selectedCategory !== 'all'
              ? 'Try selecting a different category'
              : 'No new notifications to show'}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedNotifications).map(([groupKey, groupNotifications]) => (
            <div key={groupKey}>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                {groupKey}
              </h3>
              <div className="space-y-2">
                {groupNotifications.map(notification => {
                  const isRead = readNotifications.has(notification.id);
                  const catConfig = categoryConfig[notification.category];
                  const prioConfig = priorityConfig[notification.priority];

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`bg-slate-800/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-white/20 ${
                        isRead
                          ? 'border-white/5 opacity-60'
                          : 'border-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        {/* Priority Indicator */}
                        <div className={`w-2 h-2 rounded-full mt-2 ${prioConfig.dotColor}`} />

                        {/* Category Icon */}
                        <div className={`p-2 rounded-lg ${catConfig.color}`}>
                          {catConfig.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className={`text-sm font-medium ${isRead ? 'text-slate-400' : 'text-white'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {notification.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${prioConfig.badgeColor}`}>
                                {prioConfig.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] ${catConfig.color}`}>
                                {catConfig.label}
                              </span>
                              <span className="text-[10px] text-slate-600">
                                {new Date(notification.timestamp).toLocaleTimeString('en-GB', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            {notification.actionLabel && (
                              <span className="text-xs text-green-500 hover:text-green-400">
                                {notification.actionLabel} →
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Read Indicator */}
                        {!isRead && (
                          <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions Footer */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <p className="text-xs text-slate-500">
            Showing {filteredNotifications.length} of {notifications.length} notifications
          </p>
          <button
            onClick={clearRead}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Reset read status
          </button>
        </div>
      )}
    </div>
  );
};

export default InboxView;
