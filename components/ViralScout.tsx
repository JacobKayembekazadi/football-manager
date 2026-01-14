import React, { useState } from 'react';
import { Club, ContentGenStatus } from '../types';
import { Sparkles, Loader2, Video, Lightbulb } from 'lucide-react';

interface ViralScoutProps {
  club: Club;
  onGenerateIdeas?: () => Promise<string[]>;
}

const ViralScout: React.FC<ViralScoutProps> = ({ club, onGenerateIdeas }) => {
  const [ideas, setIdeas] = useState<string[]>([
    'Player Spotlight: Behind-the-scenes training session with Marcus Thorn',
    'Matchday Atmosphere: Pre-game fan interviews and stadium walk-through',
    'Tactical Breakdown: Animated video explaining the 3-1 win formation',
    'Locker Room Cam: Post-match celebrations and team reactions',
    'Youth Academy Feature: Upcoming talent showcase and development journey'
  ]);
  const [status, setStatus] = useState<ContentGenStatus>('idle');

  const handleGenerate = async () => {
    if (!onGenerateIdeas) return;
    setStatus('generating');
    try {
      const newIdeas = await onGenerateIdeas();
      setIdeas(newIdeas);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="glass-card p-6 rounded-xl border border-purple-500/20 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Video size={20} className="text-purple-500" />
          </div>
          <div>
            <h3 className="text-lg font-display font-bold text-white">Viral Scout</h3>
            <p className="text-xs text-slate-400 font-mono">Weekly video script ideas</p>
          </div>
        </div>
        {onGenerateIdeas && (
          <button
            onClick={handleGenerate}
            disabled={status === 'generating'}
            className="px-4 py-2 bg-purple-500/10 border border-purple-500/50 text-purple-500 rounded-lg font-bold uppercase text-xs hover:bg-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {status === 'generating' ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={14} />
                Generate Ideas
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {ideas.map((idea, idx) => (
          <div
            key={idx}
            className="bg-white/5 p-3 rounded border border-white/10 flex items-start gap-3"
          >
            <Lightbulb size={16} className="text-purple-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-200 flex-1">{idea}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ViralScout;




