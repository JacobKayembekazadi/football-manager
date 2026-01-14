
import React from 'react';
import { Player } from '../types';
import { Activity, PlayCircle, Edit2, Trash2 } from 'lucide-react';

interface PlayerCardProps {
  player: Player;
  onOpenHighlight: (player: Player) => void;
  onEdit: (player: Player) => void;
  onDelete: (playerId: string) => void;
}

const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
  <div className="mb-2">
    <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mb-0.5">
      <span>{label}</span>
      <span style={{ color }}>{value}</span>
    </div>
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-1000" 
        style={{ width: `${value}%`, backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
      ></div>
    </div>
  </div>
);

const PlayerCard: React.FC<PlayerCardProps> = ({ player, onOpenHighlight, onEdit, onDelete }) => {
  
  const getFormStyles = (form: number) => {
      if (form >= 9) return {
          badge: "bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] animate-pulse",
          icon: "animate-bounce",
          text: "drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"
      };
      if (form >= 8) return {
          badge: "bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]",
          icon: "animate-pulse",
          text: ""
      };
      if (form >= 6) return {
          badge: "bg-amber-500/10 border-amber-500/30 text-amber-400",
          icon: "",
          text: ""
      };
      return {
          badge: "bg-slate-800/40 border-slate-700 text-slate-500",
          icon: "",
          text: ""
      };
  };

  const styles = getFormStyles(player.form);

  return (
    <div className="glass-card relative group overflow-hidden rounded-xl border border-white/5 hover:border-green-500/50 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,197,94,0.1)]">
      
      {/* Background Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

      {/* Header */}
      <div className="p-4 flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-black border border-white/20 flex items-center justify-center relative overflow-hidden group-hover:border-green-500/50 transition-colors">
              {player.image_url ? (
                  <img src={player.image_url} alt={player.name} className="w-full h-full object-cover" />
              ) : (
                  <span className="text-xl font-display font-bold text-white">{player.number}</span>
              )}
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-white leading-none group-hover:text-green-400 transition-colors">{player.name}</h3>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{player.position}</span>
          </div>
        </div>
        
        {/* Form Indicator */}
        <div className="flex flex-col items-end gap-1">
            <div className={`px-2.5 py-1 rounded-lg border flex items-center gap-2 backdrop-blur-md transition-all duration-300 ${styles.badge}`}>
                <Activity size={14} className={styles.icon} />
                <span className={`text-xs font-mono font-bold ${styles.text}`}>{player.form.toFixed(1)}</span>
            </div>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider opacity-60">Cur. Form</span>
        </div>
      </div>

      {/* Quick Stats Grid (Mini) */}
      <div className="px-4 py-2 grid grid-cols-2 gap-x-4 gap-y-2 relative z-10">
          <StatBar label="PAC" value={player.stats.pace} color="#22c55e" />
          <StatBar label="SHO" value={player.stats.shooting} color="#f59e0b" />
      </div>

      {/* Narrative Tags */}
      {player.narrative_tags && player.narrative_tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5 relative z-10">
          {player.narrative_tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded text-[9px] font-mono uppercase"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 border-t border-white/5 bg-black/20 flex items-center justify-between relative z-10">
        <button 
            onClick={() => onOpenHighlight(player)}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-colors"
        >
            <PlayCircle size={14} className="text-purple-400" />
            Intelligence
        </button>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
             <button 
                onClick={() => onEdit(player)}
                className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-green-400 transition-colors"
             >
                 <Edit2 size={14} />
             </button>
             <button 
                onClick={() => onDelete(player.id)}
                className="p-1.5 hover:bg-red-500/20 rounded text-slate-400 hover:text-red-500 transition-colors"
             >
                 <Trash2 size={14} />
             </button>
        </div>
      </div>
    </div>
  );
};

export default PlayerCard;
