/**
 * FixtureFormModal
 *
 * Modern modal for creating and editing fixtures.
 * Features visual calendar picker, quick date presets, and common kickoff times.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, MapPin, Trophy, Clock, Loader2, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { Fixture } from '../types';

interface FixtureFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (fixture: Omit<Fixture, 'id'>) => Promise<void>;
  editingFixture?: Fixture | null;
}

const COMMON_KICKOFF_TIMES = [
  { label: '12:30', value: '12:30' },
  { label: '15:00', value: '15:00' },
  { label: '17:30', value: '17:30' },
  { label: '19:45', value: '19:45' },
  { label: '20:00', value: '20:00' },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const FixtureFormModal: React.FC<FixtureFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingFixture,
}) => {
  const [opponent, setOpponent] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [kickoffTime, setKickoffTime] = useState('15:00');
  const [venue, setVenue] = useState<'Home' | 'Away'>('Home');
  const [competition, setCompetition] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Populate form when editing
  useEffect(() => {
    if (editingFixture) {
      setOpponent(editingFixture.opponent);
      const date = new Date(editingFixture.kickoff_time);
      setSelectedDate(date);
      setCurrentMonth(date);
      setKickoffTime(date.toTimeString().slice(0, 5));
      setVenue(editingFixture.venue as 'Home' | 'Away');
      setCompetition(editingFixture.competition || '');
    } else {
      resetForm();
    }
  }, [editingFixture, isOpen]);

  const resetForm = () => {
    setOpponent('');
    setSelectedDate(null);
    setKickoffTime('15:00');
    setVenue('Home');
    setCompetition('');
    setError('');
    setCurrentMonth(new Date());
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: (Date | null)[] = [];

    // Add padding for days before the first of the month
    for (let i = 0; i < startPadding; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  // Quick date presets
  const getQuickDates = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find next Saturday
    const nextSaturday = new Date(today);
    const daysUntilSaturday = (6 - today.getDay() + 7) % 7 || 7;
    nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);

    // Find next Sunday
    const nextSunday = new Date(nextSaturday);
    nextSunday.setDate(nextSunday.getDate() + 1);

    // Next week same day
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Two weeks
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);

    return [
      { label: 'Tomorrow', date: tomorrow },
      { label: 'Saturday', date: nextSaturday },
      { label: 'Sunday', date: nextSunday },
      { label: 'Next Week', date: nextWeek },
      { label: '2 Weeks', date: twoWeeks },
    ];
  };

  const isDateSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const handleDateClick = (date: Date | null) => {
    if (!date || isPastDate(date)) return;
    setSelectedDate(date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formatSelectedDate = () => {
    if (!selectedDate) return 'Select a date';
    return selectedDate.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!opponent.trim()) {
      setError('Opponent name is required');
      return;
    }
    if (!selectedDate) {
      setError('Please select a match date');
      return;
    }

    setIsSaving(true);
    try {
      const [hours, minutes] = kickoffTime.split(':').map(Number);
      const kickoffDateTime = new Date(selectedDate);
      kickoffDateTime.setHours(hours, minutes, 0, 0);

      await onSave({
        opponent: opponent.trim(),
        kickoff_time: kickoffDateTime.toISOString(),
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fixture-form-title"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(34,197,94,0.1)] overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header gradient */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 via-purple-500 to-amber-500" aria-hidden="true" />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors z-10"
          aria-label="Close form"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 md:p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center" aria-hidden="true">
              <Zap className="text-green-500" size={20} />
            </div>
            <div>
              <h2 id="fixture-form-title" className="text-xl font-display font-bold text-white uppercase tracking-wider">
                {editingFixture ? 'Edit Fixture' : 'Schedule Match'}
              </h2>
              <p className="text-xs text-slate-500 font-mono">Configure matchday details</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-6">
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
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:border-green-500/50 focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Date Selection Section */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Match Date *
              </label>

              {/* Selected Date Preview */}
              <div className={`mb-4 p-4 rounded-xl border ${selectedDate ? 'bg-green-500/5 border-green-500/30' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center gap-3">
                  <Calendar size={20} className={selectedDate ? 'text-green-500' : 'text-slate-500'} />
                  <span className={`text-lg font-display ${selectedDate ? 'text-green-500' : 'text-slate-500'}`}>
                    {formatSelectedDate()}
                  </span>
                </div>
              </div>

              {/* Quick Date Presets */}
              <div className="mb-4">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">Quick Select</p>
                <div className="flex flex-wrap gap-2">
                  {getQuickDates().map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setSelectedDate(preset.date);
                        setCurrentMonth(preset.date);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all ${
                        isDateSelected(preset.date)
                          ? 'bg-green-500 text-black'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:border-green-500/50 hover:text-green-500'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual Calendar */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="font-display font-bold text-white uppercase tracking-wider">
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h3>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>

                {/* Weekday Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {WEEKDAYS.map((day) => (
                    <div key={day} className="text-center text-[10px] font-mono text-slate-500 uppercase py-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((date, index) => (
                    <button
                      key={index}
                      type="button"
                      disabled={!date || isPastDate(date)}
                      onClick={() => handleDateClick(date)}
                      className={`
                        aspect-square p-1 rounded-lg text-sm font-mono transition-all flex items-center justify-center
                        ${!date ? 'invisible' : ''}
                        ${isPastDate(date) ? 'text-slate-700 cursor-not-allowed' : ''}
                        ${isDateSelected(date) ? 'bg-green-500 text-black font-bold shadow-[0_0_15px_rgba(34,197,94,0.4)]' : ''}
                        ${isToday(date) && !isDateSelected(date) ? 'border border-green-500/50 text-green-500' : ''}
                        ${!isDateSelected(date) && !isPastDate(date) && date ? 'text-slate-300 hover:bg-white/10' : ''}
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Kickoff Time */}
            <div>
              <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                Kickoff Time
              </label>

              {/* Common Times */}
              <div className="flex flex-wrap gap-2 mb-3">
                {COMMON_KICKOFF_TIMES.map((time) => (
                  <button
                    key={time.value}
                    type="button"
                    onClick={() => setKickoffTime(time.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                      kickoffTime === time.value
                        ? 'bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'bg-white/5 border border-white/10 text-slate-400 hover:border-purple-500/50 hover:text-purple-400'
                    }`}
                  >
                    <Clock size={14} />
                    {time.label}
                  </button>
                ))}
              </div>

              {/* Custom Time Input */}
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="time"
                  value={kickoffTime}
                  onChange={(e) => setKickoffTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white focus:border-purple-500/50 focus:outline-none transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-slate-500">
                  CUSTOM
                </span>
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
                        ? v === 'Home'
                          ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                          : 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.3)]'
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
                className="w-full bg-black/40 border border-white/10 rounded-lg py-3 px-4 text-white placeholder-slate-600 focus:border-green-500/50 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-lg transition-all text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedDate || !opponent.trim()}
              className="flex-1 py-3 px-4 bg-green-500 text-black rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(34,197,94,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
