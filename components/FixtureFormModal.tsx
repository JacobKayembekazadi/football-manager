/**
 * FixtureFormModal
 * 
 * Modal for creating and editing fixtures.
 * Used by FixturesView for Add/Edit operations.
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Trophy, Clock, Loader2 } from 'lucide-react';
import { Fixture } from '../types';

interface FixtureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fixture: Omit<Fixture, 'id'>) => Promise<void>;
  editingFixture?: Fixture | null;
}

const FixtureFormModal: React.FC<FixtureFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingFixture,
}) => {
  const [opponent, setOpponent] = useState('');
  const [kickoffDate, setKickoffDate] = useState('');
  const [kickoffTime, setKickoffTime] = useState('15:00');
  const [venue, setVenue] = useState<'Home' | 'Away'>('Home');
  const [competition, setCompetition] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Populate form when editing
  useEffect(() => {
    if (editingFixture) {
      setOpponent(editingFixture.opponent);
      const date = new Date(editingFixture.kickoff_time);
      setKickoffDate(date.toISOString().split('T')[0]);
      setKickoffTime(date.toTimeString().slice(0, 5));
      setVenue(editingFixture.venue as 'Home' | 'Away');
      setCompetition(editingFixture.competition || '');
    } else {
      resetForm();
    }
  }, [editingFixture, isOpen]);

  const resetForm = () => {
    setOpponent('');
    setKickoffDate('');
    setKickoffTime('15:00');
    setVenue('Home');
    setCompetition('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!opponent.trim()) {
      setError('Opponent name is required');
      return;
    }
    if (!kickoffDate) {
      setError('Kickoff date is required');
      return;
    }

    setIsSaving(true);
    try {
      const kickoff_time = new Date(`${kickoffDate}T${kickoffTime}`).toISOString();
      
      await onSave({
        opponent: opponent.trim(),
        kickoff_time,
        venue,
        competition: competition.trim() || undefined,
        status: 'SCHEDULED',
        result_home: undefined,
        result_away: undefined,
        key_events: undefined,
        scorers: [],
        man_of_the_match: undefined,
        stats: undefined,
        attendance: undefined,
      });

      resetForm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fixture');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,243,255,0.1)] overflow-hidden animate-fade-in">
        {/* Header gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <h2 className="text-xl font-display font-bold text-white uppercase tracking-wider mb-6">
            {editingFixture ? 'Edit Fixture' : 'Schedule New Fixture'}
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Opponent */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Opponent *
              </label>
              <div className="relative">
                <Trophy size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={opponent}
                  onChange={(e) => setOpponent(e.target.value)}
                  placeholder="e.g., Manchester United"
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:border-neon-blue/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Date *
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={kickoffDate}
                    onChange={(e) => setKickoffDate(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-neon-blue/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Kickoff Time
                </label>
                <div className="relative">
                  <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="time"
                    value={kickoffTime}
                    onChange={(e) => setKickoffTime(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-neon-blue/50 focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Venue */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Venue
              </label>
              <div className="flex gap-3">
                {(['Home', 'Away'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVenue(v)}
                    className={`flex-1 py-3 px-4 rounded-lg font-display font-bold uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 ${
                      venue === v
                        ? 'bg-neon-blue text-black'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <MapPin size={16} />
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Competition */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Competition (Optional)
              </label>
              <input
                type="text"
                value={competition}
                onChange={(e) => setCompetition(e.target.value)}
                placeholder="e.g., Premier League, FA Cup"
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:border-neon-blue/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-lg transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 px-4 bg-neon-blue text-black rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,243,255,0.35)] transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : editingFixture ? (
                'Update Fixture'
              ) : (
                'Schedule Fixture'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FixtureFormModal;



