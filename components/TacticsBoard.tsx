
import React, { useState } from 'react';
import { Player } from '../types';
import { Maximize2, X, Plus } from 'lucide-react';

interface TacticsBoardProps {
  players: Player[];
  onExpand?: () => void;
  isExpanded?: boolean;
  onClose?: () => void;
}

const TacticsBoard: React.FC<TacticsBoardProps> = ({ players, onExpand, isExpanded = false, onClose }) => {
  const safePlayers = Array.isArray(players) ? players : [];
  const [formations, setFormations] = useState(['4-3-3', '4-4-2', '3-5-2', '4-2-3-1']);
  const [formation, setFormation] = useState('4-3-3');
  const [isAddingFormation, setIsAddingFormation] = useState(false);
  const [newFormation, setNewFormation] = useState('');

  const handleAddFormation = () => {
    // Regex allows 3-5-2, 4-2-3-1, 4-1-2-1-2 etc.
    if (/^(\d-)+\d$/.test(newFormation) && !formations.includes(newFormation)) {
      setFormations([...formations, newFormation]);
      setFormation(newFormation);
      setNewFormation('');
      setIsAddingFormation(false);
    }
  };

  // Improved logic to ensure we always show a full team if players exist
  const getPlayersForFormation = () => {
    const lines = formation.split('-').map(Number);
    
    // Create a pool of available players
    let availablePlayers = [...safePlayers];
    
    // 1. Pick Goalkeeper
    const gk = availablePlayers.find(p => p.position === 'GK') || availablePlayers[0];
    if (gk) {
        availablePlayers = availablePlayers.filter(p => p.id !== gk.id);
    }

    const fieldRows: Player[][] = [];

    // 2. Fill each line of the formation
    lines.forEach((count, index) => {
        const rowPlayers: Player[] = [];
        
        // Determine preferred position for this line
        let preferredPos = 'MID';
        if (index === 0) preferredPos = 'DEF';
        else if (index === lines.length - 1) preferredPos = 'FWD';
        
        // A. Try to find players matching preferred position
        const idealPlayers = availablePlayers.filter(p => p.position === preferredPos);
        
        for (const p of idealPlayers) {
            if (rowPlayers.length < count) {
                rowPlayers.push(p);
                availablePlayers = availablePlayers.filter(ap => ap.id !== p.id);
            }
        }
        
        // B. If slot still empty, fill with ANY remaining available player
        if (rowPlayers.length < count) {
            const needed = count - rowPlayers.length;
            const fillers = availablePlayers.slice(0, needed);
            rowPlayers.push(...fillers);
            // Remove fillers from pool
            availablePlayers = availablePlayers.filter(ap => !fillers.find(f => f.id === ap.id));
        }

        fieldRows.push(rowPlayers);
    });

    return { gk, fieldRows };
  };

  const { gk, fieldRows } = getPlayersForFormation();

  const getPositionStyle = (index: number, totalInRow: number, rowIndex: number, totalRows: number) => {
    // Horizontal positioning (centered spread)
    const left = `${(index + 1) * (100 / (totalInRow + 1))}%`;
    
    // Vertical positioning
    if (rowIndex === -1) return { bottom: '5%', left: '50%' }; // GK special case

    // Field players spread from 20% to 85% height
    const startH = 20;
    const endH = 85;
    
    // If only 1 row (e.g. 10-0-0 formation lol), put in middle
    if (totalRows === 1) return { bottom: '50%', left };

    const step = (endH - startH) / (totalRows - 1);
    const bottom = `${startH + (rowIndex * step)}%`;

    return { bottom, left };
  };

  const renderPlayerDot = (p: Player, i: number, rowTotal: number, rowIndex: number, totalRows: number) => {
      // Determine color based on actual position
      let colorClass = 'bg-slate-500 shadow-[0_0_15px_rgba(100,116,139,0.6)]';
      if (p.position === 'GK') colorClass = 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)]';
      if (p.position === 'DEF') colorClass = 'bg-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.6)]';
      if (p.position === 'MID') colorClass = 'bg-neon-purple shadow-[0_0_15px_rgba(188,19,254,0.6)]';
      if (p.position === 'FWD') colorClass = 'bg-neon-pink shadow-[0_0_15px_rgba(255,0,85,0.6)]';

      return (
        <div 
            key={p.id} 
            className="absolute transform -translate-x-1/2 flex flex-col items-center gap-1 transition-all duration-500 group cursor-pointer z-10" 
            style={getPositionStyle(i, rowTotal, rowIndex, totalRows)}
        >
            <div className={`w-8 h-8 ${isExpanded ? 'w-12 h-12 text-sm' : 'w-8 h-8 text-xs'} rounded-full border-2 border-black flex items-center justify-center font-bold text-black ${colorClass} group-hover:scale-110 transition-transform`}>
                {p.number}
            </div>
            <span className={`text-[10px] ${isExpanded ? 'text-xs px-3 py-1' : 'px-2 py-0.5'} font-bold text-white bg-black/50 rounded backdrop-blur-sm truncate max-w-[100px] border border-black/30`}>{p.name}</span>
        </div>
      );
  };

  return (
    <div className={`glass-card rounded-2xl relative overflow-hidden border-neon-blue/20 flex flex-col ${isExpanded ? 'h-full w-full border-none bg-black' : 'p-6'}`}>
      
      {/* Header */}
      <div className={`flex justify-between items-center z-10 relative ${isExpanded ? 'p-6 bg-black/50 backdrop-blur-md border-b border-white/10' : 'mb-6'}`}>
        <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <span className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_10px_#0aff0a]"></span>
            Tactical Overview
        </h3>
        
        <div className="flex items-center gap-3">
            <div className="flex gap-2">
                {formations.slice(0, isExpanded ? 6 : 3).map(f => (
                    <button 
                        key={f}
                        onClick={() => setFormation(f)}
                        className={`px-3 py-1 rounded-md text-xs font-mono border transition-all ${formation === f ? 'bg-neon-blue/20 border-neon-blue text-neon-blue' : 'border-white/10 text-slate-400 hover:text-white'}`}
                    >
                        {f}
                    </button>
                ))}
                
                {isAddingFormation ? (
                   <div className="flex items-center gap-1">
                       <input 
                         type="text" 
                         value={newFormation}
                         onChange={(e) => setNewFormation(e.target.value)}
                         placeholder="4-2-3-1"
                         className="w-20 bg-black/40 border border-white/20 rounded px-2 py-1 text-xs text-white outline-none focus:border-neon-blue"
                         autoFocus
                         onBlur={() => !newFormation && setIsAddingFormation(false)}
                         onKeyDown={(e) => e.key === 'Enter' && handleAddFormation()}
                       />
                       <button onClick={handleAddFormation} className="text-green-400 hover:text-green-300"><Plus size={16} /></button>
                   </div>
                ) : (
                    <button 
                        onClick={() => setIsAddingFormation(true)}
                        className="px-2 py-1 rounded-md text-xs font-mono border border-dashed border-slate-600 text-slate-500 hover:text-white hover:border-slate-400"
                        title="Add Custom Formation"
                    >
                        +
                    </button>
                )}
            </div>
            
            {!isExpanded && onExpand && (
                <button 
                    onClick={onExpand}
                    className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors ml-2"
                    title="Expand View"
                >
                    <Maximize2 size={16} />
                </button>
            )}
            {isExpanded && onClose && (
                 <button 
                    onClick={onClose}
                    className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors ml-2"
                >
                    <X size={20} />
                </button>
            )}
        </div>
      </div>

      {/* The Pitch */}
      <div className={`relative w-full ${isExpanded ? 'flex-1 m-4' : 'aspect-[3/4] md:aspect-[4/3]'} bg-gradient-to-b from-emerald-900/40 to-emerald-950/80 rounded-xl border border-white/10 overflow-hidden shadow-inner`}>
        {/* Pitch Markings */}
        <div className="absolute inset-4 border-2 border-white/10 rounded-sm"></div>
        <div className="absolute top-0 left-1/4 right-1/4 h-16 border-b-2 border-x-2 border-white/10 rounded-b-lg"></div>
        <div className="absolute bottom-0 left-1/4 right-1/4 h-16 border-t-2 border-x-2 border-white/10 rounded-t-lg"></div>
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/10 -translate-y-1/2"></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 border-2 border-white/10 rounded-full -translate-x-1/2 -translate-y-1/2"></div>

        {/* Players */}
        {/* GK */}
        {gk && renderPlayerDot(gk, 0, 1, -1, fieldRows.length)}

        {/* Field Rows */}
        {fieldRows.map((row, rowIndex) => 
            row.map((p, pIndex) => 
                renderPlayerDot(p, pIndex, row.length, rowIndex, fieldRows.length)
            )
        )}

      </div>
    </div>
  );
};

export default TacticsBoard;
