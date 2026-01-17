/**
 * Operations Hub
 *
 * Central hub for grassroots club operations:
 * - Squad Broadcast (messaging)
 * - Training Sessions (schedule & attendance)
 * - Quick Expenses (income/expense tracking)
 * - Opposition Notes (simple scouting)
 */

import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Calendar,
  DollarSign,
  ClipboardList,
  Users,
  Send,
  Plus,
  Trash2,
  Check,
  X,
  Clock,
  MapPin,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Shield,
  Loader2,
} from 'lucide-react';
import { Club, Fixture, Player } from '../types';
import {
  Broadcast,
  BroadcastChannel,
  getDemoBroadcasts,
  saveDemoBroadcast,
  TrainingSession,
  TrainingType,
  TrainingAttendance,
  getDemoTrainingSessions,
  saveDemoTrainingSession,
  deleteDemoTrainingSession,
  getDemoTrainingAttendance,
  setDemoTrainingAttendance,
  Expense,
  ExpenseCategory,
  getDemoExpenses,
  saveDemoExpense,
  deleteDemoExpense,
  getDemoExpensesSummary,
  OppositionNote,
  getDemoOppositionNotes,
  saveDemoOppositionNote,
  deleteDemoOppositionNote,
  getDemoOppositionNoteByOpponent,
} from '../services/demoStorageService';
import { getAvailabilityForFixture } from '../services/availabilityService';

interface OperationsHubProps {
  club: Club;
  fixtures: Fixture[];
}

type ActiveSection = 'broadcast' | 'training' | 'expenses' | 'scouting';

const OperationsHub: React.FC<OperationsHubProps> = ({ club, fixtures }) => {
  const [activeSection, setActiveSection] = useState<ActiveSection>('broadcast');

  const sections = [
    { id: 'broadcast' as const, label: 'Squad Broadcast', icon: MessageSquare, color: 'text-blue-400' },
    { id: 'training' as const, label: 'Training', icon: Calendar, color: 'text-green-400' },
    { id: 'expenses' as const, label: 'Expenses', icon: DollarSign, color: 'text-amber-400' },
    { id: 'scouting' as const, label: 'Scouting', icon: Target, color: 'text-purple-400' },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Operations Hub</h2>
        <p className="text-slate-400 text-sm mt-1">Manage your club's day-to-day operations</p>
      </div>

      {/* Section Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium whitespace-nowrap transition-all ${
                activeSection === section.id
                  ? 'bg-green-500 text-black'
                  : 'bg-slate-800/50 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
              }`}
            >
              <Icon size={16} />
              {section.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {activeSection === 'broadcast' && (
        <BroadcastSection club={club} fixtures={fixtures} />
      )}
      {activeSection === 'training' && (
        <TrainingSection club={club} fixtures={fixtures} />
      )}
      {activeSection === 'expenses' && (
        <ExpensesSection club={club} />
      )}
      {activeSection === 'scouting' && (
        <ScoutingSection club={club} fixtures={fixtures} />
      )}
    </div>
  );
};

// ============================================================================
// Squad Broadcast Section
// ============================================================================

const BroadcastSection: React.FC<{ club: Club; fixtures: Fixture[] }> = ({ club, fixtures }) => {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<BroadcastChannel>('all');
  const [selectedFixture, setSelectedFixture] = useState<string>('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setBroadcasts(getDemoBroadcasts(club.id));
  }, [club.id]);

  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED');

  const getRecipientCount = () => {
    switch (channel) {
      case 'all':
        return club.players.length;
      case 'available':
      case 'unavailable':
      case 'no_response':
        return '?'; // Would need to check availability
      default:
        return club.players.length;
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setSending(true);

    // Get recipient IDs based on channel
    let recipientIds = club.players.map(p => p.id);

    if (selectedFixture && channel !== 'all') {
      try {
        const availability = await getAvailabilityForFixture(selectedFixture);
        if (channel === 'available') {
          recipientIds = availability.filter(a => a.status === 'available').map(a => a.player_id);
        } else if (channel === 'unavailable') {
          recipientIds = availability.filter(a => a.status === 'unavailable' || a.status === 'injured').map(a => a.player_id);
        } else if (channel === 'no_response') {
          recipientIds = availability.filter(a => a.status === 'no_response').map(a => a.player_id);
        }
      } catch (e) {
        // Fall back to all players
      }
    }

    const broadcast = saveDemoBroadcast({
      club_id: club.id,
      message: message.trim(),
      channel,
      recipient_ids: recipientIds,
      fixture_id: selectedFixture || undefined,
    });

    setBroadcasts([broadcast, ...broadcasts]);
    setMessage('');
    setSending(false);
  };

  const quickMessages = [
    { label: 'Training Reminder', msg: 'Reminder: Training tonight at 7pm. Please confirm attendance.' },
    { label: 'Match Day', msg: 'Match day tomorrow! Please arrive 1 hour before kick-off.' },
    { label: 'Kit Reminder', msg: 'Remember to bring your full kit including shin pads.' },
    { label: 'Availability', msg: 'Please update your availability for the upcoming match.' },
  ];

  return (
    <div className="space-y-6">
      {/* Compose */}
      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Send size={16} className="text-blue-400" />
          Send Broadcast
        </h3>

        {/* Quick Messages */}
        <div className="flex flex-wrap gap-2">
          {quickMessages.map((qm, i) => (
            <button
              key={i}
              onClick={() => setMessage(qm.msg)}
              className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              {qm.label}
            </button>
          ))}
        </div>

        {/* Message Input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message to the squad..."
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 outline-none resize-none h-24"
        />

        {/* Options */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Send To</label>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as BroadcastChannel)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
            >
              <option value="all">All Players ({club.players.length})</option>
              <option value="available">Available Players</option>
              <option value="unavailable">Unavailable Players</option>
              <option value="no_response">No Response Yet</option>
            </select>
          </div>

          {channel !== 'all' && (
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">For Fixture</label>
              <select
                value={selectedFixture}
                onChange={(e) => setSelectedFixture(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
              >
                <option value="">Select fixture...</option>
                {upcomingFixtures.map(f => (
                  <option key={f.id} value={f.id}>vs {f.opponent}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <button
          onClick={handleSend}
          disabled={!message.trim() || sending}
          className="w-full py-3 bg-blue-500 hover:bg-blue-400 disabled:opacity-50 text-black font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {sending ? 'Sending...' : `Send to ${getRecipientCount()} players`}
        </button>
      </div>

      {/* Recent Broadcasts */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-400 uppercase">Recent Broadcasts</h3>
        {broadcasts.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
            <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No broadcasts sent yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {broadcasts.slice(0, 10).map((b) => (
              <div key={b.id} className="bg-slate-800/30 border border-white/5 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-sm text-white">{b.message}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(b.sent_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded">
                        {b.recipient_ids.length} recipients
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Training Sessions Section
// ============================================================================

const TrainingSection: React.FC<{ club: Club; fixtures: Fixture[] }> = ({ club, fixtures }) => {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedSession, setSelectedSession] = useState<TrainingSession | null>(null);
  const [attendance, setAttendance] = useState<TrainingAttendance[]>([]);

  // Form state
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<TrainingType>('regular');
  const [formDate, setFormDate] = useState('');
  const [formStartTime, setFormStartTime] = useState('19:00');
  const [formEndTime, setFormEndTime] = useState('20:30');
  const [formLocation, setFormLocation] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    setSessions(getDemoTrainingSessions(club.id));
  }, [club.id]);

  useEffect(() => {
    if (selectedSession) {
      setAttendance(getDemoTrainingAttendance(selectedSession.id));
    }
  }, [selectedSession]);

  const handleCreateSession = () => {
    if (!formTitle || !formDate || !formLocation) return;

    const session = saveDemoTrainingSession({
      club_id: club.id,
      title: formTitle,
      type: formType,
      date: formDate,
      start_time: formStartTime,
      end_time: formEndTime,
      location: formLocation,
      notes: formNotes || undefined,
    });

    setSessions([...sessions, session].sort((a, b) =>
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ));

    // Reset form
    setFormTitle('');
    setFormDate('');
    setFormLocation('');
    setFormNotes('');
    setShowForm(false);
  };

  const handleDeleteSession = (sessionId: string) => {
    deleteDemoTrainingSession(sessionId);
    setSessions(sessions.filter(s => s.id !== sessionId));
    if (selectedSession?.id === sessionId) {
      setSelectedSession(null);
    }
  };

  const handleSetAttendance = (playerId: string, status: TrainingAttendance['status']) => {
    if (!selectedSession) return;
    const updated = setDemoTrainingAttendance(selectedSession.id, playerId, status);
    setAttendance(prev => {
      const existing = prev.findIndex(a => a.player_id === playerId);
      if (existing >= 0) {
        const newList = [...prev];
        newList[existing] = updated;
        return newList;
      }
      return [...prev, updated];
    });
  };

  const getAttendanceStats = () => {
    const attending = attendance.filter(a => a.status === 'attending').length;
    const notAttending = attendance.filter(a => a.status === 'not_attending').length;
    const maybe = attendance.filter(a => a.status === 'maybe').length;
    return { attending, notAttending, maybe };
  };

  const upcomingSessions = sessions.filter(s => new Date(s.date) >= new Date());
  const pastSessions = sessions.filter(s => new Date(s.date) < new Date()).reverse();

  const typeColors: Record<TrainingType, string> = {
    regular: 'bg-green-500/20 text-green-400 border-green-500/30',
    match_prep: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    recovery: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    tactical: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    fitness: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <div className="space-y-6">
      {/* Add Session Button */}
      {!showForm && !selectedSession && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-green-500/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Training Session
        </button>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Calendar size={16} className="text-green-400" />
            New Training Session
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Title</label>
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g., Thursday Training"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as TrainingType)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              >
                <option value="regular">Regular Training</option>
                <option value="match_prep">Match Preparation</option>
                <option value="tactical">Tactical Session</option>
                <option value="fitness">Fitness</option>
                <option value="recovery">Recovery</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Start</label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">End</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Location</label>
              <input
                type="text"
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="e.g., Main pitch"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 bg-slate-700 text-white rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateSession}
              disabled={!formTitle || !formDate || !formLocation}
              className="flex-1 py-2 bg-green-500 text-black font-bold rounded-lg text-sm disabled:opacity-50"
            >
              Create Session
            </button>
          </div>
        </div>
      )}

      {/* Session Detail View */}
      {selectedSession && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">{selectedSession.title}</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-slate-400">
                  {new Date(selectedSession.date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span className="text-sm text-slate-500">
                  {selectedSession.start_time} - {selectedSession.end_time}
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedSession(null)}
              className="text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Attendance Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-400">{getAttendanceStats().attending}</p>
              <p className="text-[10px] text-slate-500 uppercase">Attending</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-400">{getAttendanceStats().notAttending}</p>
              <p className="text-[10px] text-slate-500 uppercase">Not Attending</p>
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{getAttendanceStats().maybe}</p>
              <p className="text-[10px] text-slate-500 uppercase">Maybe</p>
            </div>
          </div>

          {/* Player List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {club.players.map((player) => {
              const playerAttendance = attendance.find(a => a.player_id === player.id);
              const status = playerAttendance?.status || 'no_response';

              return (
                <div key={player.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 w-6">#{player.number}</span>
                    <span className="text-sm text-white">{player.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleSetAttendance(player.id, 'attending')}
                      className={`p-2 rounded-lg transition-colors ${
                        status === 'attending'
                          ? 'bg-green-500 text-black'
                          : 'bg-slate-700 text-slate-400 hover:bg-green-500/20 hover:text-green-400'
                      }`}
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => handleSetAttendance(player.id, 'not_attending')}
                      className={`p-2 rounded-lg transition-colors ${
                        status === 'not_attending'
                          ? 'bg-red-500 text-white'
                          : 'bg-slate-700 text-slate-400 hover:bg-red-500/20 hover:text-red-400'
                      }`}
                    >
                      <X size={14} />
                    </button>
                    <button
                      onClick={() => handleSetAttendance(player.id, 'maybe')}
                      className={`p-2 rounded-lg transition-colors ${
                        status === 'maybe'
                          ? 'bg-amber-500 text-black'
                          : 'bg-slate-700 text-slate-400 hover:bg-amber-500/20 hover:text-amber-400'
                      }`}
                    >
                      ?
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sessions List */}
      {!showForm && !selectedSession && (
        <div className="space-y-4">
          {upcomingSessions.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-slate-400 uppercase">Upcoming Sessions</h3>
              <div className="space-y-2">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="bg-slate-800/30 border border-white/5 rounded-lg p-4 cursor-pointer hover:border-green-500/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-center min-w-[50px]">
                          <p className="text-xs text-slate-500 uppercase">
                            {new Date(session.date).toLocaleDateString('en-GB', { weekday: 'short' })}
                          </p>
                          <p className="text-lg font-bold text-white">
                            {new Date(session.date).getDate()}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{session.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">{session.start_time}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] border ${typeColors[session.type]}`}>
                              {session.type.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteSession(session.id); }}
                          className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                        <ChevronRight size={16} className="text-slate-500" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {upcomingSessions.length === 0 && pastSessions.length === 0 && (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
              <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No training sessions scheduled</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Expenses Section
// ============================================================================

const ExpensesSection: React.FC<{ club: Club }> = ({ club }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpenses: 0, balance: 0, byCategory: {} as Record<ExpenseCategory, number> });
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formType, setFormType] = useState<'income' | 'expense'>('expense');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('match_fees');
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    setExpenses(getDemoExpenses(club.id));
    setSummary(getDemoExpensesSummary(club.id));
  }, [club.id]);

  const handleAddExpense = () => {
    if (!formAmount || !formDescription) return;

    const expense = saveDemoExpense({
      club_id: club.id,
      type: formType,
      category: formCategory,
      amount: parseFloat(formAmount),
      description: formDescription,
      date: formDate,
    });

    setExpenses([expense, ...expenses]);
    setSummary(getDemoExpensesSummary(club.id));

    // Reset form
    setFormAmount('');
    setFormDescription('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    deleteDemoExpense(id);
    setExpenses(expenses.filter(e => e.id !== id));
    setSummary(getDemoExpensesSummary(club.id));
  };

  const categoryLabels: Record<ExpenseCategory, string> = {
    match_fees: 'Match Fees',
    equipment: 'Equipment',
    travel: 'Travel',
    facilities: 'Facilities',
    medical: 'Medical',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase">Total Income</p>
          <p className="text-2xl font-bold text-green-400">£{summary.totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase">Total Expenses</p>
          <p className="text-2xl font-bold text-red-400">£{summary.totalExpenses.toLocaleString()}</p>
        </div>
        <div className={`${summary.balance >= 0 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} border rounded-xl p-4`}>
          <p className="text-[10px] text-slate-500 uppercase">Balance</p>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {summary.balance >= 0 ? '+' : ''}£{summary.balance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-amber-500/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      )}

      {/* Add Form */}
      {showForm && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <DollarSign size={16} className="text-amber-400" />
            New Transaction
          </h3>

          {/* Type Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setFormType('income')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                formType === 'income'
                  ? 'bg-green-500 text-black'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              <TrendingUp size={14} className="inline mr-1" /> Income
            </button>
            <button
              onClick={() => setFormType('expense')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                formType === 'expense'
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              <TrendingDown size={14} className="inline mr-1" /> Expense
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Amount (£)</label>
              <input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Category</label>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              >
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Description</label>
              <input
                type="text"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="e.g., Pitch hire for match"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Date</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowForm(false)}
              className="flex-1 py-2 bg-slate-700 text-white rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleAddExpense}
              disabled={!formAmount || !formDescription}
              className="flex-1 py-2 bg-amber-500 text-black font-bold rounded-lg text-sm disabled:opacity-50"
            >
              Add Transaction
            </button>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-slate-400 uppercase">Recent Transactions</h3>
        {expenses.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
            <DollarSign className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No transactions recorded</p>
          </div>
        ) : (
          expenses.slice(0, 20).map((expense) => (
            <div key={expense.id} className="bg-slate-800/30 border border-white/5 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${expense.type === 'income' ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                  {expense.type === 'income' ? (
                    <TrendingUp size={14} className="text-green-400" />
                  ) : (
                    <TrendingDown size={14} className="text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-white">{expense.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-500">
                      {new Date(expense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-slate-700 px-1.5 py-0.5 rounded">
                      {categoryLabels[expense.category]}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${expense.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                  {expense.type === 'income' ? '+' : '-'}£{expense.amount.toLocaleString()}
                </span>
                <button
                  onClick={() => handleDelete(expense.id)}
                  className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Scouting Section (Opposition Notes)
// ============================================================================

const ScoutingSection: React.FC<{ club: Club; fixtures: Fixture[] }> = ({ club, fixtures }) => {
  const [notes, setNotes] = useState<OppositionNote[]>([]);
  const [selectedNote, setSelectedNote] = useState<OppositionNote | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState('');

  // Form state
  const [formOpponent, setFormOpponent] = useState('');
  const [formFormation, setFormFormation] = useState('');
  const [formKeyPlayers, setFormKeyPlayers] = useState('');
  const [formStrengths, setFormStrengths] = useState('');
  const [formWeaknesses, setFormWeaknesses] = useState('');
  const [formTactics, setFormTactics] = useState('');
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    setNotes(getDemoOppositionNotes(club.id));
  }, [club.id]);

  const upcomingOpponents = fixtures
    .filter(f => f.status === 'SCHEDULED')
    .map(f => f.opponent)
    .filter((v, i, a) => a.indexOf(v) === i); // unique

  const handleSaveNote = () => {
    if (!formOpponent) return;

    const note = saveDemoOppositionNote({
      club_id: club.id,
      opponent_name: formOpponent,
      formation: formFormation || undefined,
      key_players: formKeyPlayers || undefined,
      strengths: formStrengths || undefined,
      weaknesses: formWeaknesses || undefined,
      tactics: formTactics || undefined,
      notes: formNotes || undefined,
    });

    setNotes(prev => {
      const existing = prev.findIndex(n => n.id === note.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = note;
        return updated;
      }
      return [note, ...prev];
    });

    // Reset
    setFormOpponent('');
    setFormFormation('');
    setFormKeyPlayers('');
    setFormStrengths('');
    setFormWeaknesses('');
    setFormTactics('');
    setFormNotes('');
    setShowForm(false);
  };

  const handleSelectOpponent = (opponent: string) => {
    const existingNote = getDemoOppositionNoteByOpponent(club.id, opponent);
    if (existingNote) {
      setSelectedNote(existingNote);
    } else {
      setFormOpponent(opponent);
      setShowForm(true);
    }
  };

  const handleEditNote = (note: OppositionNote) => {
    setFormOpponent(note.opponent_name);
    setFormFormation(note.formation || '');
    setFormKeyPlayers(note.key_players || '');
    setFormStrengths(note.strengths || '');
    setFormWeaknesses(note.weaknesses || '');
    setFormTactics(note.tactics || '');
    setFormNotes(note.notes || '');
    setSelectedNote(null);
    setShowForm(true);
  };

  const handleDeleteNote = (noteId: string) => {
    deleteDemoOppositionNote(noteId);
    setNotes(notes.filter(n => n.id !== noteId));
    setSelectedNote(null);
  };

  return (
    <div className="space-y-6">
      {/* Quick Access - Upcoming Opponents */}
      {upcomingOpponents.length > 0 && !showForm && !selectedNote && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
          <h3 className="text-sm font-bold text-white mb-3">Upcoming Opponents</h3>
          <div className="flex flex-wrap gap-2">
            {upcomingOpponents.map((opponent) => {
              const hasNotes = notes.some(n => n.opponent_name.toLowerCase() === opponent.toLowerCase());
              return (
                <button
                  key={opponent}
                  onClick={() => handleSelectOpponent(opponent)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    hasNotes
                      ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
                      : 'bg-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <Target size={14} />
                  {opponent}
                  {hasNotes && <Check size={12} />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showForm && !selectedNote && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-slate-400 hover:text-white hover:border-purple-500/50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add Scouting Notes
        </button>
      )}

      {/* Edit Form */}
      {showForm && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target size={16} className="text-purple-400" />
            Opposition Notes
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Opponent Name</label>
              <input
                type="text"
                value={formOpponent}
                onChange={(e) => setFormOpponent(e.target.value)}
                placeholder="e.g., City FC"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Formation</label>
              <input
                type="text"
                value={formFormation}
                onChange={(e) => setFormFormation(e.target.value)}
                placeholder="e.g., 4-3-3"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Key Players to Watch</label>
              <textarea
                value={formKeyPlayers}
                onChange={(e) => setFormKeyPlayers(e.target.value)}
                placeholder="e.g., #9 - Fast striker, #7 - Dangerous on set pieces"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none h-16"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Strengths</label>
              <textarea
                value={formStrengths}
                onChange={(e) => setFormStrengths(e.target.value)}
                placeholder="What they're good at..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none h-16"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Weaknesses</label>
              <textarea
                value={formWeaknesses}
                onChange={(e) => setFormWeaknesses(e.target.value)}
                placeholder="Where to exploit..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none h-16"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-mono text-slate-500 uppercase block mb-1">Additional Notes</label>
              <textarea
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Any other observations..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none resize-none h-16"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setFormOpponent(''); }}
              className="flex-1 py-2 bg-slate-700 text-white rounded-lg text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNote}
              disabled={!formOpponent}
              className="flex-1 py-2 bg-purple-500 text-white font-bold rounded-lg text-sm disabled:opacity-50"
            >
              Save Notes
            </button>
          </div>
        </div>
      )}

      {/* Note Detail View */}
      {selectedNote && (
        <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield size={18} className="text-purple-400" />
                {selectedNote.opponent_name}
              </h3>
              {selectedNote.formation && (
                <p className="text-sm text-slate-400 mt-1">Formation: {selectedNote.formation}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedNote(null)}
              className="text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedNote.key_players && (
              <div className="bg-black/20 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Key Players</p>
                <p className="text-sm text-white whitespace-pre-wrap">{selectedNote.key_players}</p>
              </div>
            )}
            {selectedNote.strengths && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                <p className="text-[10px] text-green-400 uppercase mb-1">Strengths</p>
                <p className="text-sm text-white whitespace-pre-wrap">{selectedNote.strengths}</p>
              </div>
            )}
            {selectedNote.weaknesses && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-[10px] text-red-400 uppercase mb-1">Weaknesses</p>
                <p className="text-sm text-white whitespace-pre-wrap">{selectedNote.weaknesses}</p>
              </div>
            )}
            {selectedNote.notes && (
              <div className="md:col-span-2 bg-black/20 rounded-lg p-3">
                <p className="text-[10px] text-slate-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-white whitespace-pre-wrap">{selectedNote.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => handleEditNote(selectedNote)}
              className="flex-1 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm"
            >
              Edit Notes
            </button>
            <button
              onClick={() => handleDeleteNote(selectedNote.id)}
              className="py-2 px-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}

      {/* All Notes List */}
      {!showForm && !selectedNote && notes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-slate-400 uppercase">All Scouting Notes</h3>
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => setSelectedNote(note)}
              className="bg-slate-800/30 border border-white/5 rounded-lg p-4 cursor-pointer hover:border-purple-500/30 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Target size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{note.opponent_name}</p>
                  <p className="text-[10px] text-slate-500">
                    {note.formation && `${note.formation} • `}
                    Updated {new Date(note.updated_at || note.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-500" />
            </div>
          ))}
        </div>
      )}

      {!showForm && !selectedNote && notes.length === 0 && upcomingOpponents.length === 0 && (
        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
          <Target className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No scouting notes yet</p>
        </div>
      )}
    </div>
  );
};

export default OperationsHub;
