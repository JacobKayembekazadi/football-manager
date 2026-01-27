import React, { useState } from 'react';
import { Club, Fixture, Player } from '../types';
import { 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Download, 
  Wand2, 
  Trophy, 
  User, 
  Megaphone, 
  Sparkles,
  Palette,
  RefreshCw,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { 
  generateMatchdayGraphic, 
  generateResultGraphic, 
  generatePlayerSpotlight, 
  generateAnnouncementGraphic,
  generateCustomImage,
  ImageGenerationResult 
} from '../services/geminiService';

interface ImageGeneratorModalProps {
  club: Club;
  fixtures: Fixture[];
  onClose: () => void;
}

type GeneratorTab = 'matchday' | 'result' | 'player' | 'announcement' | 'custom';

const ImageGeneratorModal: React.FC<ImageGeneratorModalProps> = ({ club, fixtures, onClose }) => {
  const [activeTab, setActiveTab] = useState<GeneratorTab>('matchday');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<ImageGenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Form states
  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [graphicStyle, setGraphicStyle] = useState<'hype' | 'minimal' | 'retro' | 'neon'>('neon');
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementSubtitle, setAnnouncementSubtitle] = useState('');
  const [announcementType, setAnnouncementType] = useState<'signing' | 'news' | 'event' | 'achievement'>('news');
  const [customPrompt, setCustomPrompt] = useState('');

  const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED');
  const completedFixtures = fixtures.filter(f => f.status === 'COMPLETED');

  const tabs = [
    { id: 'matchday' as const, label: 'Matchday', icon: Zap, description: 'Pre-match hype graphics' },
    { id: 'result' as const, label: 'Result', icon: Trophy, description: 'Post-match scoreline' },
    { id: 'player' as const, label: 'Player Card', icon: User, description: 'Stats spotlight' },
    { id: 'announcement' as const, label: 'Announcement', icon: Megaphone, description: 'News & events' },
    { id: 'custom' as const, label: 'Custom', icon: Sparkles, description: 'Your own prompt' },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      let result: ImageGenerationResult;

      switch (activeTab) {
        case 'matchday': {
          const fixture = fixtures.find(f => f.id === selectedFixtureId);
          if (!fixture) throw new Error('Please select a fixture');
          result = await generateMatchdayGraphic(club, fixture, graphicStyle);
          break;
        }
        case 'result': {
          const fixture = fixtures.find(f => f.id === selectedFixtureId);
          if (!fixture) throw new Error('Please select a completed fixture');
          result = await generateResultGraphic(club, fixture);
          break;
        }
        case 'player': {
          const player = club.players.find(p => p.id === selectedPlayerId);
          if (!player) throw new Error('Please select a player');
          result = await generatePlayerSpotlight(club, player);
          break;
        }
        case 'announcement': {
          if (!announcementTitle.trim()) throw new Error('Please enter a headline');
          result = await generateAnnouncementGraphic(club, announcementTitle, announcementSubtitle, announcementType);
          break;
        }
        case 'custom': {
          if (!customPrompt.trim()) throw new Error('Please enter a prompt');
          result = await generateCustomImage(club, customPrompt);
          break;
        }
        default:
          throw new Error('Invalid tab');
      }

      setGeneratedImage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;

    const link = document.createElement('a');
    link.href = `data:${generatedImage.mimeType};base64,${generatedImage.imageBase64}`;
    link.download = `${club.slug}-${activeTab}-${Date.now()}.png`;
    link.click();
  };

  const handleCopyBase64 = async () => {
    if (!generatedImage) return;
    await navigator.clipboard.writeText(generatedImage.imageBase64);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderFormContent = () => {
    switch (activeTab) {
      case 'matchday':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Select Fixture</label>
              <select
                value={selectedFixtureId}
                onChange={(e) => setSelectedFixtureId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-400 outline-none"
              >
                <option value="">Choose upcoming match...</option>
                {upcomingFixtures.map(f => (
                  <option key={f.id} value={f.id}>
                    vs {f.opponent} ({f.venue}) - {new Date(f.kickoff_time).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Style</label>
              <div className="grid grid-cols-2 gap-2">
                {(['neon', 'hype', 'minimal', 'retro'] as const).map(style => (
                  <button
                    key={style}
                    onClick={() => setGraphicStyle(style)}
                    className={`px-4 py-3 rounded-lg border text-sm font-bold uppercase transition-all ${
                      graphicStyle === style
                        ? 'bg-blue-500/20 border-blue-400 text-blue-400'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'result':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Select Completed Match</label>
              <select
                value={selectedFixtureId}
                onChange={(e) => setSelectedFixtureId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-400 outline-none"
              >
                <option value="">Choose completed match...</option>
                {completedFixtures.slice(0, 10).map(f => (
                  <option key={f.id} value={f.id}>
                    vs {f.opponent} ({f.result_home}-{f.result_away}) - {new Date(f.kickoff_time).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'player':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Select Player</label>
              <select
                value={selectedPlayerId}
                onChange={(e) => setSelectedPlayerId(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-400 outline-none"
              >
                <option value="">Choose player...</option>
                {club.players.map(p => (
                  <option key={p.id} value={p.id}>
                    #{p.number} {p.name} ({p.position}) - Form: {p.form}
                  </option>
                ))}
              </select>
            </div>

            {selectedPlayerId && (
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <p className="text-xs text-slate-400 font-mono">
                  Preview: Stats card with radar chart, player details, and club branding.
                </p>
              </div>
            )}
          </div>
        );

      case 'announcement':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Announcement Type</label>
              <div className="grid grid-cols-2 gap-2">
                {(['news', 'signing', 'event', 'achievement'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setAnnouncementType(type)}
                    className={`px-4 py-2 rounded-lg border text-xs font-bold uppercase transition-all ${
                      announcementType === type
                        ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Headline</label>
              <input
                type="text"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="e.g., NEW SIGNING INCOMING"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-amber-500 outline-none placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Subtitle (Optional)</label>
              <input
                type="text"
                value={announcementSubtitle}
                onChange={(e) => setAnnouncementSubtitle(e.target.value)}
                placeholder="e.g., Welcome to the family..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-amber-500 outline-none placeholder:text-slate-600"
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-2">Your Prompt</label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe what you want to generate... e.g., 'A dramatic training session silhouette with fog and stadium lights'"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-purple-500 outline-none placeholder:text-slate-600 h-32 resize-none"
              />
            </div>

            <div className="bg-white/5 p-3 rounded-lg border border-white/10">
              <p className="text-[10px] text-slate-400 font-mono">
                💡 Tip: Be specific about style, mood, colors, and composition. Club colors will be automatically incorporated.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative bg-[#0a0a0a] w-full max-w-5xl rounded-2xl border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-[0_0_20px_rgba(188,19,254,0.4)]">
              <ImageIcon size={24} className="text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-xl uppercase tracking-wider">AI Image Lab</h3>
              <p className="text-xs font-mono text-slate-400">Powered by Gemini 2.5 Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          {/* Mobile Tabs - Horizontal scroll */}
          <div className="md:hidden flex gap-2 p-3 border-b border-white/10 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setGeneratedImage(null);
                  setError(null);
                }}
                className={`flex-shrink-0 px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 border border-white/20 text-white'
                    : 'text-slate-400 hover:bg-white/5'
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? 'text-blue-400' : ''} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Desktop Sidebar - Tabs */}
          <div className="hidden md:block w-64 border-r border-white/10 p-4 space-y-2 bg-black/20">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setGeneratedImage(null);
                  setError(null);
                }}
                className={`w-full p-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeTab === tab.id
                    ? 'bg-white/10 border border-white/20 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-400' : ''} />
                <div className="text-left">
                  <p className="text-sm font-bold">{tab.label}</p>
                  <p className="text-[10px] text-slate-500">{tab.description}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Form Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Palette size={14} className="text-purple-500" />
                  Configuration
                </h4>
                {renderFormContent()}
              </div>

              {/* Generated Image Preview */}
              {generatedImage && (
                <div className="space-y-4">
                  <h4 className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={14} className="text-green-500" />
                    Generated Output
                  </h4>
                  
                  <div className="relative group">
                    <img
                      src={`data:${generatedImage.mimeType};base64,${generatedImage.imageBase64}`}
                      alt="Generated graphic"
                      className="w-full rounded-xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                    />
                    
                    {/* Overlay Actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-4">
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-blue-500 text-black font-bold rounded-lg flex items-center gap-2 hover:scale-105 transition-transform"
                      >
                        <Download size={16} />
                        Download
                      </button>
                      <button
                        onClick={handleCopyBase64}
                        className="px-4 py-2 bg-white/10 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors"
                      >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? 'Copied!' : 'Copy Base64'}
                      </button>
                    </div>
                  </div>

                  {generatedImage.description && (
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                      <p className="text-xs text-slate-300 font-mono">{generatedImage.description}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-white/10 bg-black/30 flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                AI Image Generation Ready
              </div>
              
              <div className="flex gap-3">
                {generatedImage && (
                  <button
                    onClick={() => {
                      setGeneratedImage(null);
                      setError(null);
                    }}
                    className="px-4 py-2 bg-white/10 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors text-sm"
                  >
                    <RefreshCw size={16} />
                    New
                  </button>
                )}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-lg flex items-center gap-2 hover:shadow-[0_0_20px_rgba(188,19,254,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-wider"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 size={18} />
                      Generate Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageGeneratorModal;








