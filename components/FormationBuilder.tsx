/**
 * Formation Builder Component
 *
 * Visual team selector for creating match lineups with drag-and-drop
 * or click-to-assign player positioning.
 */

import React, { useState, useEffect } from 'react';
import {
  Users,
  Save,
  RotateCcw,
  Copy,
  ChevronDown,
  X,
  Check,
  Shirt,
  AlertCircle,
} from 'lucide-react';
import { Club, Player, Fixture, AvailabilityStatus } from '../types';
import { getAvailabilityForFixture } from '../services/availabilityService';

// Common formations with position coordinates (percentage-based)
const FORMATIONS: Record<string, { name: string; positions: { x: number; y: number; role: string }[] }> = {
  '4-4-2': {
    name: '4-4-2',
    positions: [
      { x: 50, y: 90, role: 'GK' },
      { x: 20, y: 70, role: 'LB' },
      { x: 40, y: 72, role: 'CB' },
      { x: 60, y: 72, role: 'CB' },
      { x: 80, y: 70, role: 'RB' },
      { x: 20, y: 45, role: 'LM' },
      { x: 40, y: 48, role: 'CM' },
      { x: 60, y: 48, role: 'CM' },
      { x: 80, y: 45, role: 'RM' },
      { x: 35, y: 22, role: 'ST' },
      { x: 65, y: 22, role: 'ST' },
    ],
  },
  '4-3-3': {
    name: '4-3-3',
    positions: [
      { x: 50, y: 90, role: 'GK' },
      { x: 20, y: 70, role: 'LB' },
      { x: 40, y: 72, role: 'CB' },
      { x: 60, y: 72, role: 'CB' },
      { x: 80, y: 70, role: 'RB' },
      { x: 30, y: 48, role: 'CM' },
      { x: 50, y: 45, role: 'CDM' },
      { x: 70, y: 48, role: 'CM' },
      { x: 20, y: 22, role: 'LW' },
      { x: 50, y: 18, role: 'ST' },
      { x: 80, y: 22, role: 'RW' },
    ],
  },
  '3-5-2': {
    name: '3-5-2',
    positions: [
      { x: 50, y: 90, role: 'GK' },
      { x: 25, y: 72, role: 'CB' },
      { x: 50, y: 74, role: 'CB' },
      { x: 75, y: 72, role: 'CB' },
      { x: 15, y: 48, role: 'LWB' },
      { x: 35, y: 52, role: 'CM' },
      { x: 50, y: 48, role: 'CDM' },
      { x: 65, y: 52, role: 'CM' },
      { x: 85, y: 48, role: 'RWB' },
      { x: 35, y: 22, role: 'ST' },
      { x: 65, y: 22, role: 'ST' },
    ],
  },
  '4-2-3-1': {
    name: '4-2-3-1',
    positions: [
      { x: 50, y: 90, role: 'GK' },
      { x: 20, y: 70, role: 'LB' },
      { x: 40, y: 72, role: 'CB' },
      { x: 60, y: 72, role: 'CB' },
      { x: 80, y: 70, role: 'RB' },
      { x: 35, y: 55, role: 'CDM' },
      { x: 65, y: 55, role: 'CDM' },
      { x: 20, y: 35, role: 'LW' },
      { x: 50, y: 32, role: 'CAM' },
      { x: 80, y: 35, role: 'RW' },
      { x: 50, y: 15, role: 'ST' },
    ],
  },
  '5-3-2': {
    name: '5-3-2',
    positions: [
      { x: 50, y: 90, role: 'GK' },
      { x: 15, y: 68, role: 'LWB' },
      { x: 30, y: 72, role: 'CB' },
      { x: 50, y: 74, role: 'CB' },
      { x: 70, y: 72, role: 'CB' },
      { x: 85, y: 68, role: 'RWB' },
      { x: 30, y: 48, role: 'CM' },
      { x: 50, y: 45, role: 'CM' },
      { x: 70, y: 48, role: 'CM' },
      { x: 35, y: 22, role: 'ST' },
      { x: 65, y: 22, role: 'ST' },
    ],
  },
};

interface LineupPlayer {
  positionIndex: number;
  playerId: string | null;
}

interface SavedFormation {
  id: string;
  name: string;
  formation: string;
  lineup: LineupPlayer[];
  fixtureId?: string;
  createdAt: string;
}

interface FormationBuilderProps {
  club: Club;
  fixtures: Fixture[];
  onSave?: (formation: SavedFormation) => void;
}

const STORAGE_KEY = 'pitchside_demo_formations';

const FormationBuilder: React.FC<FormationBuilderProps> = ({ club, fixtures, onSave }) => {
  const [selectedFormation, setSelectedFormation] = useState('4-3-3');
  const [lineup, setLineup] = useState<LineupPlayer[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<string>('');
  const [availability, setAvailability] = useState<Record<string, AvailabilityStatus>>({});
  const [savedFormations, setSavedFormations] = useState<SavedFormation[]>([]);
  const [formationName, setFormationName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showFormationDropdown, setShowFormationDropdown] = useState(false);

  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED');
  const formation = FORMATIONS[selectedFormation];

  // Initialize lineup when formation changes
  useEffect(() => {
    setLineup(formation.positions.map((_, idx) => ({ positionIndex: idx, playerId: null })));
    setSelectedPosition(null);
  }, [selectedFormation]);

  // Load saved formations
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSavedFormations(JSON.parse(saved));
      }
    } catch {
      // Ignore
    }
  }, []);

  // Load availability when fixture changes
  useEffect(() => {
    if (!selectedFixture) {
      setAvailability({});
      return;
    }

    const loadAvailability = async () => {
      try {
        const data = await getAvailabilityForFixture(selectedFixture);
        const map: Record<string, AvailabilityStatus> = {};
        data.forEach(a => {
          map[a.player_id] = a.status;
        });
        setAvailability(map);
      } catch (error) {
        console.error('Error loading availability:', error);
      }
    };

    loadAvailability();
  }, [selectedFixture]);

  const getPlayerById = (id: string) => club.players.find(p => p.id === id);

  const getPositionType = (role: string): 'GK' | 'DEF' | 'MID' | 'FWD' => {
    if (role === 'GK') return 'GK';
    if (['LB', 'RB', 'CB', 'LWB', 'RWB'].includes(role)) return 'DEF';
    if (['ST', 'LW', 'RW', 'CF'].includes(role)) return 'FWD';
    return 'MID';
  };

  const getAvailablePlayers = (role: string) => {
    const positionType = getPositionType(role);
    const assignedIds = new Set(lineup.filter(l => l.playerId).map(l => l.playerId));

    return club.players.filter(p => {
      // Already assigned
      if (assignedIds.has(p.id)) return false;

      // Check availability if fixture selected
      if (selectedFixture && availability[p.id]) {
        const status = availability[p.id];
        if (status === 'unavailable' || status === 'injured') return false;
      }

      // Match position (flexible - allow any for now, but sort by match)
      return true;
    }).sort((a, b) => {
      // Sort by position match
      const aMatch = a.position === positionType ? 0 : 1;
      const bMatch = b.position === positionType ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;

      // Then by form
      return b.form - a.form;
    });
  };

  const assignPlayer = (positionIndex: number, playerId: string) => {
    setLineup(prev =>
      prev.map(l =>
        l.positionIndex === positionIndex ? { ...l, playerId } : l
      )
    );
    setSelectedPosition(null);
  };

  const removePlayer = (positionIndex: number) => {
    setLineup(prev =>
      prev.map(l =>
        l.positionIndex === positionIndex ? { ...l, playerId: null } : l
      )
    );
  };

  const clearLineup = () => {
    setLineup(formation.positions.map((_, idx) => ({ positionIndex: idx, playerId: null })));
    setSelectedPosition(null);
  };

  const saveFormation = () => {
    if (!formationName.trim()) return;

    const newFormation: SavedFormation = {
      id: `formation-${Date.now()}`,
      name: formationName,
      formation: selectedFormation,
      lineup,
      fixtureId: selectedFixture || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [...savedFormations, newFormation];
    setSavedFormations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    setShowSaveModal(false);
    setFormationName('');

    if (onSave) onSave(newFormation);
  };

  const loadFormation = (saved: SavedFormation) => {
    setSelectedFormation(saved.formation);
    // Wait for formation change to take effect
    setTimeout(() => {
      setLineup(saved.lineup);
      if (saved.fixtureId) {
        setSelectedFixture(saved.fixtureId);
      }
    }, 50);
  };

  const deleteFormation = (id: string) => {
    const updated = savedFormations.filter(f => f.id !== id);
    setSavedFormations(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const getAvailabilityColor = (playerId: string) => {
    const status = availability[playerId];
    if (!status || status === 'no_response') return '';
    if (status === 'available') return 'ring-2 ring-green-500';
    if (status === 'maybe') return 'ring-2 ring-amber-500';
    return 'ring-2 ring-red-500';
  };

  const assignedCount = lineup.filter(l => l.playerId).length;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Shirt className="text-green-500" size={24} />
            Formation Builder
          </h2>
          <p className="text-sm text-slate-400">
            {assignedCount}/11 positions filled
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Formation Selector */}
          <div className="relative">
            <button
              onClick={() => setShowFormationDropdown(!showFormationDropdown)}
              className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm font-medium text-white hover:border-green-500/50 transition-colors flex items-center gap-2"
            >
              {selectedFormation}
              <ChevronDown size={14} />
            </button>
            {showFormationDropdown && (
              <div className="absolute top-full mt-2 right-0 w-32 bg-slate-800 border border-white/10 rounded-lg shadow-xl z-20">
                {Object.keys(FORMATIONS).map(key => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedFormation(key);
                      setShowFormationDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors ${key === selectedFormation ? 'text-green-500' : 'text-white'}`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={clearLineup}
            className="p-2 bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:border-amber-500/50 transition-colors"
            title="Clear lineup"
          >
            <RotateCcw size={18} />
          </button>

          <button
            onClick={() => setShowSaveModal(true)}
            disabled={assignedCount === 0}
            className="px-4 py-2 bg-green-500 text-black rounded-lg text-sm font-bold hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            Save
          </button>
        </div>
      </div>

      {/* Fixture Selector */}
      {upcomingFixtures.length > 0 && (
        <div className="mb-4 flex-shrink-0">
          <select
            value={selectedFixture}
            onChange={e => setSelectedFixture(e.target.value)}
            className="px-4 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-green-500"
          >
            <option value="">Select fixture (optional)</option>
            {upcomingFixtures.map(f => (
              <option key={f.id} value={f.id}>
                vs {f.opponent} - {new Date(f.kickoff_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </option>
            ))}
          </select>
          {selectedFixture && (
            <p className="text-xs text-slate-500 mt-1">
              Players marked by availability status
            </p>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        {/* Pitch */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-green-900/30 to-green-800/30 rounded-xl border border-green-500/20 overflow-hidden">
            {/* Pitch markings */}
            <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
              {/* Center circle */}
              <circle cx="50%" cy="50%" r="15%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              {/* Center line */}
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              {/* Penalty areas */}
              <rect x="25%" y="0" width="50%" height="18%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <rect x="25%" y="82%" width="50%" height="18%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              {/* Goal boxes */}
              <rect x="35%" y="0" width="30%" height="8%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <rect x="35%" y="92%" width="30%" height="8%" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            </svg>

            {/* Position markers */}
            {formation.positions.map((pos, idx) => {
              const lineupEntry = lineup.find(l => l.positionIndex === idx);
              const player = lineupEntry?.playerId ? getPlayerById(lineupEntry.playerId) : null;
              const isSelected = selectedPosition === idx;

              return (
                <div
                  key={idx}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <button
                    onClick={() => {
                      if (player) {
                        removePlayer(idx);
                      } else {
                        setSelectedPosition(isSelected ? null : idx);
                      }
                    }}
                    className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${player
                        ? `bg-slate-800 border-2 border-green-500 ${getAvailabilityColor(player.id)}`
                        : isSelected
                          ? 'bg-green-500/30 border-2 border-green-500 animate-pulse'
                          : 'bg-slate-800/50 border-2 border-dashed border-white/30 hover:border-green-500/50'
                      }
                    `}
                  >
                    {player ? (
                      <span className="text-sm font-bold text-white">
                        {player.number}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">
                        {pos.role}
                      </span>
                    )}
                  </button>
                  {player && (
                    <p className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 text-[10px] text-white whitespace-nowrap bg-black/50 px-1 rounded">
                      {player.name.split(' ').pop()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Player Selection Panel */}
        <div className="w-64 flex flex-col bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white">
              {selectedPosition !== null
                ? `Select ${formation.positions[selectedPosition].role}`
                : 'Available Players'}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {selectedPosition !== null ? (
              getAvailablePlayers(formation.positions[selectedPosition].role).map(player => (
                <button
                  key={player.id}
                  onClick={() => assignPlayer(selectedPosition, player.id)}
                  className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors text-left"
                >
                  <div className={`w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold ${getAvailabilityColor(player.id)}`}>
                    {player.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{player.name}</p>
                    <p className="text-[10px] text-slate-500">{player.position} - Form: {player.form.toFixed(1)}</p>
                  </div>
                  {player.position === getPositionType(formation.positions[selectedPosition].role) && (
                    <Check size={14} className="text-green-500 flex-shrink-0" />
                  )}
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                <Users size={32} className="mx-auto mb-2 opacity-50" />
                Click a position on the pitch to assign a player
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Formations */}
      {savedFormations.length > 0 && (
        <div className="mt-4 flex-shrink-0">
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Saved Lineups</h4>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {savedFormations.map(saved => (
              <div
                key={saved.id}
                className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg shrink-0"
              >
                <button
                  onClick={() => loadFormation(saved)}
                  className="text-sm text-white hover:text-green-500 transition-colors"
                >
                  {saved.name}
                </button>
                <span className="text-xs text-slate-500">{saved.formation}</span>
                <button
                  onClick={() => deleteFormation(saved.id)}
                  className="text-slate-500 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white mb-4">Save Lineup</h3>
            <input
              type="text"
              value={formationName}
              onChange={e => setFormationName(e.target.value)}
              placeholder="Enter lineup name..."
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-green-500 mb-4"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveFormation}
                disabled={!formationName.trim()}
                className="flex-1 px-4 py-2 bg-green-500 text-black font-bold rounded-lg hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormationBuilder;
