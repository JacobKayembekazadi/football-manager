/**
 * D14 Ops Command Centre
 * The main dashboard for football operations with FM-style "Continue" button
 */

import React, { useState, useEffect } from 'react';
import {
    Play,
    CheckSquare,
    AlertTriangle,
    Clock,
    User,
    Calendar,
    ChevronRight,
    Plus,
    Filter,
    RefreshCw,
    Zap,
    ListChecks,
    Activity,
} from 'lucide-react';
import type { OpsTask, TaskStatus, TaskPriority, TaskStats, ActivityLogEntry } from '../types';
import {
    getOpsTasks,
    getNextCriticalTask,
    getTaskStats,
    startTask,
    completeTask,
} from '../services/opsTaskService';
import { getActivityLog, formatActivityMessage, getActivityIcon } from '../services/activityLogService';

interface OpsCommandCentreProps {
    orgId: string;
    clubId: string;
    userId: string;
    userName?: string;
}

const OpsCommandCentre: React.FC<OpsCommandCentreProps> = ({
    orgId,
    clubId,
    userId,
    userName,
}) => {
    const [nextTask, setNextTask] = useState<OpsTask | null>(null);
    const [tasks, setTasks] = useState<OpsTask[]>([]);
    const [stats, setStats] = useState<TaskStats | null>(null);
    const [recentActivity, setRecentActivity] = useState<ActivityLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingTaskId, setProcessingTaskId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'mine' | 'overdue'>('all');

    // Load data
    useEffect(() => {
        loadData();
    }, [orgId, clubId, filter]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load next critical task
            const critical = await getNextCriticalTask(orgId, clubId, filter === 'mine' ? userId : undefined);
            setNextTask(critical);

            // Load all tasks
            const allTasks = await getOpsTasks(orgId, clubId, {
                status: ['pending', 'in_progress', 'blocked'],
                owner_user_id: filter === 'mine' ? userId : undefined,
            });
            setTasks(allTasks);

            // Load stats
            const taskStats = await getTaskStats(orgId, clubId);
            setStats(taskStats);

            // Load recent activity
            const activity = await getActivityLog(orgId, clubId, { limit: 10 });
            setRecentActivity(activity);
        } catch (error) {
            console.error('Error loading ops data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle "Continue" button - starts or completes the next task
    const handleContinue = async () => {
        if (!nextTask) return;

        setProcessingTaskId(nextTask.id);
        try {
            if (nextTask.status === 'pending') {
                await startTask(nextTask.id, userId);
            } else if (nextTask.status === 'in_progress') {
                await completeTask(nextTask.id, userId);
            }
            await loadData();
        } catch (error) {
            console.error('Error processing task:', error);
        } finally {
            setProcessingTaskId(null);
        }
    };

    // Priority colors
    const getPriorityColor = (priority: TaskPriority) => {
        const colors: Record<TaskPriority, string> = {
            critical: 'bg-red-500',
            high: 'bg-orange-500',
            medium: 'bg-yellow-500',
            low: 'bg-green-500',
        };
        return colors[priority];
    };

    // Status colors
    const getStatusBadge = (status: TaskStatus) => {
        const styles: Record<TaskStatus, string> = {
            pending: 'bg-gray-600 text-gray-200',
            in_progress: 'bg-blue-600 text-blue-100',
            blocked: 'bg-red-600 text-red-100',
            completed: 'bg-green-600 text-green-100',
            missed: 'bg-red-800 text-red-100',
        };
        return styles[status];
    };

    // Format due time
    const formatDueTime = (dueAt: string) => {
        const due = new Date(dueAt);
        const now = new Date();
        const diffMs = due.getTime() - now.getTime();
        const diffMins = Math.round(diffMs / 60000);

        if (diffMins < 0) {
            const overdueMins = Math.abs(diffMins);
            if (overdueMins < 60) return `${overdueMins}m overdue`;
            if (overdueMins < 1440) return `${Math.round(overdueMins / 60)}h overdue`;
            return `${Math.round(overdueMins / 1440)}d overdue`;
        }

        if (diffMins < 60) return `in ${diffMins}m`;
        if (diffMins < 1440) return `in ${Math.round(diffMins / 60)}h`;
        return `in ${Math.round(diffMins / 1440)}d`;
    };

    const isOverdue = (dueAt: string) => new Date(dueAt) < new Date();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-purple-400" />
                        Ops Command Centre
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        {userName ? `Welcome, ${userName}` : 'Football operations at a glance'}
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                    <RefreshCw className="w-5 h-5 text-gray-400" />
                </button>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <ListChecks className="w-4 h-4" />
                            Total Tasks
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-blue-400 text-sm">
                            <Play className="w-4 h-4" />
                            In Progress
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">{stats.in_progress}</div>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                            <CheckSquare className="w-4 h-4" />
                            Completed
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">{stats.completed}</div>
                    </div>
                    <div className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border ${stats.overdue > 0 ? 'border-red-500/50' : 'border-white/10'}`}>
                        <div className="flex items-center gap-2 text-red-400 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            Overdue
                        </div>
                        <div className="text-2xl font-bold text-white mt-1">{stats.overdue}</div>
                    </div>
                </div>
            )}

            {/* Continue Button - FM Style */}
            {nextTask ? (
                <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/30">
                    <div className="flex items-center justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(nextTask.priority)} text-white`}>
                                    {nextTask.priority.toUpperCase()}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(nextTask.status)}`}>
                                    {nextTask.status.replace('_', ' ')}
                                </span>
                                {isOverdue(nextTask.due_at) && (
                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white animate-pulse">
                                        OVERDUE
                                    </span>
                                )}
                            </div>
                            <h2 className="text-xl font-bold text-white">{nextTask.title}</h2>
                            {nextTask.description && (
                                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{nextTask.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {formatDueTime(nextTask.due_at)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <User className="w-4 h-4" />
                                    {nextTask.owner_name || 'Assigned'}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={handleContinue}
                            disabled={processingTaskId === nextTask.id}
                            className={`
                flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg
                ${processingTaskId === nextTask.id
                                    ? 'bg-gray-600 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 shadow-lg shadow-green-500/30'
                                }
                text-white transition-all transform hover:scale-105
              `}
                        >
                            {processingTaskId === nextTask.id ? (
                                <RefreshCw className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    <Play className="w-6 h-6" />
                                    {nextTask.status === 'pending' ? 'Start' : 'Complete'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 backdrop-blur-sm rounded-2xl p-6 border border-green-500/30 text-center">
                    <CheckSquare className="w-12 h-12 text-green-400 mx-auto mb-2" />
                    <h2 className="text-xl font-bold text-white">All caught up!</h2>
                    <p className="text-gray-400 text-sm mt-1">No pending tasks. Great work!</p>
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                >
                    All Tasks
                </button>
                <button
                    onClick={() => setFilter('mine')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'mine' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                >
                    My Tasks
                </button>
                <button
                    onClick={() => setFilter('overdue')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'overdue' ? 'bg-purple-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                        }`}
                >
                    Overdue
                </button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Task Queue */}
                <div className="md:col-span-2 space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <ListChecks className="w-5 h-5 text-purple-400" />
                        Task Queue
                    </h3>
                    {tasks.length === 0 ? (
                        <div className="bg-white/5 rounded-xl p-8 text-center text-gray-400">
                            No tasks found
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {tasks.slice(0, 10).map((task) => (
                                <div
                                    key={task.id}
                                    className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border transition-colors hover:bg-white/10 ${isOverdue(task.due_at) ? 'border-red-500/50' : 'border-white/10'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                                                <span className="text-white font-medium">{task.title}</span>
                                            </div>
                                            <div className="flex items-center gap-3 text-sm text-gray-400">
                                                <span className={`px-2 py-0.5 rounded text-xs ${getStatusBadge(task.status)}`}>
                                                    {task.status.replace('_', ' ')}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDueTime(task.due_at)}
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-500" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Activity */}
                <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-purple-400" />
                        Recent Activity
                    </h3>
                    {recentActivity.length === 0 ? (
                        <div className="bg-white/5 rounded-xl p-4 text-center text-gray-400 text-sm">
                            No recent activity
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {recentActivity.slice(0, 8).map((entry) => (
                                <div
                                    key={entry.id}
                                    className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">{getActivityIcon(entry.action)}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-gray-300 line-clamp-2">
                                                {formatActivityMessage(entry)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {new Date(entry.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OpsCommandCentre;
