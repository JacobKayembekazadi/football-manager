
import React from 'react';
import { Fixture, Club, ContentItem } from '../types';
import { X, BarChart3, Share2, Globe, TrendingUp, Activity, Award } from 'lucide-react';
import ContentCard from './ContentCard';

interface MatchReportModalProps {
  fixture: Fixture;
  club: Club;
  reportContent?: ContentItem;
  socialContent?: ContentItem;
  onClose: () => void;
}

const MatchReportModal: React.FC<MatchReportModalProps> = ({ 
  fixture, 
  club, 
  reportContent, 
  socialContent, 
  onClose 
}) => {
  const isHome = fixture.venue === 'Home';
  const homeScore = isHome ? fixture.result_home : fixture.result_away;
  const awayScore = isHome ? fixture.result_away : fixture.result_home;
  
  // Use real stats if available, otherwise mock for visual fallback (only in this view for impact)
  const stats = fixture.stats || {
      home_possession: 50,
      away_possession: 50,
      home_shots: 0,
      away_shots: 0,
      home_xg: 0,
      away_xg: 0
  };

  const getResultColor = () => {
     const us = isHome ? homeScore : awayScore;
     const them = isHome ? awayScore : homeScore;
     if ((us || 0) > (them || 0)) return 'text-green-500';
     if ((us || 0) < (them || 0)) return 'text-red-500';
     return 'text-slate-200';
  };

  const getResultText = () => {
     const us = isHome ? homeScore : awayScore;
     const them = isHome ? awayScore : homeScore;
     if ((us || 0) > (them || 0)) return 'VICTORY';
     if ((us || 0) < (them || 0)) return 'DEFEAT';
     return 'DRAW';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose}></div>
        
        <div className="relative w-full max-w-5xl h-[95vh] md:h-[90vh] bg-[#050505] rounded-2xl md:rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,243,255,0.1)] flex flex-col">

            {/* Header / Hero */}
            <div className="relative h-40 md:h-64 overflow-hidden border-b border-white/10 flex items-center justify-center shrink-0">
                 {/* Animated BG */}
                 <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-20"></div>
                 <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.6)]"></div>
                 
                 <div className="relative z-10 flex flex-col items-center w-full px-4">
                     <span className={`text-6xl md:text-[10rem] font-display font-bold leading-none opacity-10 absolute select-none ${getResultColor()}`}>
                         {getResultText()}
                     </span>

                     <div className="flex items-center justify-between w-full max-w-3xl px-2 md:px-8 relative z-20">
                         {/* Home Team */}
                         <div className="text-center w-1/3">
                             <h2 className={`text-lg md:text-4xl font-display font-bold truncate ${isHome ? 'text-blue-400' : 'text-white'}`}>
                                 {isHome ? club.name : fixture.opponent}
                             </h2>
                             {isHome && <span className="text-[10px] md:text-xs font-mono text-blue-400 uppercase tracking-widest">[HOME]</span>}
                         </div>

                         {/* Scoreboard */}
                         <div className="flex items-center gap-2 md:gap-6">
                             <span className="text-5xl md:text-8xl font-display font-bold text-white shadow-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                 {homeScore}
                             </span>
                             <span className="text-lg md:text-2xl font-mono text-slate-500">-</span>
                             <span className="text-5xl md:text-8xl font-display font-bold text-white shadow-xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                                 {awayScore}
                             </span>
                         </div>

                         {/* Away Team */}
                         <div className="text-center w-1/3">
                             <h2 className={`text-lg md:text-4xl font-display font-bold truncate ${!isHome ? 'text-blue-400' : 'text-white'}`}>
                                 {!isHome ? club.name : fixture.opponent}
                             </h2>
                             {!isHome && <span className="text-[10px] md:text-xs font-mono text-blue-400 uppercase tracking-widest">[AWAY]</span>}
                         </div>
                     </div>
                     
                     <div className="mt-4 md:mt-8 flex flex-wrap justify-center gap-2 md:gap-4 text-[10px] md:text-xs font-mono text-slate-400">
                         <span className="flex items-center gap-1"><Globe size={12} /> {fixture.venue.toUpperCase()}</span>
                         <span className="text-slate-600">|</span>
                         <span className="flex items-center gap-1"><Award size={12} /> {fixture.competition?.toUpperCase()}</span>
                     </div>
                 </div>

                 <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors z-50">
                     <X size={24} />
                 </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
                <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
                    
                    {/* Left: Report Narrative */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="flex items-center gap-2 mb-2">
                             <Activity size={18} className="text-blue-400" />
                             <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest">Match Analysis</h3>
                        </div>
                        
                        {reportContent ? (
                            <div className="glass-card p-8 rounded-2xl relative overflow-hidden group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-transparent"></div>
                                <div className="prose prose-invert prose-lg max-w-none font-sans leading-relaxed text-slate-200">
                                    <div className="whitespace-pre-line">{reportContent.body}</div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-white/5 flex justify-between items-center text-xs font-mono text-slate-500">
                                    <span>AI MODEL: GEMINI-1.5-FLASH</span>
                                    <span>GENERATED: {new Date(reportContent.created_at).toLocaleTimeString()}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel p-12 text-center border-dashed border-slate-700 rounded-2xl">
                                <p className="text-slate-500 font-mono">Report data corrupted or missing.</p>
                            </div>
                        )}

                        {/* Social Preview */}
                         <div className="mt-8">
                            <div className="flex items-center gap-2 mb-4">
                                <Share2 size={18} className="text-amber-500" />
                                <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest">Social Media Protocol</h3>
                            </div>
                            <div className="grid gap-4">
                                {socialContent && (
                                    <ContentCard item={socialContent} />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: Visual Stats */}
                    <div className="lg:col-span-5 space-y-6">
                         <div className="flex items-center gap-2 mb-2">
                             <BarChart3 size={18} className="text-green-500" />
                             <h3 className="text-lg font-display font-bold text-white uppercase tracking-widest">Telemetry</h3>
                        </div>

                        <div className="glass-card p-6 rounded-2xl space-y-8">
                            {/* Possession */}
                            <div>
                                <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                                    <span>{isHome ? club.name : fixture.opponent}</span>
                                    <span className="text-white font-bold uppercase">Possession</span>
                                    <span>{!isHome ? club.name : fixture.opponent}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-display font-bold text-white w-12 text-right">{stats.home_possession}%</span>
                                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden flex">
                                        <div style={{ width: `${stats.home_possession}%` }} className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                                        <div style={{ width: `${stats.away_possession}%` }} className="h-full bg-slate-700"></div>
                                    </div>
                                    <span className="text-2xl font-display font-bold text-slate-400 w-12">{stats.away_possession}%</span>
                                </div>
                            </div>

                            {/* Shots */}
                             <div>
                                <div className="flex justify-between text-xs font-mono text-slate-400 mb-2">
                                    <span>{isHome ? club.name : fixture.opponent}</span>
                                    <span className="text-white font-bold uppercase">Total Shots</span>
                                    <span>{!isHome ? club.name : fixture.opponent}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-2xl font-display font-bold text-white w-12 text-right">{stats.home_shots}</span>
                                    <div className="flex-1 flex gap-1 h-8 items-end justify-center relative">
                                        {/* Simple visualization of shots comparison */}
                                        <div className="w-1/2 flex justify-end gap-1 items-end border-r border-white/10 pr-2">
                                            <div style={{ height: `${Math.min(100, (stats.home_shots / 20) * 100)}%` }} className="w-4 bg-blue-500 rounded-t-sm shadow-[0_0_5px_rgba(59,130,246,0.5)]"></div>
                                        </div>
                                        <div className="w-1/2 flex justify-start gap-1 items-end pl-2">
                                            <div style={{ height: `${Math.min(100, (stats.away_shots / 20) * 100)}%` }} className="w-4 bg-slate-700 rounded-t-sm"></div>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-display font-bold text-slate-400 w-12">{stats.away_shots}</span>
                                </div>
                            </div>
                            
                            {/* Momentum Chart (Mock Visualization) */}
                            <div className="pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2 mb-4">
                                    <TrendingUp size={14} className="text-purple-500" />
                                    <span className="text-xs font-mono text-slate-400 uppercase">Match Momentum</span>
                                </div>
                                <div className="h-24 w-full flex items-end gap-1 opacity-80">
                                    {Array.from({length: 45}).map((_, i) => {
                                        // Generate fake momentum data
                                        const height = 20 + Math.random() * 60;
                                        const isUs = Math.random() > 0.4; // Slightly biased
                                        return (
                                            <div 
                                                key={i} 
                                                style={{ height: `${height}%` }} 
                                                className={`flex-1 rounded-t-[1px] ${isUs ? 'bg-purple-500' : 'bg-slate-800'}`}
                                            ></div>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-2">
                                    <span>0'</span>
                                    <span>HT</span>
                                    <span>90'</span>
                                </div>
                            </div>

                        </div>
                        
                        {/* Key Events */}
                        <div className="glass-card p-6 rounded-2xl">
                            <h3 className="text-sm font-bold font-display text-white uppercase tracking-widest mb-4">Timeline Events</h3>
                            <div className="space-y-4">
                                {fixture.scorers?.map((scorer, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <span className="text-green-500 font-mono text-xs">GOAL</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        <span className="text-white font-bold text-sm">{scorer}</span>
                                    </div>
                                ))}
                                {fixture.key_events && (
                                     <div className="mt-4 pt-4 border-t border-white/5">
                                         <p className="text-xs text-slate-400 font-mono leading-relaxed">
                                             "{fixture.key_events}"
                                         </p>
                                     </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default MatchReportModal;
