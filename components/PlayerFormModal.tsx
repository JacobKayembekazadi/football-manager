
import React, { useState, useEffect } from 'react';
import { Player, PlayerStats } from '../types';
import { X, Save, User, Activity } from 'lucide-react';

interface PlayerFormModalProps {
  player?: Player | null; // null for creating new
  onSave: (player: Player) => void;
  onClose: () => void;
}

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({ player, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Player>>({
    name: '',
    number: 0,
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
    narrative_tags: []
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (player) {
      setFormData(JSON.parse(JSON.stringify(player))); // Deep copy
    }
  }, [player]);

  const handleChange = (field: keyof Player, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStatChange = (stat: keyof PlayerStats, value: number) => {
      setFormData(prev => ({
          ...prev,
          stats: {
              ...prev.stats!,
              [stat]: value
          }
      }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Construct final player object
    const finalPlayer: Player = {
        id: player?.id || crypto.randomUUID(),
        name: formData.name || 'Unknown Unit',
        number: formData.number || 0,
        position: formData.position as any,
        form: formData.form || 6.0,
        stats: formData.stats as PlayerStats,
        highlight_uri: player?.highlight_uri,
        analysis: player?.analysis,
        is_captain: formData.is_captain,
        narrative_tags: formData.narrative_tags || []
    };

    onSave(finalPlayer);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-2xl border border-blue-500/30 shadow-[0_0_50px_rgba(59,130,246,0.1)] overflow-hidden flex flex-col max-h-[90vh]">

        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
            <h3 className="font-display font-bold text-white text-lg flex items-center gap-2">
                <User className="text-blue-400" size={20} />
                {player ? 'EDIT BIO-METRICS' : 'NEW SQUAD UNIT'}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            
            {/* Basic Info */}
            <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Unit Identification</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">Full Name</label>
                        <input 
                            type="text" 
                            required
                            value={formData.name}
                            onChange={e => handleChange('name', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">Kit Number</label>
                        <input 
                            type="number" 
                            required
                            value={formData.number}
                            onChange={e => handleChange('number', parseInt(e.target.value))}
                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">Position</label>
                        <select
                            value={formData.position}
                            onChange={e => handleChange('position', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-blue-500 outline-none transition-colors"
                        >
                            <option value="GK">Goalkeeper (GK)</option>
                            <option value="DEF">Defender (DEF)</option>
                            <option value="MID">Midfielder (MID)</option>
                            <option value="FWD">Forward (FWD)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-slate-400 mb-1 font-mono uppercase">Current Form (0-10)</label>
                        <div className="flex items-center gap-4">
                            <input 
                                type="range" 
                                min="0" max="10" step="0.1"
                                value={formData.form}
                                onChange={e => handleChange('form', parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                            />
                            <span className="text-green-500 font-bold font-mono">{formData.form?.toFixed(1)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Performance Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                    {Object.keys(formData.stats || {}).map((key) => (
                        <div key={key}>
                            <div className="flex justify-between text-xs text-slate-400 mb-1 font-mono uppercase">
                                <span>{key}</span>
                                <span className="text-white">{(formData.stats as any)[key]}</span>
                            </div>
                            <input 
                                type="range" 
                                min="0" max="99"
                                value={(formData.stats as any)[key]}
                                onChange={e => handleStatChange(key as keyof PlayerStats, parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Narrative Tags */}
            <div className="space-y-4">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Narrative Tags (for brand building)</h4>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={tagInput}
                            onChange={e => setTagInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (tagInput.trim() && !formData.narrative_tags?.includes(tagInput.trim())) {
                                        handleChange('narrative_tags', [...(formData.narrative_tags || []), tagInput.trim()]);
                                        setTagInput('');
                                    }
                                }
                            }}
                            placeholder="Add tags like: Veteran, Fan Favorite, Top Scorer..."
                            className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-2 text-white focus:border-purple-500 outline-none transition-colors placeholder:text-slate-600"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                if (tagInput.trim() && !formData.narrative_tags?.includes(tagInput.trim())) {
                                    handleChange('narrative_tags', [...(formData.narrative_tags || []), tagInput.trim()]);
                                    setTagInput('');
                                }
                            }}
                            className="px-4 py-2 bg-purple-500/10 border border-purple-500/50 text-purple-500 rounded hover:bg-purple-500/20 transition-colors font-mono text-xs uppercase"
                        >
                            Add
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.narrative_tags?.map((tag, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-full text-xs font-mono uppercase"
                            >
                                {tag}
                                <button
                                    type="button"
                                    onClick={() => {
                                        handleChange('narrative_tags', formData.narrative_tags?.filter((_, i) => i !== idx) || []);
                                    }}
                                    className="hover:text-white transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/50 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="px-6 py-2 rounded text-xs font-bold uppercase hover:bg-white/10 text-slate-300 transition-colors">
                    Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-blue-500 text-black rounded font-bold uppercase shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:bg-cyan-300 transition-all flex items-center gap-2">
                    <Save size={16} /> Save Unit
                </button>
            </div>
        </form>

      </div>
    </div>
  );
};

export default PlayerFormModal;
