/**
 * AtRiskWidget Component
 *
 * Dashboard widget showing at-risk tasks count and details.
 * Part of Independence & Leverage feature set - Phase 7.
 */

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Calendar,
  User,
  Clock,
  Hand,
} from 'lucide-react';
import {
  RiskSummary,
  TaskRisk,
  RiskLevel,
  ClubUser,
} from '../types';
import {
  getRiskSummary,
  getRiskColorClass,
  formatRiskReason,
} from '../services/exceptionAlertService';
import { getClubUsers } from '../services/userService';
import { updateFixtureTask } from '../services/fixtureTaskService';
import UserAvatar from './UserAvatar';

interface AtRiskWidgetProps {
  clubId: string;
  currentUserId?: string;
  onTaskClick?: (taskId: string, fixtureId: string) => void;
  expanded?: boolean;
}

const AtRiskWidget: React.FC<AtRiskWidgetProps> = ({
  clubId,
  currentUserId,
  onTaskClick,
  expanded = false,
}) => {
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [users, setUsers] = useState<ClubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(expanded);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [clubId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [summaryData, usersData] = await Promise.all([
        getRiskSummary(clubId),
        getClubUsers(clubId),
      ]);
      setSummary(summaryData);
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (risk: TaskRisk) => {
    if (!currentUserId) return;
    setClaimingId(risk.task.id);
    try {
      await updateFixtureTask(risk.task.id, {
        owner_user_id: currentUserId,
      });
      // Refresh data
      await loadData();
    } catch (error) {
      console.error('Error claiming task:', error);
    } finally {
      setClaimingId(null);
    }
  };

  const getUserById = (userId?: string): ClubUser | undefined => {
    return users.find(u => u.id === userId);
  };

  const formatTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today ${formatTime(dateStr)}`;
    }
    if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${formatTime(dateStr)}`;
    }
    return date.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (!summary || (summary.critical === 0 && summary.warning === 0)) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle2 className="text-green-500" size={20} />
          </div>
          <div>
            <h3 className="text-white font-semibold">All Clear</h3>
            <p className="text-sm text-slate-400">No at-risk tasks</p>
          </div>
        </div>
      </div>
    );
  }

  const allAtRisk = [...summary.criticalTasks, ...summary.warningTasks];
  const displayTasks = showDetails ? allAtRisk : allAtRisk.slice(0, 3);

  return (
    <div className="glass-card overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            summary.critical > 0 ? 'bg-red-500/20' : 'bg-amber-500/20'
          }`}>
            {summary.critical > 0 ? (
              <AlertCircle className="text-red-500" size={20} />
            ) : (
              <AlertTriangle className="text-amber-500" size={20} />
            )}
          </div>
          <div>
            <h3 className="text-white font-semibold">At-Risk Tasks</h3>
            <div className="flex items-center gap-2 text-sm">
              {summary.critical > 0 && (
                <span className="text-red-400">{summary.critical} critical</span>
              )}
              {summary.critical > 0 && summary.warning > 0 && (
                <span className="text-slate-500">•</span>
              )}
              {summary.warning > 0 && (
                <span className="text-amber-400">{summary.warning} warning</span>
              )}
            </div>
          </div>
        </div>
        <ChevronRight
          size={20}
          className={`text-slate-400 transition-transform ${showDetails ? 'rotate-90' : ''}`}
        />
      </div>

      {/* Task List */}
      <div className={`border-t border-white/10 ${showDetails ? '' : 'max-h-[200px] overflow-hidden'}`}>
        {displayTasks.map((risk, index) => {
          const owner = getUserById(risk.task.owner_user_id);
          const isUnassigned = !risk.task.owner_user_id;

          return (
            <div
              key={risk.task.id}
              className={`p-3 flex items-center gap-3 ${
                index !== displayTasks.length - 1 ? 'border-b border-white/5' : ''
              } hover:bg-white/5 transition-colors`}
            >
              {/* Risk indicator */}
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                risk.level === 'critical' ? 'bg-red-500' : 'bg-amber-500'
              }`} />

              {/* Content */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => risk.fixture && onTaskClick?.(risk.task.id, risk.fixture.id)}
              >
                <p className="text-sm text-white truncate">{risk.task.label}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  {risk.fixture && (
                    <>
                      <span className="flex items-center gap-1">
                        <Calendar size={10} />
                        {formatDate(risk.fixture.kickoff_time)}
                      </span>
                      <span>vs {risk.fixture.opponent}</span>
                    </>
                  )}
                </div>
                <p className={`text-xs mt-1 ${getRiskColorClass(risk.level).split(' ')[0]}`}>
                  {formatRiskReason(risk)}
                </p>
              </div>

              {/* Owner or Claim */}
              {owner ? (
                <UserAvatar user={owner} size="sm" />
              ) : isUnassigned && currentUserId ? (
                <button
                  onClick={() => handleClaim(risk)}
                  disabled={claimingId === risk.task.id}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors disabled:opacity-50"
                >
                  {claimingId === risk.task.id ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <>
                      <Hand size={12} />
                      Claim
                    </>
                  )}
                </button>
              ) : (
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <User size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more */}
      {!showDetails && allAtRisk.length > 3 && (
        <button
          onClick={() => setShowDetails(true)}
          className="w-full py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10"
        >
          Show {allAtRisk.length - 3} more
        </button>
      )}
    </div>
  );
};

export default AtRiskWidget;
