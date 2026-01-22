/**
 * ActivityPanel Component
 *
 * Timeline view of audit events showing who did what and when.
 * Part of Independence & Leverage feature set - Phase 5.
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Hand,
  CheckCircle2,
  RotateCcw,
  UserPlus,
  AlertCircle,
  ThumbsUp,
  Send,
  Calendar,
  Edit,
  ArrowRightLeft,
  UserX,
  User,
  Loader2,
  Clock,
  Filter,
} from 'lucide-react';
import { AuditEvent, AuditEventType, AUDIT_EVENT_LABELS, ClubUser } from '../types';
import { getAuditEvents, getFixtureAuditEvents } from '../services/auditService';
import { getClubUsers } from '../services/userService';
import UserAvatar from './UserAvatar';

interface ActivityPanelProps {
  clubId: string;
  fixtureId?: string;  // If provided, shows fixture-specific activity
  limit?: number;
  showFilter?: boolean;
  compact?: boolean;
}

// Icon mapping
const iconMap: Record<string, React.FC<{ size: number; className?: string }>> = {
  Plus,
  Hand,
  CheckCircle2,
  RotateCcw,
  UserPlus,
  AlertCircle,
  ThumbsUp,
  Send,
  Calendar,
  Edit,
  ArrowRightLeft,
  UserX,
  User,
};

// Event type to icon name mapping
const EVENT_ICONS: Record<AuditEventType, string> = {
  'task.created': 'Plus',
  'task.claimed': 'Hand',
  'task.completed': 'CheckCircle2',
  'task.reopened': 'RotateCcw',
  'task.reassigned': 'UserPlus',
  'task.blocked': 'AlertCircle',
  'content.approved': 'ThumbsUp',
  'content.published': 'Send',
  'fixture.created': 'Calendar',
  'fixture.updated': 'Edit',
  'handover.executed': 'ArrowRightLeft',
  'user.marked_unavailable': 'UserX',
  'user.status_changed': 'User',
};

// Event type colors
const EVENT_COLORS: Record<AuditEventType, string> = {
  'task.created': 'text-blue-400 bg-blue-500/20',
  'task.claimed': 'text-purple-400 bg-purple-500/20',
  'task.completed': 'text-green-400 bg-green-500/20',
  'task.reopened': 'text-amber-400 bg-amber-500/20',
  'task.reassigned': 'text-cyan-400 bg-cyan-500/20',
  'task.blocked': 'text-red-400 bg-red-500/20',
  'content.approved': 'text-green-400 bg-green-500/20',
  'content.published': 'text-blue-400 bg-blue-500/20',
  'fixture.created': 'text-blue-400 bg-blue-500/20',
  'fixture.updated': 'text-slate-400 bg-slate-500/20',
  'handover.executed': 'text-purple-400 bg-purple-500/20',
  'user.marked_unavailable': 'text-red-400 bg-red-500/20',
  'user.status_changed': 'text-slate-400 bg-slate-500/20',
};

const ActivityPanel: React.FC<ActivityPanelProps> = ({
  clubId,
  fixtureId,
  limit = 20,
  showFilter = false,
  compact = false,
}) => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTypes, setFilterTypes] = useState<AuditEventType[]>([]);

  useEffect(() => {
    loadData();
  }, [clubId, fixtureId, filterTypes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventsData, usersData] = await Promise.all([
        fixtureId
          ? getFixtureAuditEvents(clubId, fixtureId, limit)
          : getAuditEvents(clubId, {
              limit,
              eventTypes: filterTypes.length > 0 ? filterTypes : undefined,
            }),
        getClubUsers(clubId),
      ]);
      setEvents(eventsData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserById = (userId: string): ClubUser | undefined => {
    return users.find(u => u.id === userId);
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getEventDescription = (event: AuditEvent): string => {
    const baseLabel = AUDIT_EVENT_LABELS[event.event_type];
    const payload = event.payload;

    // Add context from payload
    if (payload.task_label) {
      return `${baseLabel}: "${payload.task_label}"`;
    }
    if (payload.opponent) {
      return `${baseLabel}: vs ${payload.opponent}`;
    }
    return baseLabel;
  };

  const renderIcon = (eventType: AuditEventType) => {
    const iconName = EVENT_ICONS[eventType];
    const IconComponent = iconMap[iconName] || User;
    const colorClass = EVENT_COLORS[eventType];

    return (
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
        <IconComponent size={14} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-800 flex items-center justify-center">
          <Clock size={24} className="text-slate-500" />
        </div>
        <p className="text-slate-400 text-sm">No activity yet</p>
        <p className="text-slate-500 text-xs mt-1">Actions will appear here</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Filter (optional) */}
      {showFilter && (
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-slate-500" />
          <select
            value={filterTypes[0] || ''}
            onChange={e => setFilterTypes(e.target.value ? [e.target.value as AuditEventType] : [])}
            className="bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
          >
            <option value="">All activity</option>
            <option value="task.completed">Completions</option>
            <option value="task.claimed">Claims</option>
            <option value="task.reassigned">Reassignments</option>
            <option value="fixture.created">Fixtures</option>
          </select>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-white/10" />

        {events.map((event, index) => {
          const actor = getUserById(event.actor_user_id);

          return (
            <div
              key={event.id}
              className={`relative flex gap-3 ${compact ? 'py-2' : 'py-3'} ${
                index !== events.length - 1 ? '' : ''
              }`}
            >
              {/* Icon */}
              <div className="relative z-10 flex-shrink-0">
                {renderIcon(event.event_type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {actor ? (
                    <>
                      {!compact && <UserAvatar user={actor} size="sm" />}
                      <span className="text-white text-sm font-medium truncate">
                        {actor.name.split(' ')[0]}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 text-sm">System</span>
                  )}
                  <span className="text-slate-500 text-xs">{formatTime(event.created_at)}</span>
                </div>
                <p className={`text-slate-400 ${compact ? 'text-xs' : 'text-sm'} mt-0.5 truncate`}>
                  {getEventDescription(event)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityPanel;
