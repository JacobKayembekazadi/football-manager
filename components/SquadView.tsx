
import React, { useState, useEffect } from 'react';
import { Player, Club, MOCK_CLUB, PlayerStats } from '../types';
import PlayerCard from './PlayerCard';
import TacticsBoard from './TacticsBoard';
import RadarChart from './RadarChart';
import PlayerFormModal from './PlayerFormModal';
import ConfirmationDialog from './ConfirmationDialog';
import EmptyState, { EMPTY_STATE_PRESETS } from './EmptyState';
import { useToast } from './Toast';
import { generatePlayerAnalysis, generatePlayerSpotlight, ImageGenerationResult } from '../services/geminiService';
import { createPlayer, updatePlayer, deletePlayer } from '../services/playerService';
import { Plus, Search, Filter, X, Loader2, Cpu, Activity, Zap, ArrowUpDown, ArrowUp, ArrowDown, Upload, User, Camera, Image as ImageIcon, Download } from 'lucide-react';

interface SquadViewProps {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  club?: Club; // Add club prop for club ID
}

const SquadView: React.FC<SquadViewProps> = ({ players, setPlayers, club }) => {
  const toast = useToast();
  const safePlayers = Array.isArray(players) ? players : [];
  const currentClub = club ?? MOCK_CLUB;
  const clubId = currentClub.id;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null); // For View/Analysis
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null); // For Edit Form
  const [isFormOpen, setIsFormOpen] = useState(false); // For Add/Edit Form
  const [filterPosition, setFilterPosition] = useState<string>('ALL');
  const [isTacticsExpanded, setIsTacticsExpanded] = useState(false); // New state for tactics expansion
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'form', direction: 'desc' });
  const [isSortOpen, setIsSortOpen] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingCard, setIsGeneratingCard] = useState(false);
  const [generatedCard, setGeneratedCard] = useState<ImageGenerationResult | null>(null);

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; playerId: string | null; playerName: string }>({
    isOpen: false,
    playerId: null,
    playerName: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Auto-generate analysis when player is selected if missing
  useEffect(() => {
    if (selectedPlayer && !selectedPlayer.analysis) {
        let isMounted = true;
        
        const fetchAnalysis = async () => {
            try {
                const text = await generatePlayerAnalysis(currentClub, selectedPlayer);
                
                if (isMounted) {
                    // Update player in database
                    try {
                        await updatePlayer(selectedPlayer.id, { ...selectedPlayer, analysis: text });
                        // Update parent list
                        const updatedPlayers = safePlayers.map(p => p.id === selectedPlayer.id ? { ...p, analysis: text } : p);
                        setPlayers(updatedPlayers);
                        
                        // Update local selected player to show result immediately
                        setSelectedPlayer(prev => prev && prev.id === selectedPlayer.id ? { ...prev, analysis: text } : prev);
                    } catch (error) {
                        console.error('Error saving analysis:', error);
                    }
                }
            } catch (e) {
                console.error("Auto-analysis failed", e);
            }
        };
        
        fetchAnalysis();
        
        return () => { isMounted = false; };
    }
  }, [selectedPlayer?.id]); // Only re-run if the selected player ID changes

  const filteredPlayers = safePlayers.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.position.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterPosition === 'ALL' || p.position === filterPosition;
      return matchesSearch && matchesFilter;
  });

  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    const { key, direction } = sortConfig;
    let aVal: any, bVal: any;

    if (['pace', 'shooting', 'passing', 'dribbling', 'defending', 'physical'].includes(key)) {
         aVal = a.stats[key as keyof PlayerStats];
         bVal = b.stats[key as keyof PlayerStats];
    } else if (key === 'form') {
         aVal = a.form;
         bVal = b.form;
    } else if (key === 'name') {
         aVal = a.name;
         bVal = b.name;
    } else if (key === 'number') {
         aVal = a.number;
         bVal = b.number;
    }

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const sortOptions = [
    { label: 'Form', key: 'form' },
    { label: 'Name', key: 'name' },
    { label: 'Pace', key: 'pace' },
    { label: 'Shooting', key: 'shooting' },
    { label: 'Passing', key: 'passing' },
    { label: 'Dribbling', key: 'dribbling' },
    { label: 'Defending', key: 'defending' },
    { label: 'Physical', key: 'physical' },
  ];

  const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'desc';
      // Toggle direction if clicking same key, otherwise default to desc for stats (highest first)
      if (sortConfig.key === key) {
          direction = sortConfig.direction === 'asc' ? 'desc' : 'asc';
      } else {
          // Default for name is asc, for stats is desc
          if (key === 'name') direction = 'asc';
      }
      setSortConfig({ key, direction });
      setIsSortOpen(false);
  };

  // --- CRUD Handlers ---

  const handleAddPlayer = () => {
      setEditingPlayer(null); // Clear for new
      setIsFormOpen(true);
  };

  const handleEditPlayer = (player: Player) => {
      setEditingPlayer(player);
      setIsFormOpen(true);
  };

  const handleDeletePlayer = (playerId: string) => {
    const player = safePlayers.find((p) => p.id === playerId);
    setDeleteConfirm({
      isOpen: true,
      playerId,
      playerName: player?.name || 'this player',
    });
  };

  const confirmDeletePlayer = async () => {
    if (!deleteConfirm.playerId) return;

    setIsDeleting(true);
    try {
      await deletePlayer(deleteConfirm.playerId);
      setPlayers(safePlayers.filter((p) => p.id !== deleteConfirm.playerId));
      toast.success('Player deleted successfully.');
      setDeleteConfirm({ isOpen: false, playerId: null, playerName: '' });
    } catch (error) {
      console.error('Error deleting player:', error);
      toast.error('Failed to delete player. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSavePlayer = async (player: Player) => {
      try {
          // Check if update or create
          const exists = safePlayers.find(p => p.id === player.id);
          if (exists) {
              await updatePlayer(player.id, player);
              setPlayers(safePlayers.map(p => p.id === player.id ? player : p));
              toast.success('Player updated successfully.');
          } else {
              const { id, ...playerData } = player;
              const newPlayer = await createPlayer(clubId, playerData);
              setPlayers([...safePlayers, newPlayer]);
              toast.success('Player added successfully.');
          }
          setIsFormOpen(false);
      } catch (error) {
          console.error('Error saving player:', error);
          toast.error('Failed to save player. Please try again.');
      }
  };

  const toggleFilter = () => {
      const positions = ['ALL', 'GK', 'DEF', 'MID', 'FWD'];
      const currentIndex = positions.indexOf(filterPosition);
      const nextIndex = (currentIndex + 1) % positions.length;
      setFilterPosition(positions[nextIndex]);
  };

  // --- AI Handlers ---

  const handleGenerateAnalysis = async () => {
      if (!selectedPlayer) return;
      setIsAnalyzing(true);
      
      try {
          const text = await generatePlayerAnalysis(currentClub, selectedPlayer);
          
          const updatedPlayer = { ...selectedPlayer, analysis: text };
          await updatePlayer(selectedPlayer.id, updatedPlayer);
          updatePlayerInList(updatedPlayer);
          setSelectedPlayer(updatedPlayer);
      } catch (error) {
          console.error('Error generating analysis:', error);
      } finally {
          setIsAnalyzing(false);
      }
  }

  const handleGeneratePlayerCard = async () => {
      if (!selectedPlayer) return;
      setIsGeneratingCard(true);
      setGeneratedCard(null);
      
      try {
          const result = await generatePlayerSpotlight(currentClub, selectedPlayer);
          setGeneratedCard(result);
      } catch (error) {
          console.error('Error generating player card:', error);
          setVideoError('Failed to generate player card image.');
      } finally {
          setIsGeneratingCard(false);
      }
  }

  const handleDownloadCard = () => {
      if (!generatedCard || !selectedPlayer) return;
      const link = document.createElement('a');
      link.href = `data:${generatedCard.mimeType};base64,${generatedCard.imageBase64}`;
      link.download = `${currentClub.slug}-${selectedPlayer.name.replace(/\s+/g, '-').toLowerCase()}-card.png`;
      link.click();
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedPlayer) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const result = reader.result as string;
                const updatedPlayer = { ...selectedPlayer, image_url: result };
                await updatePlayer(selectedPlayer.id, updatedPlayer);
                updatePlayerInList(updatedPlayer);
                setSelectedPlayer(updatedPlayer);
            } catch (error) {
                console.error('Error uploading image:', error);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  const updatePlayerInList = (updated: Player) => {
      setPlayers(safePlayers.map(p => p.id === updated.id ? updated : p));
  }

  const openAnalysisModal = (player: Player) => {
      setSelectedPlayer(player);
      setGeneratedCard(null); // Reset generated card when selecting new player
      // Auto-fetch handled by useEffect
  };

  return (
    <div className="space-y-8 relative">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
         <div>
            <h2 className="text-3xl font-display font-bold text-white glow-text">SQUAD <span className="text-green-500">INTEL</span></h2>
            <p className="text-slate-400 font-mono text-xs mt-1">Player intelligence for brand building.</p>
         </div>
         
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input 
                    type="text" 
                    placeholder="Search database..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-all placeholder:text-slate-600 font-mono"
                />
            </div>
            
            {/* Sort Dropdown */}
            <div className="relative">
                <button 
                    onClick={() => setIsSortOpen(!isSortOpen)}
                    className="bg-black/40 border border-white/10 text-slate-300 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors flex items-center gap-2 font-mono text-xs uppercase h-[42px] min-w-[120px] justify-between"
                >
                    <span className="flex items-center gap-2">
                        <ArrowUpDown size={14} className="text-green-500" /> 
                        {sortOptions.find(o => o.key === sortConfig.key)?.label}
                    </span>
                    {sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                </button>
                
                {isSortOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsSortOpen(false)}></div>
                        <div className="absolute top-full mt-2 right-0 w-48 bg-[#0a0a0a] border border-white/10 rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden flex flex-col py-1">
                            {sortOptions.map(option => (
                                <button
                                    key={option.key}
                                    onClick={() => handleSort(option.key)}
                                    className={`px-4 py-2 text-left text-xs font-mono uppercase hover:bg-white/5 flex justify-between items-center transition-colors ${sortConfig.key === option.key ? 'text-green-500 bg-white/5' : 'text-slate-400'}`}
                                >
                                    {option.label}
                                    {sortConfig.key === option.key && (
                                        sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <button 
                onClick={toggleFilter}
                className={`bg-green-500/10 border border-green-500/50 text-green-500 px-3 py-2 rounded-lg hover:bg-green-500/20 transition-colors flex items-center gap-2 font-mono text-xs uppercase h-[42px] ${filterPosition !== 'ALL' ? 'bg-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]' : ''}`}
            >
                <Filter size={16} /> {filterPosition}
            </button>
            <button 
                onClick={handleAddPlayer}
                className="bg-green-500 text-black px-4 py-2 rounded-lg font-bold font-display uppercase hover:bg-green-400 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.4)] flex items-center gap-2 h-[42px]"
            >
                <Plus size={18} /> Add
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: Tactics */}
        <div className="xl:col-span-1 space-y-6">
            <div className="glass-panel p-1 rounded-2xl">
                <TacticsBoard players={safePlayers} onExpand={() => setIsTacticsExpanded(true)} />
            </div>
            
            {/* Quick Stats Summary */}
            <div className="glass-card p-6 rounded-2xl">
                <h3 className="font-display font-bold text-white mb-4 uppercase tracking-wider">Squad Averages</h3>
                <div className="space-y-3">
                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                        <span>ATTACK RATING</span>
                        <span className="text-amber-500">87</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[87%] shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                    </div>

                    <div className="flex justify-between text-xs text-slate-400 font-mono">
                        <span>DEFENSE RATING</span>
                        <span className="text-green-500">82</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 w-[82%] shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column: Player Grid */}
        <div className="xl:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {sortedPlayers.map(player => (
                    <PlayerCard 
                        key={player.id} 
                        player={player} 
                        onOpenHighlight={openAnalysisModal} 
                        onEdit={handleEditPlayer}
                        onDelete={handleDeletePlayer}
                    />
                ))}
            </div>
            {sortedPlayers.length === 0 && safePlayers.length === 0 && (
                <div className="glass-card rounded-2xl border border-dashed border-white/10" data-tour="add-player-btn">
                    <EmptyState
                        {...EMPTY_STATE_PRESETS.players}
                        action={{
                            label: 'Add Your First Player',
                            onClick: handleAddPlayer,
                        }}
                    />
                </div>
            )}
            {sortedPlayers.length === 0 && safePlayers.length > 0 && (
                <div className="glass-card rounded-2xl border border-dashed border-white/10">
                    <EmptyState
                        icon={Search}
                        title="No players match your filter"
                        description="Try adjusting your search or filters"
                        variant="compact"
                    />
                </div>
            )}
        </div>
      </div>

      {/* Expanded Tactics Modal */}
      {isTacticsExpanded && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 animate-fade-in">
              <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setIsTacticsExpanded(false)}></div>
              <div className="relative w-full max-w-5xl h-[90vh] flex flex-col">
                  <TacticsBoard players={safePlayers} isExpanded={true} onClose={() => setIsTacticsExpanded(false)} />
              </div>
          </div>
      )}

      {/* Add/Edit Form Modal */}
      {isFormOpen && (
          <PlayerFormModal 
              player={editingPlayer} 
              onSave={handleSavePlayer} 
              onClose={() => setIsFormOpen(false)} 
          />
      )}

      {/* Expanded Player Intelligence Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedPlayer(null)}></div>
            <div className="relative w-full max-w-6xl h-[85vh] bg-[#050505] rounded-3xl overflow-hidden border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.15)] flex flex-col lg:flex-row">
                
                {/* Close Button */}
                <button 
                    onClick={() => setSelectedPlayer(null)} 
                    className="absolute top-4 right-4 z-20 bg-black/50 p-2 rounded-full text-white hover:text-red-400 transition-colors"
                >
                    <X size={20} />
                </button>

                {/* Left Side: Video Player / Media (50% on Large Screens) */}
                <div className="lg:w-1/2 bg-black relative flex flex-col group border-r border-white/10">
                    <div className="flex-1 relative flex items-center justify-center bg-grid-pattern bg-[length:30px_30px]">
                        {selectedPlayer.highlight_uri ? (
                            <video 
                                src={selectedPlayer.highlight_uri} 
                                controls 
                                autoPlay 
                                className="w-full h-full object-contain"
                            />
                        ) : (
                            <div className="text-center p-8 relative z-10 flex flex-col items-center">
                                {selectedPlayer.image_url ? (
                                     <div className="relative group/image">
                                        <img src={selectedPlayer.image_url} alt="Profile" className="w-48 h-48 object-cover rounded-full border-4 border-white/10 mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]" />
                                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover/image:opacity-100 transition-opacity">
                                            <label className="cursor-pointer flex flex-col items-center text-white">
                                                <Camera size={24} />
                                                <span className="text-[10px] uppercase font-bold mt-1">Change</span>
                                                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            </label>
                                        </div>
                                     </div>
                                ) : (
                                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10 group-hover:border-green-500/50 transition-colors">
                                        <User size={32} className="text-slate-500 group-hover:text-green-500" />
                                    </div>
                                )}
                                
                                {!selectedPlayer.image_url && (
                                    <>
                                        <h3 className="text-white font-display font-bold text-2xl tracking-widest">MEDIA OFFLINE</h3>
                                        <p className="text-slate-500 text-sm font-mono mt-2 mb-8">
                                            No visual data for unit #{selectedPlayer.number}.
                                        </p>
                                    </>
                                )}
                                
                                {!selectedPlayer.image_url && (
                                    <label className="cursor-pointer px-8 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-lg font-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                                        <Upload size={14} />
                                        Upload Profile Image
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                    </label>
                                )}
                            </div>
                        )}
                        
                        {/* Overlay Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"></div>
                        
                        {/* Video Info Overlay */}
                        <div className="absolute bottom-0 left-0 p-8 w-full">
                            <h2 className="text-4xl font-display font-bold text-white">{selectedPlayer.name}</h2>
                            <div className="flex items-center gap-4 mt-2">
                                <span className="bg-green-500 text-black px-2 py-0.5 rounded text-xs font-bold font-mono">#{selectedPlayer.number}</span>
                                <span className="text-slate-300 font-mono text-sm uppercase tracking-wider">{selectedPlayer.position}</span>
                                <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                                <span className="text-slate-300 font-mono text-sm">{MOCK_CLUB.name}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Intelligence Hub */}
                <div className="lg:w-1/2 bg-glass-panel flex flex-col overflow-y-auto custom-scrollbar">
                    {/* Top Bar */}
                    <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-[#050505]/95 backdrop-blur-xl z-10">
                        <div className="flex items-center gap-2 text-green-500">
                             <Cpu size={18} />
                             <span className="font-display font-bold uppercase tracking-widest text-sm">Intelligence Hub</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="px-3 py-1 bg-white/5 rounded border border-white/10 flex items-center gap-2">
                                <Activity size={14} className={selectedPlayer.form > 7 ? 'text-green-400' : 'text-orange-400'} />
                                <span className="text-xs font-mono text-slate-400">FORM: <span className="text-white font-bold">{selectedPlayer.form}</span></span>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Radar Chart Section */}
                        <div className="flex flex-col md:flex-row items-center gap-8">
                             <div className="relative">
                                 {/* Glowing background for chart */}
                                 <div className="absolute inset-0 bg-green-500/20 blur-[50px] rounded-full"></div>
                                 <RadarChart stats={selectedPlayer.stats} size={240} color={selectedPlayer.form > 8 ? '#22c55e' : '#3b82f6'} />
                             </div>
                             
                             <div className="flex-1 w-full grid grid-cols-2 gap-3">
                                 {Object.entries(selectedPlayer.stats).map(([key, value]) => (
                                     <div key={key} className="bg-white/5 p-3 rounded border border-white/5 flex flex-col">
                                         <span className="text-[10px] font-mono text-slate-500 uppercase">{key}</span>
                                         <div className="flex items-end justify-between">
                                             <span className="text-xl font-display font-bold text-white">{value}</span>
                                             <div className="w-12 h-1 bg-slate-700 rounded-full mb-1">
                                                 <div className="h-full bg-slate-400 rounded-full" style={{ width: `${value}%`}}></div>
                                             </div>
                                         </div>
                                     </div>
                                 ))}
                             </div>
                        </div>

                        {/* AI Scout Report */}
                        <div className="glass-card p-6 rounded-xl border border-purple-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <Zap size={100} className="text-purple-400" />
                            </div>
                            
                            <div className="relative z-10">
                                <h4 className="text-sm font-bold font-display text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                                    AI Scout Report
                                </h4>
                                
                                {selectedPlayer.analysis ? (
                                    <p className="text-slate-300 text-sm font-mono leading-relaxed whitespace-pre-line">
                                        {selectedPlayer.analysis}
                                    </p>
                                ) : (
                                    <div className="flex flex-col items-center py-4 text-slate-500">
                                        <Loader2 size={24} className="animate-spin mb-2 text-purple-400" />
                                        <span className="text-xs font-mono">Analyzing telemetry...</span>
                                    </div>
                                )}
                                
                                <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                                    <span className="text-[10px] text-slate-600 font-mono">ID: {selectedPlayer.id} // VER: 2.4.1</span>
                                    <button 
                                        onClick={handleGenerateAnalysis}
                                        disabled={isAnalyzing}
                                        className="text-[10px] text-purple-400 hover:text-white uppercase font-bold tracking-wider disabled:opacity-50"
                                    >
                                        {isAnalyzing ? 'Updating...' : 'Refresh Analysis'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* AI Player Card Generation */}
                        <div className="glass-card p-6 rounded-xl border border-green-500/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <ImageIcon size={80} className="text-green-500" />
                            </div>
                            
                            <div className="relative z-10">
                                <h4 className="text-sm font-bold font-display text-white uppercase tracking-widest flex items-center gap-2 mb-4">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                    AI Player Card
                                </h4>

                                {generatedCard ? (
                                    <div className="space-y-4">
                                        <img 
                                            src={`data:${generatedCard.mimeType};base64,${generatedCard.imageBase64}`}
                                            alt={`${selectedPlayer.name} card`}
                                            className="w-full rounded-lg border border-white/10 shadow-lg"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleDownloadCard}
                                                className="flex-1 px-4 py-2 bg-green-500 text-black font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-2 hover:bg-green-400 transition-colors"
                                            >
                                                <Download size={14} />
                                                Download
                                            </button>
                                            <button
                                                onClick={handleGeneratePlayerCard}
                                                disabled={isGeneratingCard}
                                                className="flex-1 px-4 py-2 bg-white/10 text-white font-bold text-xs uppercase rounded-lg flex items-center justify-center gap-2 hover:bg-white/20 transition-colors disabled:opacity-50"
                                            >
                                                Regenerate
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-slate-400 text-xs font-mono mb-4">
                                            Generate an AI-powered stats card with player attributes visualization.
                                        </p>
                                        <button
                                            onClick={handleGeneratePlayerCard}
                                            disabled={isGeneratingCard}
                                            className="px-6 py-3 bg-green-500/10 border border-green-500/50 text-green-500 rounded-lg font-bold text-xs uppercase flex items-center justify-center gap-2 hover:bg-green-500 hover:text-black transition-all disabled:opacity-50 mx-auto"
                                        >
                                            {isGeneratingCard ? (
                                                <>
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <ImageIcon size={14} />
                                                    Generate Player Card
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, playerId: null, playerName: '' })}
        onConfirm={confirmDeletePlayer}
        title="Delete Player"
        message={`Are you sure you want to delete ${deleteConfirm.playerName}? This action cannot be undone and all player data will be permanently removed.`}
        confirmText="Delete Player"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default SquadView;
