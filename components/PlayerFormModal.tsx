
import React, { useState, useEffect } from 'react';
import { Player, PlayerStats } from '../types';
import { X, Save, User, Shield, Target, Zap, Crown, Plus, Gauge } from 'lucide-react';

interface PlayerFormModalProps {
  player?: Player | null;
  onSave: (player: Player) => void;
  onClose: () => void;
}

const POSITION_CONFIG = {
  GK: { label: 'Goalkeeper', color: 'yellow', icon: Shield },
  DEF: { label: 'Defender', color: 'blue', icon: Shield },
  MID: { label: 'Midfielder', color: 'purple', icon: Zap },
  FWD: { label: 'Forward', color: 'amber', icon: Target },
};

const STAT_COLORS: Record<string, string> = {
  pace: '#22c55e',
  shooting: '#f59e0b',
  passing: '#3b82f6',
  dribbling: '#a855f7',
  defending: '#06b6d4',
  physical: '#ef4444',
};

const QUICK_TAGS = ['Captain Material', 'Fan Favorite', 'Rising Star', 'Veteran', 'Academy Product', 'Top Scorer', 'Assist King', 'Iron Wall'];

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({ player, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Player>>({
    name: '',
    number: 1,
    position: 'MID',
    form: 7.0,
    stats: {
      pace: 70,
      shooting: 70,
      passing: 70,
      dribbling: 70,
      defending: 70,
      physical: 70
    },
    narrative_tags: [],
    is_captain: false
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (player) {
      setFormData(JSON.parse(JSON.stringify(player)));
    }
  }, [player]);

  const handleChange = (field: keyof Player, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (stat: keyof PlayerStats, value: number) => {
    setFormData(prev => ({
      ...prev,
      stats: { ...prev.stats!, [stat]: value }
    }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !formData.narrative_tags?.includes(tag.trim())) {
      handleChange('narrative_tags', [...(formData.narrative_tags || []), tag.trim()]);
    }
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPlayer: Player = {
      id: player?.id || crypto.randomUUID(),
      name: formData.name || 'Unknown Player',
      number: formData.number || 1,
      position: formData.position as any,
      form: formData.form || 6.0,
      stats: formData.stats as PlayerStats,
      highlight_uri: player?.highlight_uri,
      analysis: player?.analysis,
      is_captain: formData.is_captain,
      narrative_tags: formData.narrative_tags || [],
      image_url: player?.image_url
    };
    onSave(finalPlayer);
  };

  const overallRating = Math.round(
    Object.values(formData.stats || {}).reduce((a, b) => a + b, 0) / 6
  );

  const posConfig = POSITION_CONFIG[formData.position as keyof typeof POSITION_CONFIG];

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl bg-[#0a0a0a] rounded-2xl border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-green-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <User className="text-green-500" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">
                {player ? 'Edit Player' : 'Add New Player'}
              </h3>
              <p className="text-xs text-slate-500 font-mono">Squad Management System</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col lg:flex-row">

            {/* Left: Player Preview Card */}
            <div className="lg:w-64 p-6 bg-black/40 border-r border-white/5 flex flex-col items-center">
              <div className="relative mb-4">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br from-${posConfig?.color}-500/30 to-transparent border-2 border-${posConfig?.color}-500/50 flex items-center justify-center`}>
                  <span className="text-4xl font-display font-bold text-white">{formData.number || '?'}</span>
                </div>
                {formData.is_captain && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center border-2 border-black">
                    <Crown size={14} className="text-black" />
                  </div>
                )}
              </div>

              <h4 className="text-lg font-display font-bold text-white text-center mb-1">
                {formData.name || 'Player Name'}
              </h4>
              <span className={`text-xs font-mono text-${posConfig?.color}-400 uppercase tracking-wider`}>
                {posConfig?.label || 'Position'}
              </span>

              {/* Overall Rating */}
              <div className="mt-6 w-full">
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Overall</span>
                    <Gauge size={14} className="text-slate-500" />
                  </div>
                  <div className="flex items-end gap-2">
                    <span className={`text-4xl font-display font-bold ${overallRating >= 80 ? 'text-green-500' : overallRating >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                      {overallRating}
                    </span>
                    <span className="text-xs text-slate-500 mb-1">/99</span>
                  </div>
                </div>
              </div>

              {/* Form Rating */}
              <div className="mt-4 w-full">
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Current Form</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0" max="10" step="0.1"
                    value={formData.form}
                    onChange={e => handleChange('form', parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                  />
                  <span className={`text-lg font-bold font-mono ${(formData.form || 0) >= 8 ? 'text-green-500' : (formData.form || 0) >= 5 ? 'text-amber-500' : 'text-red-500'}`}>
                    {formData.form?.toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Captain Toggle */}
              <button
                type="button"
                onClick={() => handleChange('is_captain', !formData.is_captain)}
                className={`mt-4 w-full py-2.5 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-2 transition-all ${
                  formData.is_captain
                    ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                    : 'border-white/10 text-slate-400 hover:bg-white/5'
                }`}
              >
                <Crown size={14} />
                {formData.is_captain ? 'Captain' : 'Make Captain'}
              </button>
            </div>

            {/* Right: Form Fields */}
            <div className="flex-1 p-6 space-y-6">

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    placeholder="Enter player name"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none transition-colors placeholder:text-slate-600"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Kit Number</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="99"
                    value={formData.number}
                    onChange={e => handleChange('number', parseInt(e.target.value) || 1)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-green-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Position Selector */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Position</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(POSITION_CONFIG).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = formData.position === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleChange('position', key)}
                        className={`p-3 rounded-lg border flex flex-col items-center gap-1.5 transition-all ${
                          isSelected
                            ? `bg-${config.color}-500/20 border-${config.color}-500 text-${config.color}-400`
                            : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-[10px] font-bold uppercase">{key}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-3">Player Attributes</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(formData.stats || {}).map(([key, value]) => (
                    <div key={key} className="bg-white/5 rounded-lg p-3 border border-white/5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{key}</span>
                        <span className="text-sm font-bold" style={{ color: STAT_COLORS[key] }}>{value}</span>
                      </div>
                      <div className="relative">
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ width: `${value}%`, backgroundColor: STAT_COLORS[key] }}
                          />
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="99"
                          value={value}
                          onChange={e => handleStatChange(key as keyof PlayerStats, parseInt(e.target.value))}
                          className="absolute inset-0 w-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Narrative Tags */}
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase mb-2">Narrative Tags</label>

                {/* Quick Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {QUICK_TAGS.filter(tag => !formData.narrative_tags?.includes(tag)).slice(0, 4).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addTag(tag)}
                      className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-[10px] text-slate-400 hover:text-white hover:border-white/20 transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>

                {/* Custom Tag Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag(tagInput);
                      }
                    }}
                    placeholder="Add custom tag..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-purple-500 outline-none transition-colors placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => addTag(tagInput)}
                    disabled={!tagInput.trim()}
                    className="px-4 py-2 bg-purple-500/10 border border-purple-500/50 text-purple-500 rounded-lg hover:bg-purple-500/20 transition-colors disabled:opacity-50"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Selected Tags */}
                {formData.narrative_tags && formData.narrative_tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.narrative_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-xs font-mono"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleChange('narrative_tags', formData.narrative_tags?.filter((_, i) => i !== idx) || [])}
                          className="hover:text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-white/10 bg-black/30 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-white/10 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-green-500 text-black rounded-lg font-bold shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:bg-green-400 transition-all flex items-center gap-2"
            >
              <Save size={16} />
              {player ? 'Save Changes' : 'Add Player'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default PlayerFormModal;
