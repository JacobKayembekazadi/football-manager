
import React, { useState } from 'react';
import { ContentItem, Fixture, Club, ContentGenStatus } from '../types';
import ContentCard from './ContentCard';
import ContentEditorModal from './ContentEditorModal';
import ImageGeneratorModal from './ImageGeneratorModal';
import { Sparkles, Loader2, LayoutGrid, Kanban, Filter, Zap, CheckCircle2, Send, Clock, Image as ImageIcon, Plus } from 'lucide-react';

interface ContentPipelineProps {
  contentItems: ContentItem[];
  fixtures: Fixture[];
  club: Club;
  generateStatus: ContentGenStatus;
  onManualGenerate: () => Promise<void>;
  onUpdateContent: (updatedItem: ContentItem) => void;
  onDeleteContent?: (contentId: string) => Promise<void>;
}

const ContentPipeline: React.FC<ContentPipelineProps> = ({ 
  contentItems, 
  fixtures, 
  club,
  generateStatus, 
  onManualGenerate,
  onUpdateContent,
  onDeleteContent
}) => {
  const isGenerating = generateStatus === 'generating';
  const [viewMode, setViewMode] = useState<'GRID' | 'PIPELINE'>('PIPELINE');
  const [filterType, setFilterType] = useState<'ALL' | 'SOCIAL' | 'WEB' | 'GRAPHICS'>('ALL');
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [showImageGenerator, setShowImageGenerator] = useState(false);

  // Filter Logic
  const filteredItems = contentItems.filter(item => {
      if (filterType === 'ALL') return true;
      if (filterType === 'SOCIAL') return item.type === 'SOCIAL';
      if (filterType === 'WEB') return item.type === 'PREVIEW' || item.type === 'REPORT' || item.type === 'ARTICLE';
      if (filterType === 'GRAPHICS') return item.type === 'GRAPHIC_COPY';
      return true;
  });

  const draftItems = filteredItems.filter(i => i.status === 'DRAFT');
  const approvedItems = filteredItems.filter(i => i.status === 'APPROVED');
  const publishedItems = filteredItems.filter(i => i.status === 'PUBLISHED');

  const StatsCard = ({ label, value, icon: Icon, color }: any) => (
      <div className="glass-card p-3 md:p-4 rounded-xl border border-white/5 flex items-center gap-3 md:gap-4 min-w-[120px] flex-1 md:flex-none">
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center bg-white/5 ${color} flex-shrink-0`}>
              <Icon size={16} className="md:w-5 md:h-5" />
          </div>
          <div className="min-w-0">
              <p className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase truncate">{label}</p>
              <p className="text-lg md:text-xl font-display font-bold text-white">{value}</p>
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
        {/* Header HUD */}
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Title row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl md:text-3xl font-display font-bold text-white glow-text">HOLO-<span className="text-amber-500">CONTENT</span></h2>
                    <p className="text-slate-400 font-mono text-xs mt-1">Content Pipeline & Workflow Automation.</p>
                </div>

                {/* Action buttons - moved to be on same row as title on larger screens */}
                <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                    <button
                        type="button"
                        onClick={() => setShowImageGenerator(true)}
                        className="flex items-center justify-center gap-2 bg-purple-500/10 border border-purple-500/50 text-purple-500 px-3 md:px-5 py-3 md:py-4 rounded-xl font-display font-bold uppercase hover:bg-purple-500/20 transition-all shadow-[0_0_15px_rgba(168,85,247,0.2)] hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] flex-1 sm:flex-none min-h-[44px] text-xs md:text-sm"
                    >
                        <ImageIcon size={18} />
                        <span className="hidden xs:inline">AI</span> Graphics
                    </button>
                    <button
                        type="button"
                        onClick={onManualGenerate}
                        disabled={isGenerating}
                        className="flex items-center justify-center gap-2 bg-amber-500/10 border border-amber-500/50 text-amber-500 px-3 md:px-5 py-3 md:py-4 rounded-xl font-display font-bold uppercase hover:bg-amber-500/20 transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none min-h-[44px] text-xs md:text-sm"
                    >
                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                        {isGenerating ? 'RUNNING...' : 'SCOUT'}
                    </button>
                </div>
            </div>

            {/* Stats row - horizontal scroll on mobile */}
            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0 md:overflow-visible custom-scrollbar">
                <StatsCard label="Pending" value={draftItems.length} icon={Clock} color="text-amber-400" />
                <StatsCard label="Ready" value={approvedItems.length} icon={CheckCircle2} color="text-green-500" />
                <StatsCard label="Live" value={publishedItems.length} icon={Send} color="text-blue-400" />
            </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 custom-scrollbar">
                <Filter size={16} className="text-slate-500 ml-2 mr-2" />
                {['ALL', 'SOCIAL', 'WEB', 'GRAPHICS'].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all whitespace-nowrap ${filterType === type ? 'bg-white/10 text-white border border-white/20' : 'text-slate-500 hover:text-white'}`}
                    >
                        {type}
                    </button>
                ))}
            </div>

            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                <button 
                    onClick={() => setViewMode('GRID')}
                    className={`p-2 rounded transition-all ${viewMode === 'GRID' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                    <LayoutGrid size={16} />
                </button>
                <button 
                    onClick={() => setViewMode('PIPELINE')}
                    className={`p-2 rounded transition-all ${viewMode === 'PIPELINE' ? 'bg-white/10 text-white' : 'text-slate-500 hover:text-white'}`}
                >
                    <Kanban size={16} />
                </button>
            </div>
        </div>
        
        {/* Main View Area */}
        <div className="flex-1 min-h-0 relative">
            
            {/* GRID VIEW */}
            {viewMode === 'GRID' && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3 overflow-y-auto h-full pr-2 custom-scrollbar content-start">
                    {filteredItems.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(item => {
                        const fixture = fixtures.find(f => f.id === item.fixture_id);
                        return (
                            <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer">
                                <ContentCard item={item} fixture={fixture} />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* PIPELINE VIEW */}
            {viewMode === 'PIPELINE' && (
                <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 h-full min-h-[400px] md:min-h-[500px] overflow-x-auto md:overflow-visible pb-4 md:pb-0 custom-scrollbar snap-x snap-mandatory md:snap-none">
                    
                    {/* Draft Column */}
                    <div className="flex flex-col bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden min-w-[280px] md:min-w-0 snap-start">
                        <div className="p-4 border-b border-white/5 bg-amber-500/5 flex justify-between items-center">
                            <span className="text-xs font-bold font-display uppercase text-amber-500">Drafting</span>
                            <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 rounded-full">{draftItems.length}</span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            {draftItems.map(item => (
                                <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                     <ContentCard item={item} fixture={fixtures.find(f => f.id === item.fixture_id)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Approved Column */}
                    <div className="flex flex-col bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden min-w-[280px] md:min-w-0 snap-start">
                        <div className="p-4 border-b border-white/5 bg-green-500/5 flex justify-between items-center">
                            <span className="text-xs font-bold font-display uppercase text-green-500">Approved / Ready</span>
                            <span className="text-[10px] bg-green-500/20 text-green-500 px-2 rounded-full">{approvedItems.length}</span>
                        </div>
                         <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            {approvedItems.map(item => (
                                <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer opacity-80 hover:opacity-100 transition-opacity">
                                     <ContentCard item={item} fixture={fixtures.find(f => f.id === item.fixture_id)} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Published Column */}
                    <div className="flex flex-col bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden min-w-[280px] md:min-w-0 snap-start">
                        <div className="p-4 border-b border-white/5 bg-blue-500/5 flex justify-between items-center">
                            <span className="text-xs font-bold font-display uppercase text-blue-400">Published</span>
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 rounded-full">{publishedItems.length}</span>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            {publishedItems.map(item => (
                                <div key={item.id} onClick={() => setSelectedItem(item)} className="cursor-pointer opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0">
                                     <ContentCard item={item} fixture={fixtures.find(f => f.id === item.fixture_id)} />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {filteredItems.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center text-slate-600 mb-4 border border-white/5">
                        <Sparkles size={32} />
                    </div>
                    <p className="text-slate-400 font-mono text-sm mb-4">No content yet</p>
                    <button
                        onClick={onManualGenerate}
                        disabled={isGenerating}
                        className="inline-flex items-center gap-2 bg-amber-500 text-black px-6 py-3 rounded-lg font-display font-bold uppercase text-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-all disabled:opacity-50"
                    >
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        Generate Your First Content
                    </button>
                </div>
            )}
        </div>

        {/* Editor Modal */}
        {selectedItem && (
            <ContentEditorModal 
                item={selectedItem} 
                club={club}
                onClose={() => setSelectedItem(null)}
                onSave={onUpdateContent}
                onDelete={async (contentId) => {
                    if (onDeleteContent) {
                        await onDeleteContent(contentId);
                    }
                    setSelectedItem(null);
                }}
            />
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

export default ContentPipeline;
