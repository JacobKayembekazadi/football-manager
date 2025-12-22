
import React, { useState } from 'react';
import { Club, Sponsor } from '../types';
import { generateSponsorReport, generateSponsorActivation, generateRenewalPitch } from '../services/geminiService';
import { saveSponsorContent, createSponsor, deleteSponsor } from '../services/sponsorService';
import SponsorFormModal from './SponsorFormModal';
import { Briefcase, DollarSign, Calendar, TrendingUp, Mail, Share2, Loader2, Check, Lightbulb, Handshake, BarChart3, Target, Plus, Trash2 } from 'lucide-react';

interface SponsorNexusProps {
  club: Club;
  sponsors: Sponsor[];
  onRefetchSponsors?: () => Promise<void>;
}

const RevenueChart = () => (
    <div className="h-16 flex items-end gap-1 w-full opacity-50">
        {[40, 65, 45, 70, 55, 80, 60, 90, 75, 85, 95, 100].map((h, i) => (
            <div key={i} className="flex-1 bg-yellow-400 rounded-t-sm" style={{height: `${h}%`, opacity: i/12 + 0.2}}></div>
        ))}
    </div>
);

const SponsorNexus: React.FC<SponsorNexusProps> = ({ club, sponsors, onRefetchSponsors }) => {
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [activeTab, setActiveTab] = useState<'ROI' | 'CREATIVE' | 'NEGOTIATION'>('ROI');
  
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // CRUD State
  const [isSponsorModalOpen, setIsSponsorModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreateSponsor = async (sponsor: Omit<Sponsor, 'id'>) => {
    await createSponsor(club.id, sponsor);
    if (onRefetchSponsors) await onRefetchSponsors();
  };

  const handleDeleteSponsor = async (sponsorId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the sponsor
    if (!confirm('Are you sure you want to delete this sponsor?')) return;
    
    setDeletingId(sponsorId);
    try {
      await deleteSponsor(sponsorId);
      if (selectedSponsor?.id === sponsorId) {
        setSelectedSponsor(null);
      }
      if (onRefetchSponsors) await onRefetchSponsors();
    } finally {
      setDeletingId(null);
    }
  };

  const handleAction = async (action: 'REPORT' | 'ACTIVATION' | 'RENEWAL') => {
      if (!selectedSponsor) return;
      setIsGenerating(true);
      setGeneratedContent('');
      
      let result = '';
      if (action === 'REPORT') {
          result = await generateSponsorReport(club, selectedSponsor, "Recent 3-1 win vs Orbital United. Attendance up 12%.");
      } else if (action === 'ACTIVATION') {
          result = await generateSponsorActivation(club, selectedSponsor);
      } else if (action === 'RENEWAL') {
          result = await generateRenewalPitch(club, selectedSponsor);
      }
      
      setGeneratedContent(result);
      setIsGenerating(false);
  };

  const getTierColor = (tier: string) => {
      switch(tier) {
          case 'Platinum': return 'text-cyan-400 border-cyan-400/50 bg-cyan-400/10';
          case 'Gold': return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
          default: return 'text-slate-300 border-slate-500/50 bg-slate-500/10';
      }
  };

  const calculateHealth = (sponsor: Sponsor) => {
      // Mock logic: shorter contract = lower health
      const end = new Date(sponsor.contract_end).getTime();
      const now = Date.now();
      const daysLeft = (end - now) / (1000 * 60 * 60 * 24);
      
      if (daysLeft < 60 || sponsor.status === 'Negotiating') return { score: 45, color: 'text-red-500', bg: 'bg-red-500' };
      if (daysLeft < 180) return { score: 72, color: 'text-yellow-400', bg: 'bg-yellow-400' };
      return { score: 98, color: 'text-green-400', bg: 'bg-green-400' };
  };

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col">
        {/* Header & Revenue HUD */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-white glow-text">SPONSOR <span className="text-yellow-400">NEXUS</span></h2>
                    <p className="text-slate-400 font-mono text-xs mt-1">Commercial Partnerships & ROI Tracking.</p>
                </div>
                <button 
                    onClick={() => setIsSponsorModalOpen(true)}
                    data-tour="add-sponsor-btn"
                    className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-5 py-3 rounded-xl font-display font-bold uppercase text-xs hover:bg-yellow-500/20 transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:shadow-[0_0_25px_rgba(234,179,8,0.4)]"
                >
                    <Plus size={16} /> Add Sponsor
                </button>
            </div>
            
            <div className="glass-card p-4 rounded-xl border border-yellow-400/20 relative overflow-hidden flex items-center justify-between">
                <div className="relative z-10">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Projected Revenue</span>
                    <div className="text-2xl font-display font-bold text-white">£275,000</div>
                    <div className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                        <TrendingUp size={10} /> +12% YoY
                    </div>
                </div>
                <div className="w-32 h-12 relative z-0">
                    <RevenueChart />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Sponsor List (The Portfolio) */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 custom-scrollbar content-start">
                {/* Empty State */}
                {sponsors.length === 0 && (
                    <div className="col-span-2 p-12 text-center border border-dashed border-white/10 rounded-2xl">
                        <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 font-mono mb-4">No sponsors yet</p>
                        <button 
                            onClick={() => setIsSponsorModalOpen(true)}
                            className="inline-flex items-center gap-2 bg-yellow-500 text-black px-6 py-3 rounded-lg font-display font-bold uppercase text-sm hover:shadow-[0_0_20px_rgba(234,179,8,0.35)] transition-all"
                        >
                            <Plus size={16} /> Add Your First Sponsor
                        </button>
                    </div>
                )}
                {sponsors.map(sponsor => {
                    const health = calculateHealth(sponsor);
                    return (
                        <div 
                            key={sponsor.id} 
                            onClick={() => { setSelectedSponsor(sponsor); setGeneratedContent(''); setActiveTab('ROI'); }}
                            className={`glass-card p-6 rounded-xl border transition-all group relative overflow-hidden cursor-pointer ${selectedSponsor?.id === sponsor.id ? 'border-yellow-400 bg-yellow-400/5' : 'border-white/5 hover:border-yellow-400/30'}`}
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <DollarSign size={80} />
                            </div>
                            
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div className="w-12 h-12 rounded bg-gradient-to-br from-slate-800 to-black border border-white/10 flex items-center justify-center font-display font-bold text-xl text-white">
                                    {sponsor.logo_initials}
                                </div>
                                <div className="text-right flex items-start gap-2">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border block ${getTierColor(sponsor.tier)}`}>
                                        {sponsor.tier}
                                    </span>
                                    <button
                                        onClick={(e) => handleDeleteSponsor(sponsor.id, e)}
                                        disabled={deletingId === sponsor.id}
                                        className="p-1 text-red-400/40 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                        title="Delete sponsor"
                                    >
                                        {deletingId === sponsor.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="relative z-10">
                                <h3 className="text-xl font-display font-bold text-white mb-1 group-hover:text-yellow-400 transition-colors">{sponsor.name}</h3>
                                <span className="text-xs font-mono text-slate-400 uppercase">{sponsor.sector}</span>
                                
                                <div className="grid grid-cols-2 gap-4 my-6">
                                    <div>
                                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Value</span>
                                        <span className="text-lg font-mono font-bold text-white">{sponsor.value}</span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-slate-500 uppercase block mb-0.5">Health</span>
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                                <div style={{width: `${health.score}%`}} className={`h-full ${health.bg}`}></div>
                                            </div>
                                            <span className={`text-xs font-bold ${health.color}`}>{health.score}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                                    <Calendar size={12} /> Renewal: <span className={sponsor.status === 'Expiring' ? 'text-red-400 font-bold' : 'text-slate-300'}>{new Date(sponsor.contract_end).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Strategy Console (The War Room) */}
            <div className="glass-panel rounded-xl p-0 flex flex-col overflow-hidden border border-yellow-400/20 h-full">
                {selectedSponsor ? (
                    <>
                        <div className="p-4 bg-black/40 border-b border-white/5">
                            <h3 className="text-sm font-display font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Target size={16} className="text-yellow-400" />
                                Strategy Console
                            </h3>
                            <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
                                <button onClick={() => setActiveTab('ROI')} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${activeTab === 'ROI' ? 'bg-yellow-400 text-black' : 'text-slate-500 hover:text-white'}`}>
                                    <BarChart3 size={12} /> ROI
                                </button>
                                <button onClick={() => setActiveTab('CREATIVE')} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${activeTab === 'CREATIVE' ? 'bg-yellow-400 text-black' : 'text-slate-500 hover:text-white'}`}>
                                    <Lightbulb size={12} /> Ideas
                                </button>
                                <button onClick={() => setActiveTab('NEGOTIATION')} className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 ${activeTab === 'NEGOTIATION' ? 'bg-yellow-400 text-black' : 'text-slate-500 hover:text-white'}`}>
                                    <Handshake size={12} /> Pitch
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex-1 p-6 bg-black/20 overflow-y-auto custom-scrollbar relative">
                             {/* Contextual Actions based on Tab */}
                             {!generatedContent && !isGenerating && (
                                 <div className="text-center py-8">
                                     <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600 border border-white/5">
                                         {activeTab === 'ROI' && <Mail size={32} />}
                                         {activeTab === 'CREATIVE' && <Lightbulb size={32} />}
                                         {activeTab === 'NEGOTIATION' && <Handshake size={32} />}
                                     </div>
                                     <p className="text-sm text-slate-400 font-mono mb-6 max-w-[200px] mx-auto">
                                         {activeTab === 'ROI' && "Generate a value report email to prove sponsorship ROI."}
                                         {activeTab === 'CREATIVE' && "Brainstorm 3 creative activation ideas for this brand."}
                                         {activeTab === 'NEGOTIATION' && "Draft a high-stakes renewal negotiation pitch."}
                                     </p>
                                     <button 
                                        onClick={() => handleAction(activeTab === 'ROI' ? 'REPORT' : activeTab === 'CREATIVE' ? 'ACTIVATION' : 'RENEWAL')}
                                        className="px-6 py-3 bg-white/5 hover:bg-yellow-400 hover:text-black border border-white/10 hover:border-yellow-400 text-white rounded font-bold uppercase transition-all text-xs flex items-center justify-center gap-2 mx-auto"
                                     >
                                         <Share2 size={14} /> Run Generator
                                     </button>
                                 </div>
                             )}

                            {isGenerating && (
                                <div className="flex flex-col items-center justify-center h-full text-yellow-400">
                                    <Loader2 size={32} className="animate-spin mb-3" />
                                    <span className="text-xs font-mono animate-pulse">Running Strategy Simulation...</span>
                                </div>
                            )}

                            {generatedContent && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="bg-white/5 border border-white/10 rounded p-4 relative group">
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                             <button onClick={() => {navigator.clipboard.writeText(generatedContent)}} className="p-1 hover:text-white text-slate-500"><Check size={14} /></button>
                                        </div>
                                        <p className="text-xs font-mono text-slate-500 mb-2 uppercase border-b border-white/5 pb-2">
                                            {activeTab === 'ROI' ? 'Draft: Value Email' : activeTab === 'CREATIVE' ? 'Creative Brief' : 'Draft: Negotiation Pitch'}
                                        </p>
                                        <p className="text-sm font-sans text-slate-200 whitespace-pre-line leading-relaxed">
                                            {generatedContent}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                         <button 
                                            onClick={() => setGeneratedContent('')}
                                            className="flex-1 py-3 border border-white/10 rounded text-xs font-bold text-slate-400 hover:bg-white/5 transition-colors uppercase"
                                        >
                                            Discard
                                        </button>
                                        <button 
                                            onClick={async () => {
                                                if (!selectedSponsor) return;
                                                setIsSaving(true);
                                                try {
                                                    await saveSponsorContent(selectedSponsor.id, {
                                                        type: activeTab,
                                                        content: generatedContent,
                                                    });
                                                    setGeneratedContent('');
                                                    alert('Content saved successfully!');
                                                } catch (error) {
                                                    console.error('Error saving sponsor content:', error);
                                                    alert('Failed to save content. Please try again.');
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            disabled={isSaving || !generatedContent}
                                            className="flex-1 py-3 bg-yellow-400 text-black font-bold uppercase rounded hover:bg-yellow-300 transition-colors shadow-[0_0_15px_rgba(250,204,21,0.3)] flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} 
                                            {isSaving ? 'Saving...' : 'Approve & Save'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 p-8 text-center bg-black/40">
                        <Target size={48} className="mb-4 opacity-20" />
                        <p className="text-sm font-mono">Select a partner from the portfolio to access the Strategy Console.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Sponsor Form Modal */}
        <SponsorFormModal
            isOpen={isSponsorModalOpen}
            onClose={() => setIsSponsorModalOpen(false)}
            onSave={handleCreateSponsor}
        />
    </div>
  );
};

export default SponsorNexus;
