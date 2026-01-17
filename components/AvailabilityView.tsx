/**
 * AvailabilityView Component
 *
 * Displays player availability tracking for a selected fixture.
 * Admin can mark players as available/unavailable/maybe/injured.
 */

import React, { useState, useEffect } from 'react';
import {
  Check,
  X,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Users,
  ChevronDown,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import { Player, Fixture, Club, AvailabilityStatus, PlayerAvailability } from '../types';
import {
  getAvailabilityForFixture,
  setPlayerAvailability,
  initializeAvailability,
} from '../services/availabilityService';

interface AvailabilityViewProps {
  club: Club;
  fixtures: Fixture[];
}

const statusConfig: Record<
  AvailabilityStatus,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  available: {
    label: 'Available',
    color: 'text-green-500',
    bg: 'bg-green-500/20 border-green-500/40',
    icon: <Check size={16} />,
  },
  unavailable: {
    label: 'Unavailable',
    color: 'text-red-500',
    bg: 'bg-red-500/20 border-red-500/40',
    icon: <X size={16} />,
  },
  maybe: {
    label: 'Maybe',
    color: 'text-amber-500',
    bg: 'bg-amber-500/20 border-amber-500/40',
    icon: <HelpCircle size={16} />,
  },
  injured: {
    label: 'Injured',
    color: 'text-purple-500',
    bg: 'bg-purple-500/20 border-purple-500/40',
    icon: <AlertTriangle size={16} />,
  },
  no_response: {
    label: 'No Response',
    color: 'text-slate-500',
    bg: 'bg-slate-500/20 border-slate-500/40',
    icon: <MessageSquare size={16} />,
  },
};

const AvailabilityView: React.FC<AvailabilityViewProps> = ({
  club,
  fixtures,
}) => {
  const players = club.players;
  const clubId = club.id;
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');
  const [availability, setAvailability] = useState<PlayerAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingPlayerId, setUpdatingPlayerId] = useState<string | null>(null);
  const [showFixtureDropdown, setShowFixtureDropdown] = useState(false);
  const [notePlayerId, setNotePlayerId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Filter to upcoming fixtures only
  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED');

  // Set default fixture to the next upcoming one
  useEffect(() => {
    if (upcomingFixtures.length > 0 && !selectedFixtureId) {
      setSelectedFixtureId(upcomingFixtures[0].id);
    }
  }, [upcomingFixtures]);

  // Load availability when fixture changes
  useEffect(() => {
    if (selectedFixtureId) {
      loadAvailability();
    }
  }, [selectedFixtureId]);

  const loadAvailability = async () => {
    if (!selectedFixtureId) return;

    setLoading(true);
    try {
      // Initialize availability for all players first
      await initializeAvailability(
        clubId,
        selectedFixtureId,
        players.map(p => p.id)
      );

      const data = await getAvailabilityForFixture(selectedFixtureId);
      setAvailability(data);
    } catch (error) {
      console.error('Error loading availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetStatus = async (
    playerId: string,
    status: AvailabilityStatus,
    note?: string
  ) => {
    setUpdatingPlayerId(playerId);
    try {
      const updated = await setPlayerAvailability(
        clubId,
        selectedFixtureId,
        playerId,
        status,
        note
      );

      setAvailability(prev => {
        const existing = prev.find(a => a.player_id === playerId);
        if (existing) {
          return prev.map(a => (a.player_id === playerId ? updated : a));
        }
        return [...prev, updated];
      });

      if (notePlayerId === playerId) {
        setNotePlayerId(null);
        setNoteText('');
      }
    } catch (error) {
      console.error('Error setting availability:', error);
    } finally {
      setUpdatingPlayerId(null);
    }
  };

  const selectedFixture = fixtures.find(f => f.id === selectedFixtureId);

  // Calculate summary
  const summary = {
    available: availability.filter(a => a.status === 'available').length,
    unavailable: availability.filter(a => a.status === 'unavailable').length,
    maybe: availability.filter(a => a.status === 'maybe').length,
    injured: availability.filter(a => a.status === 'injured').length,
    no_response: availability.filter(a => a.status === 'no_response').length,
  };

  // Group players by position
  const playersByPosition = {
    GK: players.filter(p => p.position === 'GK'),
    DEF: players.filter(p => p.position === 'DEF'),
    MID: players.filter(p => p.position === 'MID'),
    FWD: players.filter(p => p.position === 'FWD'),
  };

  const getPlayerAvailability = (playerId: string): AvailabilityStatus => {
    const record = availability.find(a => a.player_id === playerId);
    return record?.status || 'no_response';
  };

  const getPlayerNote = (playerId: string): string | undefined => {
    return availability.find(a => a.player_id === playerId)?.response_note;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Availability</h2>
          <p className="text-slate-400 text-sm mt-1">
            Track player availability for upcoming fixtures
          </p>
        </div>

        {/* Fixture Selector */}
        {upcomingFixtures.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowFixtureDropdown(!showFixtureDropdown)}
              className="flex items-center gap-3 px-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg hover:border-white/20 transition-colors min-w-[250px]"
            >
              <div className="flex-1 text-left">
                <p className="text-xs text-slate-500">Fixture</p>
                <p className="text-sm text-white font-medium">
                  {selectedFixture
                    ? `vs ${selectedFixture.opponent}`
                    : 'Select fixture'}
                </p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {showFixtureDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowFixtureDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-full bg-slate-800 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                  {upcomingFixtures.map(f => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedFixtureId(f.id);
                        setShowFixtureDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-white/5 transition-colors ${
                        f.id === selectedFixtureId ? 'bg-green-500/10' : ''
                      }`}
                    >
                      <p className="text-sm text-white font-medium">
                        vs {f.opponent}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(f.kickoff_time).toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        • {f.venue}
                      </p>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {upcomingFixtures.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No upcoming fixtures to track availability</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-5 gap-3">
            {(Object.keys(statusConfig) as AvailabilityStatus[]).map(status => (
              <div
                key={status}
                className={`p-3 rounded-lg border ${statusConfig[status].bg}`}
              >
                <div className={`text-2xl font-bold ${statusConfig[status].color}`}>
                  {summary[status]}
                </div>
                <div className="text-xs text-slate-400">
                  {statusConfig[status].label}
                </div>
              </div>
            ))}
          </div>

          {/* Refresh Button */}
          <div className="flex justify-end">
            <button
              onClick={loadAvailability}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          {/* Player List by Position */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="space-y-6">
              {(
                Object.entries(playersByPosition) as [
                  string,
                  Player[],
                ][]
              ).map(
                ([position, positionPlayers]) =>
                  positionPlayers.length > 0 && (
                    <div key={position}>
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                        {position === 'GK'
                          ? 'Goalkeepers'
                          : position === 'DEF'
                          ? 'Defenders'
                          : position === 'MID'
                          ? 'Midfielders'
                          : 'Forwards'}
                      </h3>
                      <div className="space-y-2">
                        {positionPlayers.map(player => {
                          const status = getPlayerAvailability(player.id);
                          const note = getPlayerNote(player.id);
                          const isUpdating = updatingPlayerId === player.id;

                          return (
                            <div
                              key={player.id}
                              className="bg-slate-800/50 border border-white/10 rounded-lg p-4"
                            >
                              <div className="flex items-center gap-4">
                                {/* Player Info */}
                                <div className="flex-1 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                                    {player.number}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">
                                      {player.name}
                                      {player.is_captain && (
                                        <span className="ml-2 text-xs text-amber-500">
                                          (C)
                                        </span>
                                      )}
                                    </p>
                                    {note && (
                                      <p className="text-xs text-slate-400 italic">
                                        "{note}"
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {/* Status Buttons */}
                                <div className="flex items-center gap-2">
                                  {isUpdating ? (
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                  ) : (
                                    <>
                                      {(
                                        [
                                          'available',
                                          'unavailable',
                                          'maybe',
                                          'injured',
                                        ] as AvailabilityStatus[]
                                      ).map(s => (
                                        <button
                                          key={s}
                                          onClick={() =>
                                            handleSetStatus(player.id, s)
                                          }
                                          className={`p-2 rounded-lg border transition-all ${
                                            status === s
                                              ? statusConfig[s].bg
                                              : 'border-white/10 hover:border-white/20'
                                          } ${statusConfig[s].color}`}
                                          title={statusConfig[s].label}
                                        >
                                          {statusConfig[s].icon}
                                        </button>
                                      ))}
                                      <button
                                        onClick={() => {
                                          setNotePlayerId(
                                            notePlayerId === player.id
                                              ? null
                                              : player.id
                                          );
                                          setNoteText(note || '');
                                        }}
                                        className={`p-2 rounded-lg border transition-all ${
                                          notePlayerId === player.id
                                            ? 'border-blue-500/40 bg-blue-500/20 text-blue-400'
                                            : 'border-white/10 hover:border-white/20 text-slate-400'
                                        }`}
                                        title="Add note"
                                      >
                                        <MessageSquare size={16} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Note Input */}
                              {notePlayerId === player.id && (
                                <div className="mt-3 flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={noteText}
                                    onChange={e => setNoteText(e.target.value)}
                                    placeholder="Add a note (e.g., 'Working late')"
                                    className="flex-1 bg-slate-700/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() =>
                                      handleSetStatus(player.id, status, noteText)
                                    }
                                    className="px-3 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-400 transition-colors"
                                  >
                                    Save
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AvailabilityView;
