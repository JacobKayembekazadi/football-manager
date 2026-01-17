
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
import ContentHub from './components/ContentHub';
import SettingsView from './components/SettingsView';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import ImageGeneratorModal from './components/ImageGeneratorModal';
import OnboardingManager from './components/OnboardingManager';
import EducationView from './components/EducationView';
import FixtureFormModal from './components/FixtureFormModal';
import QuickStartChecklist from './components/QuickStartChecklist';
import DemoDataBanner from './components/DemoDataBanner';
import { ToastProvider } from './components/Toast';
import { handleError } from './utils/errorHandler';
import {
  Fixture, ContentItem, Club, MOCK_CLUB, MatchStats,
  Sponsor,
  INITIAL_FIXTURES, INITIAL_CONTENT, INITIAL_SPONSORS,
  ContentGenStatus
} from './types';
import { generateContent, generateOpponentReport, suggestScorers, generateViralIdeas } from './services/geminiService';
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

const MomentumChart = () => (
  <svg className="w-full h-full absolute inset-0 opacity-20 pointer-events-none" preserveAspectRatio="none">
    <path d="M0,100 C150,100 200,50 350,80 C500,110 600,20 800,40 L800,200 L0,200 Z" fill="url(#grad1)" />
    <path d="M0,100 C150,100 200,50 350,80 C500,110 600,20 800,40" stroke="#22c55e" strokeWidth="2" fill="none" className="drop-shadow-[0_0_10px_#22c55e]" />
    <defs>
      <linearGradient id="grad1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" style={{ stopColor: '#22c55e', stopOpacity: 0.2 }} />
        <stop offset="100%" style={{ stopColor: '#22c55e', stopOpacity: 0 }} />
      </linearGradient>
    </defs>
  </svg>
);

const WinProbability: React.FC<{ opponent: string }> = ({ opponent }) => {
  // Mock probability calculation
  const winProb = 68;
  const drawProb = 20;

  return (
    <div className="glass-card p-5 rounded-2xl border-green-500/20 relative overflow-hidden">
      <div className="flex justify-between items-start mb-4 relative z-10">
        <span className="text-xs text-slate-400">Match Prediction</span>
        <Activity size={16} className="text-green-500" />
      </div>

      <div className="flex items-center gap-4 relative z-10">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r="36" stroke="#1e293b" strokeWidth="8" fill="transparent" />
            <circle cx="40" cy="40" r="36" stroke="#22c55e" strokeWidth="8" fill="transparent" strokeDasharray="226" strokeDashoffset={226 - (226 * winProb) / 100} className="transition-all duration-1000 shadow-[0_0_10px_#22c55e]" />
          </svg>
          <span className="absolute text-xl font-bold text-white">{winProb}%</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold text-white mb-1">Good chance of win</span>
          <span className="text-xs text-slate-400">vs {opponent}</span>
          <div className="flex items-center gap-2 mt-2">
            <div className="h-1 w-12 bg-slate-700 rounded-full overflow-hidden">
              <div style={{ width: `${drawProb}%` }} className="h-full bg-slate-400"></div>
            </div>
            <span className="text-[10px] text-slate-500">Draw chance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const WeatherWidget: React.FC = () => {
  return (
    <div className="glass-card p-5 rounded-2xl border-purple-500/20 flex flex-col justify-between">
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-slate-400">Match Day Weather</span>
        <CloudRain size={16} className="text-purple-500" />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div>
          <span className="text-3xl font-display font-bold text-white">12°C</span>
          <p className="text-xs text-slate-400 mt-1">Light Rain</p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Wind size={10} className="text-green-500" /> 14 km/h NW
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Thermometer size={10} className="text-red-400" /> 82% Humidity
          </div>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-white/5">
        <p className="text-xs text-purple-400">
          Tip: Slick surface, consider passing game
        </p>
      </div>
    </div>
  )
}

// --- Dashboard Component (Task-Based Layout with Match Hub) ---
const Dashboard: React.FC<{
  fixtures: Fixture[],
  contentItems: ContentItem[],
  club: Club,
  onNavigate: (tab: string) => void,
  onRunScout: () => Promise<void>,
  hasCompletedEducation?: boolean
}> = ({ fixtures, club, contentItems, onNavigate }) => {
  const upcoming = fixtures.filter(f => f.status === 'SCHEDULED').sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const nextMatch = upcoming[0];
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev =>
      prev.includes(taskId) ? prev.filter(t => t !== taskId) : [...prev, taskId]
    );
  };

  // Calculate days until next match
  const getDaysUntil = (date: string) => {
    const matchDate = new Date(date);
    const today = new Date();
    return Math.ceil((matchDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Dynamic tasks based on fixtures and state
  const tasks = [
    {
      id: 'availability',
      label: 'Confirm player availability',
      sublabel: `${club.players.length} players on roster`,
      icon: '👥',
      color: 'border-l-blue-500',
      navigate: 'availability'
    },
    {
      id: 'injuries',
      label: 'Update injuries',
      sublabel: '1 player flagged for assessment',
      icon: '🏥',
      color: 'border-l-red-500',
      navigate: 'availability'
    },
    {
      id: 'prematch',
      label: 'Generate pre-match content',
      sublabel: nextMatch ? `vs ${nextMatch.opponent}` : 'No upcoming match',
      icon: '📝',
      color: 'border-l-purple-500',
      navigate: 'matchday'
    },
    {
      id: 'sponsor',
      label: 'Review sponsor deliverables',
      sublabel: 'Partnership renewal in 15 days',
      icon: '💼',
      color: 'border-l-amber-500',
      navigate: 'finance'
    },
  ];

  // Mock alerts (player updates, notifications)
  const alerts = [
    { id: '1', player: 'Will Taylor', date: 'Fri, 16 April', status: 'CONFIRMED', statusColor: 'bg-green-500 text-green-500' },
    { id: '2', player: 'Jake Brooks', date: 'Fri, 16 April', amount: '+£3,000', status: 'COMMIT', statusColor: 'bg-blue-500 text-blue-500' },
    { id: '3', player: 'Tyler Coles', date: 'Sat, 20 April', amount: '+£1,200', status: 'PENDING', statusColor: 'bg-amber-500 text-amber-500' },
  ];

  return (
    <div className="flex gap-6 pb-8 h-full">
      {/* Left Column - Tasks & Alerts */}
      <div className="flex-1 space-y-6 overflow-y-auto custom-scrollbar pr-2">
        {/* Today Section */}
        <div>
          <h2 className="text-3xl font-bold text-white mb-6">Today</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => onNavigate(task.navigate)}
                className={`bg-slate-800/60 border border-white/10 ${task.color} border-l-4 rounded-xl p-4 cursor-pointer hover:bg-slate-800/80 hover:border-white/20 transition-all group`}
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleTask(task.id); }}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                      completedTasks.includes(task.id)
                        ? 'bg-green-500 border-green-500 text-black'
                        : 'border-slate-500 hover:border-green-500'
                    }`}
                  >
                    {completedTasks.includes(task.id) && <span className="text-xs">✓</span>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${completedTasks.includes(task.id) ? 'text-slate-500 line-through' : 'text-white'}`}>
                      {task.label}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{task.sublabel}</p>
                  </div>
                  <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity">{task.icon}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts Section */}
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Alerts</h3>
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className="bg-slate-800/60 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer"
                onClick={() => onNavigate('availability')}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${alert.statusColor.split(' ')[0]}`}></div>
                  <div>
                    <p className="text-sm font-medium text-white">{alert.player}</p>
                    <p className="text-xs text-slate-500">{alert.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {alert.amount && <span className="text-xs text-slate-400">{alert.amount}</span>}
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${
                    alert.status === 'CONFIRMED' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                    alert.status === 'COMMIT' ? 'bg-blue-500/10 border-blue-500/30 text-blue-500' :
                    'bg-amber-500/10 border-amber-500/30 text-amber-500'
                  }`}>
                    {alert.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-500">{club.players.length}</p>
            <p className="text-xs text-slate-500 uppercase">Squad Size</p>
          </div>
          <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">{upcoming.length}</p>
            <p className="text-xs text-slate-500 uppercase">Upcoming</p>
          </div>
          <div className="bg-slate-800/40 border border-white/5 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-purple-500">{contentItems.filter(c => c.status === 'DRAFT').length}</p>
            <p className="text-xs text-slate-500 uppercase">Content Drafts</p>
          </div>
        </div>
      </div>

      {/* Right Column - Match Hub Preview */}
      <div className="w-80 lg:w-96 flex-shrink-0">
        <div className="bg-slate-800/60 border border-white/10 rounded-2xl overflow-hidden sticky top-0">
          {/* Match Hub Header */}
          <div className="bg-slate-900/80 px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Match Hub</h3>
            <button
              onClick={() => onNavigate('matchday')}
              className="text-xs text-green-500 hover:text-green-400 transition-colors"
            >
              View All →
            </button>
          </div>

          {/* Upcoming Matches List */}
          <div className="p-4 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
            {upcoming.length > 0 ? upcoming.slice(0, 4).map((fixture, idx) => {
              const daysUntil = getDaysUntil(fixture.kickoff_time);
              const hasContent = contentItems.some(c => c.fixture_id === fixture.id);

              return (
                <div
                  key={fixture.id}
                  onClick={() => onNavigate('matchday')}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    idx === 0
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-slate-700/30 border border-transparent hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-sm">{fixture.opponent}</span>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      daysUntil <= 2 ? 'bg-red-500/20 text-red-400' : 'bg-slate-600/50 text-slate-400'
                    }`}>
                      {daysUntil <= 0 ? 'TODAY' : daysUntil === 1 ? 'TOMORROW' : `${daysUntil}D`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{fixture.venue}</span>
                    <span>{fixture.competition}</span>
                  </div>
                  {idx === 0 && (
                    <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${hasContent ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                      <span className="text-[10px] text-slate-400">
                        {hasContent ? 'Content ready' : 'Content pending'}
                      </span>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="text-center py-8">
                <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No upcoming matches</p>
              </div>
            )}
          </div>

          {/* Match Pack Section (for next match) */}
          {nextMatch && (
            <div className="border-t border-white/10 p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Match Pack</h4>
              <div className="space-y-2">
                {[
                  { label: 'Squad confirmed', done: true },
                  { label: 'Travel booked', done: true },
                  { label: 'Kit prepared', done: false },
                  { label: 'Pre-match content', done: contentItems.some(c => c.fixture_id === nextMatch.id && c.type === 'PREVIEW') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                      item.done ? 'bg-green-500 text-black' : 'border border-slate-600'
                    }`}>
                      {item.done && '✓'}
                    </div>
                    <span className={`text-xs ${item.done ? 'text-slate-400' : 'text-white'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Continue Button */}
          <div className="p-4 border-t border-white/10">
            {(() => {
              const nextTask = tasks.find(t => !completedTasks.includes(t.id));
              return (
                <button
                  onClick={() => nextTask ? onNavigate(nextTask.navigate) : onNavigate('matchday')}
                  className="w-full py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg text-sm transition-colors flex flex-col items-center justify-center gap-1"
                >
                  {nextTask ? (
                    <>
                      <span className="text-[10px] uppercase opacity-70">Next up</span>
                      <span className="flex items-center gap-2">{nextTask.label} <ArrowRight size={16} /></span>
                    </>
                  ) : (
                    <span className="flex items-center gap-2">All done! View Matchday <ArrowRight size={16} /></span>
                  )}
                </button>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Templates View Component ---
const TemplatesView: React.FC<{ fixtures: Fixture[] }> = ({ fixtures }) => {
  const [enabledPacks, setEnabledPacks] = useState<string[]>(['matchday-away']);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);

  const templatePacks = [
    {
      id: 'matchday-home',
      name: 'Matchday Pack (Home)',
      description: 'Standard home match preparation checklist',
      tasks: [
        'Confirm squad availability',
        'Print / export team sheet',
        'Kit packed (shirts / shorts / socks)',
        'Equipment packed (balls / cones / bibs)',
        'Ref fees / match admin',
        'Water bottles / ice',
        'Lineup post scheduled',
        'Kit poster scheduled (Home)',
        'Sponsor deliverables checked',
      ]
    },
    {
      id: 'matchday-away',
      name: 'Matchday Pack (Away)',
      description: 'Away match preparation with travel',
      tasks: [
        'Confirm squad availability',
        'Confirm meet time + travel (away)',
        'Print / export team sheet',
        'Kit packed (shirts / shorts / socks)',
        'Equipment packed (balls / cones / bibs)',
        'Ref fees / match admin',
        'Water bottles / ice',
        'Lineup post scheduled',
        'Sponsor deliverables checked',
      ]
    },
    {
      id: 'training-night',
      name: 'Training Night Pack',
      description: 'Weekly training session prep',
      tasks: [
        'Confirm attendance',
        'Equipment ready (balls / cones / bibs)',
        'First aid kit checked',
        'Session plan prepared',
      ]
    },
    {
      id: 'squad-availability',
      name: 'Squad Availability Pack',
      description: 'Player availability tracking',
      tasks: [
        'Send availability request',
        'Chase non-responders',
        'Update squad list',
        'Notify manager of issues',
      ]
    },
    {
      id: 'kit-equipment',
      name: 'Kit & Equipment Pack',
      description: 'Equipment management tasks',
      tasks: [
        'Kit inventory check',
        'Laundry status review',
        'Reorder low stock items',
        'Issue kit to new players',
      ]
    },
    {
      id: 'media-pack',
      name: 'Media Pack (Preview & FT)',
      description: 'Content and social media tasks',
      tasks: [
        'Match preview scheduled (Fri AM)',
        'Team lineup scheduled (1hr pre-kickoff)',
        'Match updates scheduled (half-time + 85\')',
        'Full-time report scheduled',
        'Opponent graphic (logo)',
        'Lineup graphic (players)',
        'Score / MOTM graphic',
      ]
    },
  ];

  const togglePack = (packId: string) => {
    setEnabledPacks(prev =>
      prev.includes(packId) ? prev.filter(p => p !== packId) : [...prev, packId]
    );
  };

  const nextFixture = fixtures.filter(f => f.status === 'SCHEDULED')[0];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Templates</h2>
        <p className="text-sm text-slate-400 mt-1">Choose default templates to auto-fill matchday tasks</p>
      </div>

      <div className="flex gap-6">
        {/* Left Column - Template List */}
        <div className="flex-1 space-y-4">
          {/* Tip Banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
            <p className="text-sm text-amber-400">
              <span className="font-semibold">Tip:</span> Choose default templates to auto-fill. Tasks will be created automatically when you schedule a fixture.
            </p>
          </div>

          {/* Templates Section */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/10 bg-slate-900/50">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Templates</h3>
            </div>

            <div className="divide-y divide-white/5">
              {templatePacks.map(pack => (
                <div
                  key={pack.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedPack === pack.id ? 'bg-slate-700/50' : 'hover:bg-slate-800/80'
                  }`}
                  onClick={() => setSelectedPack(selectedPack === pack.id ? null : pack.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePack(pack.id); }}
                        className={`w-10 h-6 rounded-full transition-colors relative ${
                          enabledPacks.includes(pack.id) ? 'bg-green-500' : 'bg-slate-600'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          enabledPacks.includes(pack.id) ? 'left-5' : 'left-1'
                        }`} />
                      </button>
                      <div>
                        <p className="text-sm font-medium text-white">{pack.name}</p>
                        <p className="text-xs text-slate-500">{pack.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {enabledPacks.includes(pack.id) && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-[10px] font-bold uppercase rounded">
                          ON
                        </span>
                      )}
                      <span className="text-slate-500">
                        {selectedPack === pack.id ? '▼' : '▶'}
                      </span>
                    </div>
                  </div>

                  {/* Expanded Tasks */}
                  {selectedPack === pack.id && (
                    <div className="mt-4 pl-12 space-y-2">
                      <p className="text-[10px] text-green-500 font-mono uppercase mb-2">
                        * Tasks auto-fill after you select this template →
                      </p>
                      {pack.tasks.map((task, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border border-slate-600 flex items-center justify-center">
                            {/* Empty checkbox */}
                          </div>
                          <span className="text-sm text-slate-300">{task}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Preview & Add */}
        <div className="w-80 lg:w-96 space-y-4">
          {/* Default Pack Info */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Active Templates</h4>
            <div className="space-y-2">
              {enabledPacks.length > 0 ? (
                enabledPacks.map(packId => {
                  const pack = templatePacks.find(p => p.id === packId);
                  return pack ? (
                    <div key={packId} className="flex items-center justify-between bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <span className="text-sm text-white">{pack.name}</span>
                      <span className="text-[10px] text-green-400 font-bold">DEFAULT</span>
                    </div>
                  ) : null;
                })
              ) : (
                <p className="text-sm text-slate-500">No templates enabled</p>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              ✓ Auto-create tasks for each fixture
            </p>
          </div>

          {/* Starter Packs */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Starter Packs</h4>
            <div className="space-y-2">
              {templatePacks.filter(p => !enabledPacks.includes(p.id)).slice(0, 4).map(pack => (
                <div key={pack.id} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{pack.name}</span>
                  <button
                    onClick={() => togglePack(pack.id)}
                    className="px-3 py-1 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-black text-xs font-bold rounded transition-colors"
                  >
                    + ADD
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Next Fixture Preview */}
          {nextFixture && (
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Next Fixture Preview</h4>
              <div className="bg-slate-900/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-semibold text-white">vs {nextFixture.opponent}</p>
                <p className="text-xs text-slate-500">
                  {new Date(nextFixture.kickoff_time).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                  {' • '}{nextFixture.venue}
                </p>
              </div>
              <p className="text-xs text-slate-400">
                {enabledPacks.length > 0 ? (
                  <>
                    <span className="text-green-400">{enabledPacks.reduce((sum, id) => {
                      const pack = templatePacks.find(p => p.id === id);
                      return sum + (pack?.tasks.length || 0);
                    }, 0)} tasks</span> will be auto-created from enabled templates
                  </>
                ) : (
                  'Enable templates to auto-create tasks'
                )}
              </p>
            </div>
          )}
        </div>
      </div>
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
  const [isMatchdayMode, setIsMatchdayMode] = useState(false);

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

  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED').sort((a, b) => new Date(a.kickoff_time).getTime() - new Date(b.kickoff_time).getTime());
  const archivedFixtures = fixtures.filter(f => f.status === 'COMPLETED').sort((a, b) => new Date(b.kickoff_time).getTime() - new Date(a.kickoff_time).getTime());

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

  // Check if there's a match today or soon for matchday mode
  const todaysMatch = upcomingFixtures.find(f => {
    const matchDate = new Date(f.kickoff_time);
    const today = new Date();
    return matchDate.toDateString() === today.toDateString();
  });

  // Matchday Mode - simplified view
  if (isMatchdayMode && todaysMatch) {
    return (
      <div className="h-full flex flex-col">
        {/* Matchday Mode Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Match Day</h2>
            <p className="text-green-500 text-sm">vs {todaysMatch.opponent}</p>
          </div>
          <button
            onClick={() => setIsMatchdayMode(false)}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-colors"
          >
            Exit Match Mode
          </button>
        </div>

        {/* Big Action Buttons */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Match Info Card */}
          <div className="bg-slate-800/80 border border-green-500/30 rounded-2xl p-6 text-center">
            <p className="text-xs text-slate-400 uppercase mb-2">{todaysMatch.competition}</p>
            <h3 className="text-3xl font-bold text-white mb-2">vs {todaysMatch.opponent}</h3>
            <p className="text-lg text-green-500">
              {new Date(todaysMatch.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              {' • '}{todaysMatch.venue}
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => onNavigate?.('availability')}
              className="bg-blue-500/20 border border-blue-500/40 rounded-2xl p-6 text-center hover:bg-blue-500/30 transition-colors"
            >
              <span className="text-3xl mb-2 block">👥</span>
              <span className="text-white font-semibold">Squad Status</span>
            </button>
            <button
              onClick={() => handleHypeGeneration(todaysMatch)}
              disabled={generatingHypeId === todaysMatch.id}
              className="bg-purple-500/20 border border-purple-500/40 rounded-2xl p-6 text-center hover:bg-purple-500/30 transition-colors disabled:opacity-50"
            >
              {generatingHypeId === todaysMatch.id ? (
                <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-400" />
              ) : (
                <span className="text-3xl mb-2 block">📣</span>
              )}
              <span className="text-white font-semibold">Post Content</span>
            </button>
            <button
              onClick={() => setEditingId(todaysMatch.id)}
              className="bg-green-500/20 border border-green-500/40 rounded-2xl p-6 text-center hover:bg-green-500/30 transition-colors"
            >
              <span className="text-3xl mb-2 block">⚽</span>
              <span className="text-white font-semibold">Log Result</span>
            </button>
            <button
              onClick={() => setExpandedContentFixture(todaysMatch.id)}
              className="bg-amber-500/20 border border-amber-500/40 rounded-2xl p-6 text-center hover:bg-amber-500/30 transition-colors"
            >
              <span className="text-3xl mb-2 block">📋</span>
              <span className="text-white font-semibold">View Content</span>
            </button>
          </div>

          {/* Match Pack Checklist */}
          <div className="bg-slate-800/60 border border-white/10 rounded-2xl p-5">
            <h4 className="text-sm font-semibold text-white mb-4">Quick Checklist</h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Squad confirmed', done: true },
                { label: 'Kit ready', done: true },
                { label: 'Travel sorted', done: todaysMatch.venue === 'Home' },
                { label: 'Lineup posted', done: contentItems.some(c => c.fixture_id === todaysMatch.id && c.type === 'SOCIAL') },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm ${
                    item.done ? 'bg-green-500 text-black' : 'border-2 border-slate-500'
                  }`}>
                    {item.done && '✓'}
                  </div>
                  <span className={`text-sm ${item.done ? 'text-slate-400' : 'text-white'}`}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper for matchday mode navigation (using club tab navigation if available)
  const onNavigate = (tab: string) => {
    // This will be passed down from parent in a future refactor
    // For now, we'll just close matchday mode
    setIsMatchdayMode(false);
  };

  return (
    <div className="space-y-6 animate-fade-in relative h-full flex flex-col">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Matchday</h2>
          <p className="text-slate-400 text-sm mt-1">Fixtures, results, and matchday operations</p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Matchday Mode Button - only show if there's a match today */}
          {todaysMatch && (
            <button
              onClick={() => setIsMatchdayMode(true)}
              className="flex items-center gap-2 bg-green-500 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-green-400 transition-colors animate-pulse"
            >
              <Zap size={16} /> Match Day Mode
            </button>
          )}

          {/* Schedule Fixture Button */}
          <button
            onClick={() => setIsFixtureModalOpen(true)}
            data-tour="add-fixture-btn"
            className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 text-green-500 px-4 py-2 rounded-lg font-medium text-sm hover:bg-green-500/20 transition-colors"
          >
            <Plus size={16} /> Schedule Fixture
          </button>

          {/* Tabs */}
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2 ${activeTab === 'upcoming' ? 'bg-green-500 text-black' : 'text-slate-400 hover:text-white'}`}
            >
              <Calendar size={14} /> Upcoming
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`px-4 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2 ${activeTab === 'archive' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <Archive size={14} /> Results
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
                <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                <div className="p-6 flex flex-col lg:flex-row gap-8 items-center">

                  {/* Date & Opponent */}
                  <div className="flex items-center gap-6 flex-1">
                    <div className="text-center">
                      <div className="text-2xl font-display font-bold text-white">{new Date(fixture.kickoff_time).getDate()}</div>
                      <div className="text-xs font-mono text-green-500 uppercase">{new Date(fixture.kickoff_time).toLocaleDateString('en-GB', { month: 'short' })}</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 border border-slate-700 px-2 py-0.5 rounded w-fit">
                        {fixture.competition}
                      </div>
                      <h3 className="text-2xl font-display font-bold text-white">VS {fixture.opponent}</h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-1">
                        <MapPin size={12} /> {fixture.venue.toUpperCase()}
                        <span className="text-slate-600">|</span>
                        <Clock size={12} /> {new Date(fixture.kickoff_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>

                  {/* Comms Timeline Widget */}
                  <div className="flex-1 w-full lg:w-auto">
                    <div className="flex justify-between text-xs text-slate-500 mb-2">
                      <span>Content Schedule</span>
                      <span>{hasPreview ? 'Ready' : 'Not started'}</span>
                    </div>
                    <div className="relative h-1 bg-white/10 rounded-full flex items-center justify-between px-1">
                      {[
                        { label: 'T-48h', done: hasGraphics },
                        { label: 'T-24h', done: hasPreview },
                        { label: 'T-1h', done: hasSocial }
                      ].map((point, i) => (
                        <div key={i} className="relative group/point">
                          <div className={`w-2.5 h-2.5 rounded-full border border-black ${point.done ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                          <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-slate-500 font-mono whitespace-nowrap opacity-0 group-hover/point:opacity-100 transition-opacity">{point.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${hasPreview ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700 bg-slate-800/50'}`}>Preview</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${hasSocial ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700 bg-slate-800/50'}`}>Socials</span>
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${hasGraphics ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10' : 'text-slate-500 border-slate-700 bg-slate-800/50'}`}>Graphics</span>
                    </div>
                  </div>

                  {/* Action Panel */}
                  <div className="flex flex-col gap-3 w-full lg:w-64">
                    <div className="bg-black/40 border border-white/10 rounded-lg p-3">
                      <label className="text-[9px] font-mono text-slate-500 uppercase block mb-1">Match Context</label>
                      <select
                        value={contextValue}
                        onChange={(e) => setHypeContexts(prev => ({ ...prev, [fixture.id]: e.target.value }))}
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
                            className="flex-1 py-2 bg-green-500/10 border border-green-500/50 text-green-500 font-bold uppercase text-xs rounded hover:bg-green-500 hover:text-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
                          className="w-full py-1.5 text-purple-500/60 hover:text-purple-500 hover:bg-purple-500/10 font-mono uppercase text-[10px] rounded transition-all flex items-center justify-center gap-1"
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
                  <div className="bg-black/40 border-t border-purple-500/30 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-mono text-purple-500 uppercase">Content Campaign</h4>
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
                            className="text-xs text-green-500 hover:text-green-500/80 font-mono uppercase"
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
                  <div className="bg-black/60 border-t border-green-500/30 p-8 animate-slide-up backdrop-blur-xl">
                    <div className="max-w-5xl mx-auto">
                      <div className="flex items-center justify-between mb-8">
                        <h4 className="text-green-500 text-sm font-semibold flex items-center gap-2">
                          <Zap size={14} /> Log Match Result
                        </h4>
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
                                className="w-16 bg-transparent border-b-2 border-slate-600 text-center text-4xl font-display font-bold text-white focus:border-green-500 outline-none transition-colors"
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
                                className="w-16 bg-transparent border-b-2 border-slate-600 text-center text-4xl font-display font-bold text-white focus:border-rose-500 outline-none transition-colors"
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
                                  className="text-[10px] text-purple-500 hover:text-white uppercase flex items-center gap-1 transition-colors disabled:opacity-50"
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
                                  className={`px-3 py-1 text-[10px] rounded border transition-all font-mono ${selectedScorers.includes(player.name) ? 'bg-green-500 text-black border-green-500 font-bold' : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'}`}
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
                              className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
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
                            <span className="font-bold text-green-500">{homePossession}%</span>
                          </div>
                          <input
                            type="range"
                            min="0" max="100"
                            value={homePossession}
                            onChange={(e) => setHomePossession(parseInt(e.target.value))}
                            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
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
                                className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded border ${gameVibe === v ? 'bg-rose-500 text-white border-rose-500' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
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
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 h-24 resize-none focus:border-green-500 outline-none transition-colors font-mono"
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
                              className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-sm text-slate-300 h-24 resize-none focus:border-green-500 outline-none transition-colors font-sans italic"
                              placeholder="We showed great character today..."
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleSaveResult(fixture.id)}
                        disabled={!scoreHome || !scoreAway || isProcessing}
                        className="w-full py-4 bg-gradient-to-r from-green-500 to-cyan-500 text-black font-bold rounded hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Layers size={18} />}
                        {isProcessing ? 'Generating report...' : 'Generate Match Report'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* ARCHIVE VIEW */}
          {activeTab === 'archive' && archivedFixtures.map(fixture => (
            <div key={fixture.id} className="glass-card p-6 rounded-2xl flex items-center justify-between group hover:border-purple-500/30 transition-colors">
              <div className="flex items-center gap-6">
                <div className="text-center w-16 opacity-50">
                  <div className="text-xl font-display font-bold text-slate-300">{new Date(fixture.kickoff_time).getDate()}</div>
                  <div className="text-[10px] font-mono uppercase">{new Date(fixture.kickoff_time).toLocaleDateString('en-GB', { month: 'short' })}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono mb-1">{fixture.competition}</div>
                  <div className="flex items-center gap-4 text-xl font-display font-bold text-white">
                    <span className={fixture.result_home! > fixture.result_away! ? 'text-emerald-500' : ''}>{club.name}</span>
                    <span className="bg-white/10 px-2 rounded text-base">{fixture.result_home} - {fixture.result_away}</span>
                    <span className={fixture.result_away! > fixture.result_home! ? 'text-emerald-500' : ''}>{fixture.opponent}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedFixtureForReport(fixture)}
                className="px-4 py-2 border border-white/10 hover:bg-purple-500 hover:text-white hover:border-purple-500 text-slate-400 rounded transition-all text-xs font-bold uppercase flex items-center gap-2"
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
                className="inline-flex items-center gap-2 bg-green-500 text-black px-6 py-3 rounded-lg font-display font-bold uppercase text-sm hover:shadow-[0_0_20px_rgba(34,197,94,0.35)] transition-all"
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

        // Auto-seed demo data if user has no data at all
        if (!hasData && !isDemo && club.org_id) {
          console.log('No data found, auto-seeding demo data...');
          try {
            const { clubId: seededClubId, isNew } = await seedDemoData(club.org_id);
            if (isNew) {
              console.log('Demo data seeded successfully, refetching...');
              // Refetch all data after seeding
              await Promise.all([
                refetchClub(),
                refetchFixtures(),
                refetchContent(),
                refetchSponsors(),
              ]);
              setIsDemoDataActive(true);
              setIsCheckingData(false);
              return;
            }
          } catch (seedError) {
            console.error('Error seeding demo data:', seedError);
            // Continue with empty state if seeding fails
          }
        }

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
      return () => { }; // Placeholder - real subscription would be set up here
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
        {activeTab === 'matchday' && currentClub && (
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
        {activeTab === 'availability' && currentClub && (
          <SquadView
            players={currentClub.players}
            setPlayers={handleUpdatePlayers}
            club={currentClub}
          />
        )}
        {activeTab === 'content' && currentClub && (
          <ContentHub
            club={currentClub}
            contentItems={contentItems}
            fixtures={fixtures}
            onUpdateContent={async (updatedItem) => {
              await handleUpdateContent(updatedItem);
            }}
            onDeleteContent={async (contentId) => {
              await deleteContentItem(contentId);
              await refetchContent();
            }}
            onRefetchContent={refetchContent}
          />
        )}
        {activeTab === 'finance' && currentClub && (
          <SponsorNexus club={currentClub} sponsors={sponsors} onRefetchSponsors={refetchSponsors} />
        )}
        {activeTab === 'club-ops' && currentClub && (
          <SettingsView club={currentClub} />
        )}
        {activeTab === 'inbox' && currentClub && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Inbox</h2>
              <p className="text-sm text-slate-400 mt-1">Notifications, approvals, and updates</p>
            </div>
            <div className="grid gap-4">
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Invoice #1042 awaiting approval</p>
                    <p className="text-xs text-slate-500 mt-1">Finance • 2 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">James Wilson - Hamstring strain reported</p>
                    <p className="text-xs text-slate-500 mt-1">Medical • 4 hours ago</p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Matchday checklist complete for Saturday</p>
                    <p className="text-xs text-slate-500 mt-1">Operations • 1 day ago</p>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 text-center">Full inbox functionality coming soon</p>
          </div>
        )}
        {activeTab === 'equipment' && currentClub && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Equipment</h2>
              <p className="text-sm text-slate-400 mt-1">Kit inventory, laundry, and issue tracking</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Inventory</p>
                <p className="text-2xl font-bold text-white mt-1">148</p>
                <p className="text-xs text-slate-400">items in stock</p>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Laundry</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">23</p>
                <p className="text-xs text-slate-400">items in wash</p>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Issued</p>
                <p className="text-2xl font-bold text-green-400 mt-1">42</p>
                <p className="text-xs text-slate-400">items out</p>
              </div>
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider">Low Stock</p>
                <p className="text-2xl font-bold text-red-400 mt-1">5</p>
                <p className="text-xs text-slate-400">items to reorder</p>
              </div>
            </div>
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
                  Issue Kit
                </button>
                <button className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
                  Return Kit
                </button>
                <button className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
                  Log Laundry
                </button>
                <button className="p-3 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
                  View Inventory
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-600 text-center">Full equipment management coming soon</p>
          </div>
        )}
        {activeTab === 'templates' && currentClub && (
          <TemplatesView fixtures={fixtures} />
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
      <ToastProvider>
        <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center">
          <LoadingSpinner size={28} text="Booting auth systems..." />
        </div>
      </ToastProvider>
    );
  }


  if (!session) {
    return (
      <ToastProvider>
        <AuthScreen />
      </ToastProvider>
    );
  }

  if (!ctx) {
    return (
      <ToastProvider>
        <WorkspaceGate onReady={(next) => setCtx(next)} />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <AppAuthed
        clubId={ctx.clubId}
        supabaseConfigured={true}
        onSwitchWorkspace={() => setCtx(null)}
      />
    </ToastProvider>
  );
};

export default App;
