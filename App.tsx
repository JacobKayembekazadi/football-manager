
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import ContentCard from './components/ContentCard';
import ContentEditorModal from './components/ContentEditorModal';
import AutoPublisher from './components/AutoPublisher';
import ViralScout from './components/ViralScout';
import SquadView from './components/SquadView';
import AiAssistant from './components/AiAssistant';
import MatchReportModal from './components/MatchReportModal';
import SponsorNexus from './components/SponsorNexus';
import CommsArray from './components/CommsArray';
import SettingsView from './components/SettingsView';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ImageGeneratorModal from './components/ImageGeneratorModal';
import OnboardingManager from './components/OnboardingManager';
import EducationView from './components/EducationView';
import FixtureFormModal from './components/FixtureFormModal';
import QuickStartChecklist from './components/QuickStartChecklist';
import DemoDataBanner from './components/DemoDataBanner';
import { handleError } from './utils/errorHandler';
import { 
  Fixture, ContentItem, Club, MOCK_CLUB, MatchStats,
  Sponsor,
  INITIAL_FIXTURES, INITIAL_CONTENT, INITIAL_SPONSORS,
  ContentGenStatus
} from './types';
import { generateContent, generateOpponentReport, suggestScorers } from './services/geminiService';
import { scheduleContentSequence } from './services/contentSequenceService';
import { useSupabaseQuery } from './hooks/useSupabaseQuery';
import { useRealtimeSubscription } from './hooks/useRealtimeSubscription';
import { getClub } from './services/clubService';
import { getFixtures } from './services/fixtureService';
import { getContentItems, createContentItem, deleteContentItem } from './services/contentService';
import { getSponsors } from './services/sponsorService';
import { updateFixture, createFixture, deleteFixture } from './services/fixtureService';
import { hasRealData, hasDemoData } from './services/dataPresenceService';
import { seedDemoData } from './services/mockDataService';
import { getLatestFanSentiment, refreshFanSentiment } from './services/fanSentimentService';
import type { FanSentiment } from './types';
import AuthScreen from './components/AuthScreen';
import WorkspaceGate from './components/WorkspaceGate';
import { supabase, isSupabaseConfigured as isSupabaseConfiguredFn } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { 
  Sparkles, 
  MapPin, 
  Loader2, 
  ArrowRight, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Zap,
  Target,
  X,
  FileText,
  Wand2,
  PieChart,
  Trash2,
  Plus,
  CloudRain,
  Wind,
  Thermometer,
  Activity,
  AlertTriangle,
  Briefcase,
  ShieldAlert,
  Calendar,
  Layers,
  Archive,
  Megaphone,
  Palette,
  Quote,
  Sliders,
  Image as ImageIcon
} from 'lucide-react';

// --- Sub-Components for Dashboard ---

const NewsTicker: React.FC = () => {
  return (
    <div className="w-full bg-black/60 border-y border-white/5 h-8 flex items-center overflow-hidden relative z-20 mb-6 backdrop-blur-sm">
      <div className="absolute left-0 bg-neon-blue px-2 h-full flex items-center z-10">
        <span className="text-[10px] font-black text-black uppercase tracking-widest">LIVE FEED</span>
      </div>
      <div className="whitespace-nowrap animate-float flex items-center gap-8 px-4" style={{ animation: 'marquee 20s linear infinite' }}>
         {[
           "BREAKING: Marcus Thorn form hits career high (9.1) after hat-trick.",
           "SCANDAL: Orbital United manager sacked after 3-1 defeat.",
           "TRANSFER: Rumors circulating about a bid for Sam Miller.",
           "WEATHER: Heavy rain predicted for next fixture at Titan Rovers.",
           "FANS: Season ticket sales up 12% following recent win streak.",
           "TACTICS: AI suggesting 3-5-2 formation shift to counter Quantum FC."
         ].map((item, i) => (
           <span key={i} className="text-xs font-mono text-slate-400 flex items-center gap-2">
             <span className="w-1.5 h-1.5 bg-neon-blue/50 rounded-full"></span>
             {item}
           </span>
         ))}
      </div>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
};

const MomentumChart = () => (
  <svg className="w-full h-full absolute inset-0 opacity-20 pointer-events-none" preserveAspectRatio="none">
    <path d="M0,100 C150,100 200,50 350,80 C500,110 600,20 800,40 L800,200 L0,200 Z" fill="url(#grad1)" />
    <path d="M0,100 C150,100 200,50 350,80 C500,110 600,20 800,40" stroke="#00f3ff" strokeWidth="2" fill="none" className="drop-shadow-[0_0_10px_#00f3ff]" />
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#00f3ff', stopOpacity: 0.2 }} />
        <stop offset="100%" style={{ stopColor: '#00f3ff', stopOpacity: 0 }} />
      </linearGradient>
    </defs>
  </svg>
);

const WinProbability: React.FC<{ opponent: string }> = ({ opponent }) => {
  // Mock probability calculation
  const winProb = 68;
  const drawProb = 20;
  
  return (
    <div className="glass-card p-5 rounded-2xl border-neon-blue/20 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4 relative z-10">
          <span className="text-[10px] font-mono text-slate-400 uppercase">AI Prediction Engine</span>
          <Activity size={16} className="text-neon-blue" />
      </div>
      
      <div className="flex items-center gap-4 relative z-10">
         <div className="relative w-20 h-20 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
               <circle cx="40" cy="40" r="36" stroke="#1e293b" strokeWidth="8" fill="transparent" />
               <circle cx="40" cy="40" r="36" stroke="#00f3ff" strokeWidth="8" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * winProb) / 100} className="transition-all duration-1000 shadow-[0_0_10px_#00f3ff]" />
            </svg>
            <span className="absolute text-xl font-bold text-white">{winProb}%</span>
         </div>
         <div className="flex flex-col">
             <span className="text-xs font-bold text-white uppercase mb-1">Victory Likely</span>
             <span className="text-[10px] text-slate-400 font-mono">Vs {opponent}</span>
             <div className="flex items-center gap-2 mt-2">
                 <div className="h-1 w-12 bg-slate-700 rounded-full overflow-hidden">
                    <div style={{width: `${drawProb}%`}} className="h-full bg-slate-400"></div>
                 </div>
                 <span className="text-[9px] text-slate-500 uppercase">Draw Chance</span>
             </div>
         </div>
      </div>
    </div>
  );
};

const WeatherWidget: React.FC = () => {
    return (
        <div className="glass-card p-5 rounded-2xl border-neon-purple/20 flex flex-col justify-between">
             <div className="flex justify-between items-start mb-2">
                 <span className="text-[10px] font-mono text-slate-400 uppercase">Field Conditions</span>
                 <CloudRain size={16} className="text-neon-purple" />
             </div>
             <div className="flex items-center justify-between mt-2">
                 <div>
                     <span className="text-3xl font-display font-bold text-white">12°C</span>
                     <p className="text-[10px] text-slate-400 uppercase font-mono mt-1">Light Rain</p>
                 </div>
                 <div className="space-y-1">
                     <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
                         <Wind size={10} className="text-neon-blue" /> 14 km/h NW
                     </div>
                     <div className="flex items-center gap-2 text-[10px] text-slate-300 font-mono">
                         <Thermometer size={10} className="text-red-400" /> 82% Hum
                     </div>
                 </div>
             </div>
             <div className="mt-3 pt-3 border-t border-white/5">
                 <p className="text-[10px] text-neon-purple font-mono animate-pulse">
                     ADVISORY: Slick surface favors fast passing.
                 </p>
             </div>
        </div>
    )
}

// --- Dashboard Component (Futuristic Command Center) ---
const Dashboard: React.FC<{ 
  fixtures: Fixture[], 
  contentItems: ContentItem[],
  club: Club,
  onNavigate: (tab: string) => void,
  onRunScout: () => Promise<void>,
  hasCompletedEducation?: boolean
}> = ({ fixtures, contentItems, club, onNavigate, onRunScout, hasCompletedEducation }) => {
  const upcoming = fixtures.filter(f => f.status === 'SCHEDULED');
  const [isInitiating, setIsInitiating] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [isAnalyzingOpponent, setIsAnalyzingOpponent] = useState(false);
  const [opponentAnalysis, setOpponentAnalysis] = useState<string | null>(null);
  const [showImageGenerator, setShowImageGenerator] = useState(false);
  const [fanSentiment, setFanSentiment] = useState<FanSentiment | null>(null);
  const [isRefreshingSentiment, setIsRefreshingSentiment] = useState(false);

  const handleInitiateProtocol = async () => {
      setIsInitiating(true);
      await onRunScout();
      setIsInitiating(false);
      onNavigate('content');
  };

  const handleViewAnalysis = async () => {
      if (!upcoming[0]) return;
      
      setShowAnalysisModal(true);
      if (!opponentAnalysis) {
          setIsAnalyzingOpponent(true);
          const report = await generateOpponentReport(club, upcoming[0].opponent);
          setOpponentAnalysis(report);
          setIsAnalyzingOpponent(false);
      }
  };

  // Fetch fan sentiment on mount
  useEffect(() => {
    const fetchSentiment = async () => {
      if (!club?.id) return;
      try {
        const sentiment = await getLatestFanSentiment(club.id);
        setFanSentiment(sentiment);
      } catch (error) {
        console.error('Error fetching fan sentiment:', error);
        // Fallback to mock data handled by service
      }
    };
    fetchSentiment();
  }, [club?.id]);

  const handleRefreshSentiment = async () => {
    if (!club?.id || !club?.name || !club?.org_id || isRefreshingSentiment) return;
    
    setIsRefreshingSentiment(true);
    try {
      const refreshed = await refreshFanSentiment(club.id, club.name, club.org_id || '');
      setFanSentiment(refreshed);
    } catch (error) {
      console.error('Error refreshing fan sentiment:', error);
      handleError(error, 'Failed to refresh fan sentiment');
    } finally {
      setIsRefreshingSentiment(false);
    }
  };

  // Calculate display values
  const sentimentScore = fanSentiment?.sentiment_score ?? 92;
  const sentimentMood = fanSentiment?.sentiment_mood?.toUpperCase() ?? 'EUPHORIC';
  const moodColor = 
    sentimentScore >= 80 ? 'text-green-400' :
    sentimentScore >= 60 ? 'text-blue-400' :
    sentimentScore >= 40 ? 'text-yellow-400' :
    sentimentScore >= 20 ? 'text-orange-400' :
    'text-red-400';
  
  return (
    <div className="space-y-6 pb-8">
      <NewsTicker />

      {/* Hero / Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Status Card */}
        <div className="lg:col-span-2 glass-panel p-8 rounded-3xl relative overflow-hidden group border border-neon-blue/30">
            {/* Background Chart */}
            <MomentumChart />
            
            <div className="absolute top-0 right-0 w-64 h-64 bg-neon-blue/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            
            <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                        <span className="text-xs font-mono text-green-400 tracking-widest uppercase">System Optimal // Season Week 14</span>
                    </div>
                    <h2 className="text-5xl font-display font-bold text-white mb-2 glow-text tracking-tight">COMMAND <br />CENTER</h2>
                    <p className="text-slate-300 max-w-lg mb-8 font-mono text-sm border-l-2 border-neon-blue pl-4">
                        <span className="text-neon-blue font-bold">LATEST:</span> Opponent analysis for {upcoming[0]?.opponent || 'Next Match'} is ready for review. Tactical adjustments recommended based on weather patterns.
                    </p>
                </div>
                
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={handleInitiateProtocol} 
                        disabled={isInitiating}
                        className="px-8 py-4 bg-gradient-to-r from-neon-blue to-blue-600 text-white font-bold font-display uppercase rounded-lg shadow-[0_0_30px_rgba(0,243,255,0.3)] hover:shadow-[0_0_50px_rgba(0,243,255,0.5)] transition-all hover:scale-105 active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:scale-100 relative overflow-hidden group/btn"
                    >
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        {isInitiating ? <Loader2 size={20} className="animate-spin" /> : <Zap size={20} className="fill-white" />}
                        {isInitiating ? 'Processing Data...' : 'Initiate Weekly Protocol'}
                    </button>
                    <button onClick={() => onNavigate('fixtures')} className="px-6 py-4 bg-black/40 border border-white/20 text-white font-bold font-display uppercase rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 backdrop-blur-md">
                        <Trophy size={18} /> Log Match Result
                    </button>
                </div>
            </div>
        </div>

        {/* Next Match Countdown Widget */}
        <div className="glass-card p-6 rounded-3xl flex flex-col justify-between border-t-4 border-t-neon-pink relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
            <div className="absolute inset-0 bg-gradient-to-b from-neon-pink/5 to-transparent"></div>
            <div>
                <div className="flex justify-between items-start">
                    <span className="text-xs font-mono text-neon-pink uppercase tracking-widest">Next Engagement</span>
                    <div className="px-2 py-0.5 rounded bg-neon-pink/10 border border-neon-pink/30 text-[9px] font-bold text-neon-pink uppercase">League Match</div>
                </div>
                <h3 className="text-3xl font-display font-bold text-white mt-4">{upcoming[0]?.opponent || 'TBD'}</h3>
                <p className="text-slate-400 text-sm flex items-center gap-1 mt-1 font-mono uppercase"><MapPin size={12} /> {upcoming[0]?.venue || 'Unknown'} Sector</p>
            </div>
            
            <div className="mt-8 space-y-4">
                 <div className="flex gap-2">
                    {['02', '14', '35', '12'].map((time, i) => (
                        <div key={i} className="flex-1 bg-black/60 rounded-lg py-2 text-center border border-white/5 shadow-inner">
                            <span className="block text-2xl font-display font-bold text-white tracking-wider">{time}</span>
                            <span className="text-[7px] text-slate-500 uppercase font-mono tracking-widest">{['Days', 'Hrs', 'Min', 'Sec'][i]}</span>
                        </div>
                    ))}
                </div>
                <button
                    onClick={() => setShowImageGenerator(true)}
                    className="w-full py-2.5 bg-neon-purple/10 border border-neon-purple/50 text-neon-purple rounded-lg text-xs font-bold uppercase hover:bg-neon-purple/20 transition-all flex items-center justify-center gap-2"
                >
                    <ImageIcon size={14} />
                    Generate Matchday Graphic
                </button>
            </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {/* Sentiment Gauge */}
         <div className="glass-card p-5 rounded-2xl border-neon-blue/20">
             <div className="flex justify-between items-start mb-4">
                 <span className="text-[10px] font-mono text-slate-400 uppercase">Fan Sentiment</span>
                 <div className="flex items-center gap-2">
                   <button
                     onClick={handleRefreshSentiment}
                     disabled={isRefreshingSentiment}
                     className="text-slate-400 hover:text-neon-blue transition-colors disabled:opacity-50"
                     title="Refresh sentiment"
                   >
                     {isRefreshingSentiment ? (
                       <Loader2 size={14} className="animate-spin" />
                     ) : (
                       <TrendingUp size={16} className="text-neon-green" />
                     )}
                   </button>
                 </div>
             </div>
             <div className="relative h-28 flex items-center justify-center">
                 {/* CSS Gauge Simulation */}
                 <div className="w-24 h-12 border-t-[10px] border-l-[10px] border-r-[10px] border-neon-blue rounded-t-full border-b-0 absolute top-4 opacity-20"></div>
                 <div className="w-24 h-12 border-t-[10px] border-l-[10px] border-r-[10px] border-neon-green rounded-t-full border-b-0 absolute top-4" style={{clipPath: `polygon(0 0, ${sentimentScore}% 0, ${sentimentScore}% 100%, 0 100%)`, transform: 'rotate(-45deg)', transformOrigin: 'bottom center'}}></div>
                 <div className="absolute bottom-4 flex flex-col items-center">
                    <span className="text-4xl font-display font-bold text-white">{sentimentScore}%</span>
                    <span className={`text-[9px] ${moodColor} font-mono tracking-widest uppercase`}>{sentimentMood}</span>
                 </div>
             </div>
             <div className="w-full bg-white/5 rounded-full h-1 mt-1">
                 <div className={`h-full bg-gradient-to-r from-neon-blue to-neon-green rounded-full transition-all duration-500`} style={{ width: `${sentimentScore}%` }}></div>
             </div>
             {fanSentiment && (
               <div className="mt-2 text-[9px] text-slate-500 font-mono">
                 {fanSentiment.total_mentions} mentions • {fanSentiment.data_source}
               </div>
             )}
         </div>

         {/* Win Probability Widget */}
         <WinProbability opponent={upcoming[0]?.opponent || 'Next Opponent'} />

         {/* Weather Widget */}
         <WeatherWidget />

      </div>

       {/* Secondary Metrics / Sponsor Widget (NEW) */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card p-5 rounded-2xl border-yellow-400/20 cursor-pointer hover:border-yellow-400/40 transition-colors" onClick={() => onNavigate('commercial')}>
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Commercial Status</span>
                    <Briefcase size={16} className="text-yellow-400" />
                </div>
                 <div className="mt-4">
                     <div className="flex justify-between items-center mb-1">
                         <span className="text-2xl font-display font-bold text-white">96%</span>
                         <span className="text-[10px] text-green-400 font-mono">ON TARGET</span>
                     </div>
                     <p className="text-[10px] text-slate-500 font-mono">Revenue Projection: £275k</p>
                 </div>
            </div>

            {/* Next Opponent Analysis */}
            <div className="lg:col-span-3 glass-card p-5 rounded-2xl border-white/10 relative overflow-hidden group hover:border-red-500/30 transition-colors cursor-pointer" onClick={handleViewAnalysis}>
                <div className="absolute inset-0 bg-noise opacity-10"></div>
                <div className="flex justify-between items-start mb-4 relative z-10">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">Opponent Intel</span>
                    <span className="text-xs font-bold text-white bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 animate-pulse">HIGH THREAT</span>
                </div>
                <div className="relative z-10">
                    <div className="text-lg font-bold text-white truncate">{upcoming[0]?.opponent}</div>
                    <div className="text-xs text-slate-400 mt-1 font-mono">Form: <span className="text-green-400">W</span>-L-<span className="text-green-400">W</span>-<span className="text-green-400">W</span>-D</div>
                    
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-700 border border-black" title="Key Player 1"></div>
                            <div className="w-6 h-6 rounded-full bg-slate-600 border border-black" title="Key Player 2"></div>
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-black flex items-center justify-center text-[8px] text-white font-mono">+2</div>
                        </div>
                        <button 
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors group-hover:bg-red-500/20 group-hover:text-red-400"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            </div>
       </div>

      {/* Quick Start + Content Feed Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
              {/* Quick Start Checklist */}
              <QuickStartChecklist
                players={club.players}
                fixtures={fixtures}
                contentItems={contentItems}
                hasCompletedEducation={hasCompletedEducation}
                onNavigate={onNavigate}
              />
              
              {/* Content Feed */}
              <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-neon-blue rounded-full"></span>
                          Latest Content Generations
                      </h3>
                      <button onClick={() => onNavigate('fixtures')} className="text-xs font-mono text-neon-blue hover:text-white transition-colors flex items-center gap-1 border border-neon-blue/30 px-3 py-1 rounded-full hover:bg-neon-blue/10">
                          VIEW ALL <ArrowRight size={12} />
                      </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {contentItems.slice(0, 2).map(item => {
                          const fixture = fixtures.find(f => f.id === item.fixture_id);
                          return <ContentCard key={item.id} item={item} fixture={fixture} />;
                      })}
                       {contentItems.length === 0 && (
                            <div className="col-span-2 text-center py-12 glass-panel rounded-xl border-dashed border-slate-700">
                                <p className="text-slate-500 font-mono text-sm">NO DATA IN STREAM.</p>
                            </div>
                        )}
                  </div>
              </div>

              {/* Viral Scout Widget */}
              <ViralScout club={club} />
          </div>
          
          {/* Live Feed Mockup (Terminal Style) */}
          <div className="glass-card rounded-2xl p-0 border-l-2 border-l-neon-green overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-white/5 bg-black/40 flex justify-between items-center">
                  <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider">System Log</h3>
                  <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                  </div>
              </div>
              <div className="p-4 space-y-4 relative flex-1 font-mono text-xs bg-black/20">
                  <div className="absolute left-[19px] top-4 bottom-4 w-[1px] bg-slate-800"></div>
                  {[
                      { time: '10:42:05', text: 'Social sentiment analysis complete. Trend: POSITIVE.', color: 'text-neon-green', icon: Zap },
                      { time: '09:15:22', text: 'Opponent tactical profile updated [v2.4].', color: 'text-white', icon: Target },
                      { time: '08:30:00', text: 'Daily briefing generated for coaching staff.', color: 'text-slate-400', icon: FileText },
                      { time: '08:00:00', text: 'System boot sequence initiated.', color: 'text-slate-500', icon: Activity },
                  ].map((log, i) => (
                      <div key={i} className="flex gap-4 relative z-10 group">
                          <div className={`w-6 h-6 rounded-full border border-black flex items-center justify-center ${i === 0 ? 'bg-neon-green text-black animate-pulse' : 'bg-slate-800 text-slate-400'} shadow-lg z-20`}>
                             <log.icon size={10} />
                          </div>
                          <div className="flex-1">
                              <div className="flex justify-between">
                                  <span className={`font-bold ${log.color}`}>{i===0 ? '>> ' : ''}{log.text}</span>
                              </div>
                              <p className="text-[10px] font-mono text-slate-600 mt-0.5">{log.time}</p>
                          </div>
                      </div>
                  ))}
                  <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-black/20 to-transparent"></div>
              </div>
          </div>
      </div>

      {/* Opponent Analysis Modal */}
      {showAnalysisModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowAnalysisModal(false)}></div>
              <div className="relative bg-[#0a0a0a] w-full max-w-2xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[85vh]">
                  <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                              <Target size={20} />
                          </div>
                          <div>
                              <h3 className="font-display font-bold text-white text-lg">TACTICAL BRIEFING</h3>
                              <p className="text-xs font-mono text-red-400 tracking-widest">CLASSIFIED // EYES ONLY</p>
                          </div>
                      </div>
                      <button onClick={() => setShowAnalysisModal(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                  </div>
                  
                  <div className="p-8 overflow-y-auto custom-scrollbar">
                      {isAnalyzingOpponent ? (
                          <div className="flex flex-col items-center justify-center py-12">
                              <Loader2 size={40} className="text-neon-blue animate-spin mb-4" />
                              <p className="text-neon-blue font-mono text-sm animate-pulse tracking-widest">DECRYPTING OPPONENT DATA STREAM...</p>
                          </div>
                      ) : (
                          <div className="prose prose-invert prose-sm max-w-none font-mono">
                              <div className="whitespace-pre-line leading-relaxed text-slate-300">
                                  {opponentAnalysis}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-4 bg-black/50 border-t border-white/10 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                          <AlertTriangle size={12} className="text-yellow-500" />
                          CONFIDENTIALITY LEVEL: HIGH
                      </div>
                      <button onClick={() => setShowAnalysisModal(false)} className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-bold text-white uppercase transition-colors border border-white/5">
                          Close Briefing
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Image Generator Modal */}
      {showImageGenerator && (
          <ImageGeneratorModal
              club={club}
              fixtures={fixtures}
              onClose={() => setShowImageGenerator(false)}
          />
      )}
    </div>
  );
};

// --- The Hype Engine Component ---
const HypeEngine: React.FC<{
  fixtures: Fixture[],
  club: Club,
  contentItems: ContentItem[],
  onRefetchFixtures: () => Promise<void>,
  onGenerateReport: (fixtureId: string, resultHome: number, resultAway: number, notes: string, scorers: string[], stats: MatchStats, motm: string, vibe: string, quote: string) => void,
  onGenerateHype: (fixture: Fixture, context: { matchType: string }) => Promise<void>,
  onCreateFixture: (fixture: Omit<Fixture, 'id'>) => Promise<void>,
  onDeleteFixture: (fixtureId: string) => Promise<void>,
  onUpdateContent: (updatedItem: ContentItem) => Promise<void>,
  onDeleteContent: (contentId: string) => Promise<void>
}> = ({ fixtures, club, contentItems, onRefetchFixtures, onGenerateReport, onGenerateHype, onCreateFixture, onDeleteFixture, onUpdateContent, onDeleteContent }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'archive'>('upcoming');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [selectedFixtureForReport, setSelectedFixtureForReport] = useState<Fixture | null>(null);
    const [isFixtureModalOpen, setIsFixtureModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedContentFixture, setExpandedContentFixture] = useState<string | null>(null);
    const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(null);
    
    const approvedItems = contentItems.filter(item => item.status === 'APPROVED');
    
    // Log Result States
    const [scoreHome, setScoreHome] = useState('');
    const [scoreAway, setScoreAway] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedScorers, setSelectedScorers] = useState<string[]>([]);
    const [homePossession, setHomePossession] = useState(50);
    const [homeShots, setHomeShots] = useState(0);
    const [awayShots, setAwayShots] = useState(0);
    
    // NEW Log Result States
    const [motm, setMotm] = useState('');
    const [gameVibe, setGameVibe] = useState('Competitive');
    const [managerQuote, setManagerQuote] = useState('');

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuggestingScorers, setIsSuggestingScorers] = useState(false);

    // Hype Protocol States
    const [hypeContexts, setHypeContexts] = useState<Record<string, string>>({});
    const [generatingHypeId, setGeneratingHypeId] = useState<string | null>(null);

    const handleSaveResult = async (fixtureId: string) => {
        setIsProcessing(true);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Cinematic delay
        
        const h = parseInt(scoreHome);
        const a = parseInt(scoreAway);

        const stats: MatchStats = {
            home_possession: homePossession,
            away_possession: 100 - homePossession,
            home_shots: homeShots,
            away_shots: awayShots
        };

        // Generate report (this will update fixture in database)
        await onGenerateReport(fixtureId, h, a, notes, selectedScorers, stats, motm, gameVibe, managerQuote);
        
        // Refetch fixtures to get updated data
        await onRefetchFixtures();
        
        setEditingId(null);
        setIsProcessing(false);
        resetForm();
    };

    const resetForm = () => {
        setScoreHome('');
        setScoreAway('');
        setNotes('');
        setSelectedScorers([]);
        setHomePossession(50);
        setHomeShots(0);
        setAwayShots(0);
        setMotm('');
        setGameVibe('Competitive');
        setManagerQuote('');
    }

    const toggleScorer = (name: string) => {
        if (selectedScorers.includes(name)) {
            setSelectedScorers(prev => prev.filter(s => s !== name));
        } else {
            setSelectedScorers(prev => [...prev, name]);
        }
    }

    const handleSuggestScorers = async (fixture: Fixture) => {
        const venueIsHome = fixture.venue === 'Home';
        const myScore = venueIsHome ? parseInt(scoreHome) : parseInt(scoreAway);
        
        if (isNaN(myScore) || myScore <= 0) return;

        setIsSuggestingScorers(true);
        const suggestedNames = await suggestScorers(club, fixture.opponent, myScore, notes);
        
        if (suggestedNames && suggestedNames.length > 0) {
            setSelectedScorers(prev => [...new Set([...prev, ...suggestedNames])]);
        }
        setIsSuggestingScorers(false);
    }

    const handleHypeGeneration = async (fixture: Fixture) => {
        setGeneratingHypeId(fixture.id);
        const context = hypeContexts[fixture.id] || 'Standard League Match';
        await onGenerateHype(fixture, { matchType: context });
        setGeneratingHypeId(null);
    };

    const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED').sort((a,b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
    const archivedFixtures = fixtures.filter(f => f.status === 'COMPLETED').sort((a,b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime());

    const handleDeleteFixture = async (fixtureId: string) => {
        if (!confirm('Are you sure you want to delete this fixture?')) return;
        setDeletingId(fixtureId);
        try {
            await onDeleteFixture(fixtureId);
            await onRefetchFixtures();
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
             <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white glow-text">THE <span className="text-neon-blue">HYPE ENGINE</span></h2>
                    <p className="text-slate-400 font-mono text-xs mt-1">Automated content campaigns for every matchday.</p>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Schedule Fixture Button */}
                    <button 
                        onClick={() => setIsFixtureModalOpen(true)}
                        data-tour="add-fixture-btn"
                        className="flex items-center gap-2 bg-neon-green/10 border border-neon-green/50 text-neon-green px-5 py-3 rounded-xl font-display font-bold uppercase text-xs hover:bg-neon-green/20 transition-all shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_25px_rgba(0,255,136,0.4)]"
                    >
                        <Plus size={16} /> Schedule Fixture
                    </button>
                    
                    {/* Tabs */}
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                        <button 
                            onClick={() => setActiveTab('upcoming')}
                            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'upcoming' ? 'bg-neon-blue text-black shadow-[0_0_10px_#00f3ff]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Calendar size={14} /> Upcoming Ops
                        </button>
                        <button 
                            onClick={() => setActiveTab('archive')}
                            className={`px-4 py-2 rounded text-xs font-bold uppercase transition-all flex items-center gap-2 ${activeTab === 'archive' ? 'bg-neon-purple text-white shadow-[0_0_10px_#bc13fe]' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Archive size={14} /> Result Archive
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <div className="grid gap-6">
                    
                    {/* UPCOMING OPS VIEW */}
                    {activeTab === 'upcoming' && upcomingFixtures.map(fixture => {
                        const hasPreview = contentItems.some(c => c.fixture_id === fixture.id && c.type === 'PREVIEW');
                        const hasSocial = contentItems.some(c => c.fixture_id === fixture.id && c.type === 'SOCIAL');
                        const hasGraphics = contentItems.some(c => c.fixture_id === fixture.id && c.type === 'GRAPHIC_COPY');
                        const contextValue = hypeContexts[fixture.id] || 'Standard League Match';

                        return (
                            <div key={fixture.id} className="glass-card p-0 rounded-2xl overflow-hidden border border-white/5 relative group">
                                <div className="absolute top-0 left-0 w-1 h-full bg-neon-blue"></div>
                                <div className="p-6 flex flex-col lg:flex-row gap-8 items-center">
                                    
                                    {/* Date & Opponent */}
                                    <div className="flex items-center gap-6 flex-1">
                                        <div className="text-center">
                                            <div className="text-2xl font-display font-bold text-white">{new Date(fixture.kickoff_time).getDate()}</div>
                                            <div className="text-xs font-mono text-neon-blue uppercase">{new Date(fixture.kickoff_time).toLocaleDateString('en-GB', {month: 'short'})}</div>
                                        </div>
                                        <div>
                                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 border border-slate-700 px-2 py-0.5 rounded w-fit">
                                                {fixture.competition}
                                            </div>
                                            <h3 className="text-2xl font-display font-bold text-white">VS {fixture.opponent}</h3>
                                            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                                                <MapPin size={12} /> {fixture.venue.toUpperCase()}
                                                <span className="text-slate-600">|</span>
                                                <Clock size={12} /> {new Date(fixture.kickoff_time).toLocaleTimeString('en-GB', {hour: '2-digit', minute:'2-digit'})}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comms Timeline Widget */}
                                    <div className="flex-1 w-full lg:w-auto">
                                        <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase mb-2">
                                            <span>Comms Schedule</span>
                                            <span>Status: {hasPreview ? 'ACTIVE' : 'PENDING'}</span>
                                        </div>
                                        <div className="relative h-1 bg-white/10 rounded-full flex items-center justify-between px-1">
                                            {[
                                                { label: 'T-48h', done: hasGraphics }, 
                                                { label: 'T-24h', done: hasPreview }, 
                                                { label: 'T-1h', done: hasSocial }
                                            ].map((point, i) => (
                                                <div key={i} className="relative group/point">
                                                    <div className={`w-2.5 h-2.5 rounded-full border border-black ${point.done ? 'bg-neon-green' : 'bg-slate-700'}`}></div>
                                                    <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 font-mono whitespace-nowrap opacity-0 group-hover/point:opacity-100 transition-opacity">{point.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex gap-2 mt-4">
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${hasPreview ? 'text-neon-green border-neon-green/30 bg-neon-green/10' : 'text-slate-500 border-slate-700 bg-slate-800/50'}`}>Preview</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${hasSocial ? 'text-neon-green border-neon-green/30 bg-neon-green/10' : 'text-slate-500 border-slate-700 bg-slate-800/50'}`}>Socials</span>
                                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${hasGraphics ? 'text-neon-green border-neon-green/30 bg-neon-green/10' : 'text-slate-500 border-slate-700 bg-slate-800/50'}`}>Graphics</span>
                                        </div>
                                    </div>

                                    {/* Action Panel */}
                                    <div className="flex flex-col gap-3 w-full lg:w-64">
                                        <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                                            <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Match Context</label>
                                            <select 
                                                value={contextValue}
                                                onChange={(e) => setHypeContexts(prev => ({...prev, [fixture.id]: e.target.value}))}
                                                className="w-full bg-transparent text-xs text-white font-bold uppercase focus:outline-none"
                                            >
                                                <option>Standard League Match</option>
                                                <option>Local Derby</option>
                                                <option>Cup Final</option>
                                                <option>Relegation 6-Pointer</option>
                                                <option>Title Decider</option>
                                            </select>
                                        </div>
                                        
                                        {fixture.id === editingId ? (
                                             <button 
                                                onClick={() => setEditingId(null)} 
                                                className="w-full py-2 bg-slate-800 text-slate-300 font-bold uppercase text-xs rounded hover:bg-slate-700"
                                            >
                                                Close Ops Panel
                                            </button>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleHypeGeneration(fixture)}
                                                        disabled={generatingHypeId === fixture.id}
                                                        className="flex-1 py-2 bg-neon-blue/10 border border-neon-blue/50 text-neon-blue font-bold uppercase text-xs rounded hover:bg-neon-blue hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                    >
                                                        {generatingHypeId === fixture.id ? <Loader2 size={14} className="animate-spin" /> : <Megaphone size={14} />}
                                                        Hype Pack
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingId(fixture.id)}
                                                        className="flex-1 py-2 bg-white/5 border border-white/10 text-white font-bold uppercase text-xs rounded hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Sliders size={14} /> Log Data
                                                    </button>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteFixture(fixture.id)}
                                                    disabled={deletingId === fixture.id}
                                                    className="w-full py-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 font-mono uppercase text-[10px] rounded transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                                                >
                                                    {deletingId === fixture.id ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                                                    Delete Fixture
                                                </button>
                                                <button
                                                    onClick={() => setExpandedContentFixture(expandedContentFixture === fixture.id ? null : fixture.id)}
                                                    className="w-full py-1.5 text-neon-purple/60 hover:text-neon-purple hover:bg-neon-purple/10 font-mono uppercase text-[10px] rounded transition-all flex items-center justify-center gap-1"
                                                >
                                                    <FileText size={10} />
                                                    {expandedContentFixture === fixture.id ? 'Hide' : 'View'} Content
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Content Items Section */}
                                {expandedContentFixture === fixture.id && (
                                    <div className="bg-black/40 border-t border-neon-purple/30 p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-mono text-neon-purple uppercase">Content Campaign</h4>
                                            <span className="text-[10px] font-mono text-slate-500">
                                                {contentItems.filter(c => c.fixture_id === fixture.id).length} assets
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {contentItems
                                                .filter(c => c.fixture_id === fixture.id)
                                                .map(item => (
                                                    <div 
                                                        key={item.id} 
                                                        onClick={() => setSelectedContentItem(item)}
                                                        className="cursor-pointer"
                                                    >
                                                        <ContentCard item={item} fixture={fixture} />
                                                    </div>
                                                ))}
                                            {contentItems.filter(c => c.fixture_id === fixture.id).length === 0 && (
                                                <div className="col-span-3 p-8 text-center border border-dashed border-white/10 rounded-xl">
                                                    <p className="text-slate-500 font-mono text-sm mb-2">No content generated yet</p>
                                                    <button
                                                        onClick={() => handleHypeGeneration(fixture)}
                                                        className="text-xs text-neon-blue hover:text-neon-blue/80 font-mono uppercase"
                                                    >
                                                        Generate Hype Pack →
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* EDITING PANEL (LOG RESULT) */}
                                {editingId === fixture.id && (
                                    <div className="bg-black/60 border-t border-neon-blue/30 p-8 animate-slide-up backdrop-blur-xl">
                                        <div className="max-w-5xl mx-auto">
                                            <div className="flex items-center justify-between mb-8">
                                                <h4 className="text-neon-blue font-mono text-sm uppercase flex items-center gap-2">
                                                    <Zap size={14} /> Post-Match Data Entry
                                                </h4>
                                                <span className="text-[10px] font-mono text-slate-500 uppercase">Secure Uplink Established</span>
                                            </div>
                                            
                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                                {/* 1. Scoreline */}
                                                <div className="lg:col-span-1 bg-black/40 p-6 rounded-xl border border-white/5 flex flex-col justify-center">
                                                    <div className="flex items-center justify-center gap-6">
                                                        <div className="text-center">
                                                            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">US</label>
                                                            <input 
                                                                type="number" 
                                                                value={scoreHome}
                                                                onChange={(e) => setScoreHome(e.target.value)}
                                                                className="w-16 bg-transparent border-b-2 border-slate-600 text-center text-4xl font-display font-bold text-white focus:border-neon-blue outline-none transition-colors"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                        <span className="text-2xl font-mono text-slate-600 mt-4">:</span>
                                                        <div className="text-center">
                                                            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">THEM</label>
                                                            <input 
                                                                type="number" 
                                                                value={scoreAway}
                                                                onChange={(e) => setScoreAway(e.target.value)}
                                                                className="w-16 bg-transparent border-b-2 border-slate-600 text-center text-4xl font-display font-bold text-white focus:border-neon-pink outline-none transition-colors"
                                                                placeholder="0"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* 2. Key Personnel */}
                                                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                     {/* Scorers */}
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <label className="text-[10px] font-mono text-slate-500 uppercase">Goalscorers</label>
                                                            {(parseInt(scoreHome) > 0 || parseInt(scoreAway) > 0) && (
                                                                <button 
                                                                    onClick={() => handleSuggestScorers(fixture)}
                                                                    disabled={isSuggestingScorers}
                                                                    className="text-[10px] text-neon-purple hover:text-white uppercase flex items-center gap-1 transition-colors disabled:opacity-50"
                                                                >
                                                                    {isSuggestingScorers ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                                                    Auto-Suggest
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-wrap gap-2 max-h-[100px] overflow-y-auto custom-scrollbar">
                                                            {club.players.map(player => (
                                                                <button
                                                                    key={player.id}
                                                                    onClick={() => toggleScorer(player.name)}
                                                                    className={`px-3 py-1 text-[10px] rounded border transition-all font-mono ${selectedScorers.includes(player.name) ? 'bg-neon-blue text-black border-neon-blue font-bold' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}
                                                                >
                                                                    {player.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Man of the Match */}
                                                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                                                        <label className="text-[10px] font-mono text-slate-500 uppercase block mb-3">Man of the Match</label>
                                                        <select 
                                                            value={motm}
                                                            onChange={(e) => setMotm(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-neon-blue outline-none"
                                                        >
                                                            <option value="">Select Player...</option>
                                                            {club.players.map(p => (
                                                                <option key={p.id} value={p.name}>{p.name} (#{p.number})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 3. Advanced Metrics & Vibe */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                                     <div className="flex items-center gap-2 mb-4 text-xs font-mono text-slate-400 uppercase">
                                                        <PieChart size={14} /> Possession Control
                                                    </div>
                                                    <div className="flex justify-between text-xs mb-2">
                                                        <span>Us</span>
                                                        <span className="font-bold text-neon-blue">{homePossession}%</span>
                                                    </div>
                                                    <input 
                                                        type="range" 
                                                        min="0" max="100" 
                                                        value={homePossession} 
                                                        onChange={(e) => setHomePossession(parseInt(e.target.value))}
                                                        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-neon-blue"
                                                    />
                                                </div>

                                                <div className="bg-white/5 p-6 rounded-xl border border-white/5">
                                                     <div className="flex items-center gap-2 mb-4 text-xs font-mono text-slate-400 uppercase">
                                                        <Activity size={14} /> Game Intensity (Vibe)
                                                    </div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-xs text-slate-400">{gameVibe}</span>
                                                    </div>
                                                     <div className="flex gap-2">
                                                        {['Boring', 'Tactical', 'Competitive', 'Thriller', 'Chaos'].map(v => (
                                                            <button 
                                                                key={v}
                                                                onClick={() => setGameVibe(v)}
                                                                className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded border ${gameVibe === v ? 'bg-neon-pink text-white border-neon-pink' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                                            >
                                                                {v}
                                                            </button>
                                                        ))}
                                                     </div>
                                                </div>
                                            </div>

                                            {/* 4. Qualitative Data */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                                <div>
                                                    <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Tactical Key Events</label>
                                                    <textarea 
                                                        value={notes}
                                                        onChange={(e) => setNotes(e.target.value)}
                                                        className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 h-24 resize-none focus:border-neon-blue outline-none transition-colors font-mono"
                                                        placeholder="e.g. Red card in 45th min changed the game..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Manager Quote</label>
                                                    <div className="relative">
                                                        <Quote className="absolute top-3 left-3 text-slate-600" size={14} />
                                                        <textarea 
                                                            value={managerQuote}
                                                            onChange={(e) => setManagerQuote(e.target.value)}
                                                            className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-300 h-24 resize-none focus:border-neon-blue outline-none transition-colors font-sans italic"
                                                            placeholder="We showed great character today..."
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <button 
                                                onClick={() => handleSaveResult(fixture.id)}
                                                disabled={!scoreHome || !scoreAway || isProcessing}
                                                className="w-full py-4 bg-gradient-to-r from-neon-blue to-cyan-500 text-black font-display font-bold uppercase tracking-widest rounded hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                                            >
                                                {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                                                {isProcessing ? 'PROCESSING MATCH DATA...' : 'GENERATE FULL MATCH REPORT'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* ARCHIVE VIEW */}
                    {activeTab === 'archive' && archivedFixtures.map(fixture => (
                         <div key={fixture.id} className="glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-neon-purple/30 transition-colors">
                            <div className="flex items-center gap-6">
                                <div className="text-center w-16 opacity-50">
                                    <div className="text-xl font-display font-bold text-slate-300">{new Date(fixture.kickoff_time).getDate()}</div>
                                    <div className="text-[10px] font-mono uppercase">{new Date(fixture.kickoff_time).toLocaleDateString('en-GB', {month: 'short'})}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">{fixture.competition}</div>
                                    <div className="flex items-center gap-4 text-xl font-display font-bold text-white">
                                        <span className={fixture.result_home! > fixture.result_away! ? 'text-neon-green' : ''}>{club.name}</span>
                                        <span className="bg-white/10 px-2 rounded text-base">{fixture.result_home} - {fixture.result_away}</span>
                                        <span className={fixture.result_away! > fixture.result_home! ? 'text-neon-green' : ''}>{fixture.opponent}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setSelectedFixtureForReport(fixture)}
                                className="px-4 py-2 border border-white/10 hover:bg-neon-purple hover:text-white hover:border-neon-purple text-slate-400 rounded transition-all text-xs font-bold uppercase flex items-center gap-2"
                            >
                                <FileText size={14} /> View Report
                            </button>
                         </div>
                    ))}
                    
                    {/* Empty States */}
                    {activeTab === 'upcoming' && upcomingFixtures.length === 0 && (
                        <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl">
                            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400 font-mono mb-4">No fixtures scheduled yet</p>
                            <button 
                                onClick={() => setIsFixtureModalOpen(true)}
                                className="inline-flex items-center gap-2 bg-neon-blue text-black px-6 py-3 rounded-lg font-display font-bold uppercase text-sm hover:shadow-[0_0_20px_rgba(0,243,255,0.35)] transition-all"
                            >
                                <Plus size={16} /> Schedule Your First Match
                            </button>
                        </div>
                    )}
                     {activeTab === 'archive' && archivedFixtures.length === 0 && (
                        <div className="p-12 text-center border border-dashed border-white/10 rounded-2xl">
                            <Archive className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-500 font-mono">No completed matches yet. Results will appear here after logging match outcomes.</p>
                        </div>
                    )}

                </div>
            </div>

            {/* Match Report Modal */}
            {selectedFixtureForReport && (
                <MatchReportModal 
                    fixture={selectedFixtureForReport}
                    club={club}
                    reportContent={contentItems.find(c => c.fixture_id === selectedFixtureForReport.id && c.type === 'REPORT')}
                    socialContent={contentItems.find(c => c.fixture_id === selectedFixtureForReport.id && c.type === 'SOCIAL')}
                    onClose={() => setSelectedFixtureForReport(null)}
                />
            )}

            {/* Fixture Form Modal */}
            <FixtureFormModal
                isOpen={isFixtureModalOpen}
                onClose={() => setIsFixtureModalOpen(false)}
                onSave={async (fixture) => {
                    await onCreateFixture(fixture);
                    await onRefetchFixtures();
                    // Auto-schedule content sequence after fixture is created
                    // Note: This assumes fixture is created successfully - Inngest will handle background jobs
                }}
            />

            {/* Content Editor Modal */}
            {selectedContentItem && (
                <ContentEditorModal
                    item={selectedContentItem}
                    club={club}
                    onClose={() => setSelectedContentItem(null)}
                    onSave={async (updatedItem) => {
                        await onUpdateContent(updatedItem);
                        setSelectedContentItem(null);
                    }}
                    onDelete={async (contentId) => {
                        await onDeleteContent(contentId);
                        setSelectedContentItem(null);
                    }}
                />
            )}
        </div>
    );
};


// --- Main App (data + UI) ---
const AppAuthed: React.FC<{
  clubId: string;
  supabaseConfigured: boolean;
  onSwitchWorkspace?: () => void;
}> = ({ clubId, supabaseConfigured, onSwitchWorkspace }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [generateStatus, setGenerateStatus] = useState<ContentGenStatus>('idle');
  const [isDemoDataActive, setIsDemoDataActive] = useState(false);
  const [isCheckingData, setIsCheckingData] = useState(true);
  
  const CLUB_ID = clubId;

  // Fetch club data
  const { data: club, loading: clubLoading, error: clubError, refetch: refetchClub } = useSupabaseQuery(
    () => getClub(CLUB_ID),
    [CLUB_ID]
  );

  // Fetch fixtures - use real data when available, mock as fallback
  const { data: fixturesData, loading: fixturesLoading, refetch: refetchFixtures } = useSupabaseQuery(
    () => getFixtures(CLUB_ID),
    [CLUB_ID]
  );

  // Fetch content items
  const { data: contentData, loading: contentLoading, refetch: refetchContent } = useSupabaseQuery(
    () => getContentItems(CLUB_ID),
    [CLUB_ID]
  );

  // Fetch sponsors
  const { data: sponsorsData, loading: sponsorsLoading, refetch: refetchSponsors } = useSupabaseQuery(
    () => getSponsors(CLUB_ID),
    [CLUB_ID]
  );

  // Determine which data to use: real data if available, otherwise mock (only if Supabase not configured)
  // When Supabase is configured, use real data (which may include seeded demo data)
  // When Supabase is not configured, use static mock data
  const fixtures = supabaseConfigured 
    ? (fixturesData || [])  // Use real data (may be empty or contain seeded demo data)
    : INITIAL_FIXTURES;     // Only use mock when Supabase not configured
  
  const contentItems = supabaseConfigured
    ? (contentData || [])
    : INITIAL_CONTENT;
  
  const sponsors = supabaseConfigured
    ? (sponsorsData || [])
    : INITIAL_SPONSORS;

  // Check if demo data is active and seed if needed
  useEffect(() => {
    const checkAndSeedDemoData = async () => {
      if (!supabaseConfigured || !club) {
        setIsCheckingData(false);
        setIsDemoDataActive(!supabaseConfigured); // Demo mode if no Supabase
        return;
      }

      try {
        const hasData = await hasRealData(CLUB_ID);
        const isDemo = await hasDemoData(CLUB_ID);
        
        setIsDemoDataActive(isDemo || (!hasData && club.name === MOCK_CLUB.name));
        setIsCheckingData(false);
      } catch (error) {
        console.error('Error checking data presence:', error);
        setIsCheckingData(false);
        setIsDemoDataActive(false);
      }
    };

    if (club && !clubLoading) {
      checkAndSeedDemoData();
    }
  }, [club, CLUB_ID, supabaseConfigured, clubLoading]);


  // Set up real-time subscriptions
  useRealtimeSubscription(
    (callback) => {
      const unsubscribe = getClub(CLUB_ID).then(club => {
        if (club) callback(club);
      });
      return () => {}; // Placeholder - real subscription would be set up here
    },
    (club) => {
      // Handle real-time club updates if needed
    },
    [CLUB_ID]
  );

  // Show loading state only if Supabase is configured AND data is loading
  const isLoading =
    supabaseConfigured &&
    (clubLoading || fixturesLoading || contentLoading || sponsorsLoading);

  // Show error or fallback to mock data if Supabase not configured
  const currentClub = club || MOCK_CLUB;

  // Handler for when demo data is cleared
  const handleDemoDataCleared = async () => {
    await Promise.all([
      refetchClub(),
      refetchFixtures(),
      refetchContent(),
      refetchSponsors(),
    ]);
    setIsDemoDataActive(false);
  };

  const handleUpdatePlayers = async (newPlayers: any[]) => {
      // This will be handled by playerService in SquadView
      // Just refetch club data to get updated players
      await refetchClub();
  };

  const handleUpdateContent = async (updatedItem: ContentItem) => {
      // Content update is handled in ContentEditorModal
      // Just refetch content items
      await refetchContent();
  };

  const runWeeklyScout = async () => {
    if (!currentClub) return;
    
    setGenerateStatus('generating');
    try {
      // Find upcoming games without previews
      const upcomingGames = fixtures.filter(f => f.status === 'SCHEDULED');
      const newItems: ContentItem[] = [];

      for (const fixture of upcomingGames) {
        const hasPreview = contentItems.some(c => c.fixture_id === fixture.id && c.type === 'PREVIEW');
        if (hasPreview) continue;

        const text = await generateContent(currentClub, fixture, 'PREVIEW');
        
        await createContentItem(CLUB_ID, {
          club_id: CLUB_ID,
          fixture_id: fixture.id,
          type: 'PREVIEW',
          platform: 'Website',
          body: text,
          status: 'DRAFT',
        });
      }

      // Add social posts
      for (const fixture of upcomingGames) {
        const text = await generateContent(currentClub, fixture, 'SOCIAL');
        await createContentItem(CLUB_ID, {
          club_id: CLUB_ID,
          fixture_id: fixture.id,
          type: 'SOCIAL',
          platform: 'Twitter',
          body: text,
          status: 'DRAFT',
        });
      }

      // Refetch content items to show new ones
      await refetchContent();
      setGenerateStatus('success');
      setTimeout(() => setGenerateStatus('idle'), 2000);
    } catch (error) {
      const errorMessage = handleError(error, 'runWeeklyScout');
      alert(errorMessage);
      setGenerateStatus('error');
      setTimeout(() => setGenerateStatus('idle'), 3000);
    }
  };

  const runHypeProtocol = async (fixture: Fixture, context: { matchType: string }) => {
      if (!currentClub) return;

      try {
        // Schedule content sequence via Inngest (background jobs)
        const { jobId } = await scheduleContentSequence(currentClub, fixture);
        
        // Refetch content items after a short delay to allow jobs to complete
        setTimeout(() => {
          refetchContent();
        }, 2000);
      } catch (error) {
        const errorMessage = handleError(error, 'runHypeProtocol');
        alert(errorMessage);
      }
  };

  const handleMatchReportGeneration = async (fixtureId: string, resultHome: number, resultAway: number, notes: string, scorers: string[], stats: MatchStats, motm: string, vibe: string, quote: string) => {
    if (!currentClub) return;

    const fixture = fixtures.find(f => f.id === fixtureId);
    if (!fixture) return;

    try {
      // Update fixture in database
      const updatedFixture = await updateFixture(fixtureId, {
        result_home: resultHome,
        result_away: resultAway,
        status: 'COMPLETED',
        key_events: notes,
        scorers: scorers,
        stats: stats,
        man_of_the_match: motm,
      });

      // Generate content
      const reportText = await generateContent(currentClub, updatedFixture, 'REPORT', { vibe, motm, managerQuote: quote });
      const socialText = await generateContent(currentClub, updatedFixture, 'SOCIAL', { vibe });

      // Create content items
      await createContentItem(CLUB_ID, {
        club_id: CLUB_ID,
        fixture_id: fixture.id,
        type: 'REPORT',
        platform: 'Website',
        body: reportText,
        status: 'DRAFT',
      });

      await createContentItem(CLUB_ID, {
        club_id: CLUB_ID,
        fixture_id: fixture.id,
        type: 'SOCIAL',
        platform: 'Twitter',
        body: socialText,
        status: 'DRAFT',
      });

      // Refetch data
      await Promise.all([refetchFixtures(), refetchContent()]);
    } catch (error) {
      const errorMessage = handleError(error, 'handleMatchReportGeneration');
      alert(errorMessage);
    }
  };

  // Show loading state only if we're actually loading from Supabase
  if (isLoading && !club && !clubError) {
    return (
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchWorkspace={onSwitchWorkspace}
        workspaceLabel={currentClub?.name}
        onLogout={() => {
          // Logout will be handled by the signOut function in Layout
          // The auth state listener will clear the session
        }}
      >
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner size={32} text="Loading system data..." />
        </div>
      </Layout>
    );
  }

  return (
    <ErrorBoundary>
      <Layout
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchWorkspace={onSwitchWorkspace}
        workspaceLabel={currentClub?.name}
        onLogout={() => {
          // Logout will be handled by the signOut function in Layout
          // The auth state listener will clear the session
        }}
      >
      {/* Demo Data Banner */}
      {isDemoDataActive && supabaseConfigured && !isCheckingData && (
        <DemoDataBanner 
          clubId={CLUB_ID} 
          onDataCleared={handleDemoDataCleared}
        />
      )}
      
      {activeTab === 'dashboard' && currentClub && (
        <Dashboard 
            fixtures={fixtures} 
            contentItems={contentItems} 
            club={currentClub}
            onNavigate={setActiveTab}
            onRunScout={runWeeklyScout}
        />
      )}
      {activeTab === 'fixtures' && currentClub && (
        <HypeEngine 
            fixtures={fixtures} 
            contentItems={contentItems}
            club={currentClub}
            onRefetchFixtures={refetchFixtures}
            onGenerateReport={handleMatchReportGeneration}
            onGenerateHype={runHypeProtocol}
            onCreateFixture={async (fixture) => {
                await createFixture(currentClub.id, fixture);
            }}
            onDeleteFixture={async (fixtureId) => {
                await deleteFixture(fixtureId);
            }}
            onUpdateContent={async (updatedItem) => {
                await handleUpdateContent(updatedItem);
            }}
            onDeleteContent={async (contentId) => {
                await deleteContentItem(contentId);
                await refetchContent();
            }}
        />
      )}
      {activeTab === 'squad' && currentClub && (
          <SquadView 
            players={currentClub.players} 
            setPlayers={handleUpdatePlayers}
            club={currentClub}
          />
      )}
      {activeTab === 'commercial' && currentClub && (
        <SponsorNexus club={currentClub} sponsors={sponsors} onRefetchSponsors={refetchSponsors} />
      )}
      {activeTab === 'comms' && currentClub && (
        <CommsArray club={currentClub} />
      )}
      {activeTab === 'settings' && currentClub && (
        <SettingsView club={currentClub} />
      )}
      {activeTab === 'education' && currentClub && (
        <EducationView 
          orgId={currentClub.org_id || ''} 
          onNavigate={setActiveTab} 
        />
      )}
      {currentClub && <AiAssistant club={currentClub} />}
      
      {/* Onboarding Manager - handles welcome modal + tour */}
      {currentClub?.org_id && (
        <OnboardingManager 
          orgId={currentClub.org_id} 
          onNavigate={setActiveTab} 
        />
      )}
      </Layout>
    </ErrorBoundary>
  );
};

// --- App (auth + org/club selection gate) ---
const App: React.FC = () => {
  const supabaseConfigured = isSupabaseConfiguredFn();

  // Demo mode (no Supabase)
  if (!supabaseConfigured) {
    return <AppAuthed clubId={MOCK_CLUB.id} supabaseConfigured={false} />;
  }

  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Persist workspace context in localStorage
  const [ctx, setCtx] = useState<{ orgId: string; clubId: string } | null>(() => {
    try {
      const saved = localStorage.getItem('pitchside_workspace');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Save ctx to localStorage when it changes
  useEffect(() => {
    if (ctx) {
      localStorage.setItem('pitchside_workspace', JSON.stringify(ctx));
    }
  }, [ctx]);

  useEffect(() => {
    if (!supabase) return;
    let mounted = true;
    let currentUserId: string | null = null;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session ?? null);
      currentUserId = data.session?.user?.id ?? null;
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_evt, nextSession) => {
      const nextUserId = nextSession?.user?.id ?? null;
      
      // Only reset workspace if the USER actually changed (not just token refresh)
      if (currentUserId && nextUserId && currentUserId !== nextUserId) {
        setCtx(null);
        localStorage.removeItem('pitchside_workspace');
      }
      
      // If logged out, clear workspace
      if (!nextSession) {
        setCtx(null);
        localStorage.removeItem('pitchside_workspace');
      }
      
      currentUserId = nextUserId;
      setSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Auto-seed demo data for new users when workspace is selected
  useEffect(() => {
    const seedIfNeeded = async () => {
      if (!session || !ctx) return;

      try {
        const hasData = await hasRealData(ctx.clubId);
        if (!hasData) {
          // User has no data, seed demo data
          await seedDemoData(ctx.orgId);
        }
      } catch (error) {
        console.error('Error auto-seeding demo data:', error);
        // Don't block the app if seeding fails
      }
    };

    if (session && ctx && !authLoading) {
      seedIfNeeded();
    }
  }, [session, ctx, authLoading]);


  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center">
        <LoadingSpinner size={28} text="Booting auth systems..." />
      </div>
    );
  }


  if (!session) {
    return <AuthScreen />;
  }

  if (!ctx) {
    return <WorkspaceGate onReady={(next) => setCtx(next)} />;
  }

  return (
    <AppAuthed
      clubId={ctx.clubId}
      supabaseConfigured={true}
      onSwitchWorkspace={() => setCtx(null)}
    />
  );
};

export default App;
