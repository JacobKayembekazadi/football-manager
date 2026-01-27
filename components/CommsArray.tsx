
import React, { useState } from 'react';
import { Club } from '../types';
import { generateNewsletter, generateNewsArticle } from '../services/geminiService';
import { Radio, Newspaper, Send, Sparkles, Copy, Check, FileText, Loader2 } from 'lucide-react';

interface CommsArrayProps {
  club: Club;
}

const CommsArray: React.FC<CommsArrayProps> = ({ club }) => {
  // Global News State
  const [newsType, setNewsType] = useState('Club Statement');
  const [newsDetails, setNewsDetails] = useState('');
  const [generatedArticle, setGeneratedArticle] = useState<{article: string, social: string} | null>(null);
  const [isGeneratingNews, setIsGeneratingNews] = useState(false);

  // Newsletter State
  const [newsletterItems, setNewsletterItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [generatedNewsletter, setGeneratedNewsletter] = useState('');
  const [isGeneratingNewsletter, setIsGeneratingNewsletter] = useState(false);

  // --- Handlers ---

  const handleGenerateNews = async () => {
      if (!newsDetails) return;
      setIsGeneratingNews(true);
      const result = await generateNewsArticle(club, newsType, newsDetails);
      setGeneratedArticle(result);
      setIsGeneratingNews(false);
  };

  const handleAddItem = () => {
      if (newItem.trim()) {
          setNewsletterItems(prev => [...prev, newItem]);
          setNewItem('');
      }
  };

  const handleGenerateNewsletter = async () => {
      if (newsletterItems.length === 0) return;
      setIsGeneratingNewsletter(true);
      const result = await generateNewsletter(club, newsletterItems);
      setGeneratedNewsletter(result);
      setIsGeneratingNewsletter(false);
  };

  return (
    <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-8 animate-fade-in">

        {/* PANEL 1: NEWS & ANNOUNCEMENTS */}
        <div className="glass-card rounded-2xl p-0 overflow-hidden flex flex-col border border-purple-500/20 max-h-[calc(100vh-200px)]">
            <div className="p-6 border-b border-white/5 bg-black/40 flex-shrink-0">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                    <Radio className="text-purple-500" />
                    News & <span className="text-purple-500">Announcements</span>
                </h2>
                <p className="text-slate-400 font-mono text-xs mt-1">Generate official club statements and press releases.</p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6 min-h-0">
                <div className="grid grid-cols-2 gap-4">
                    {['Club Statement', 'New Signing', 'Match Postponed', 'Ticket News'].map(type => (
                        <button
                            key={type}
                            onClick={() => setNewsType(type)}
                            className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all ${
                                newsType === type
                                ? 'bg-purple-500/20 border-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                                : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                            }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>

                <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">Key Details</label>
                    <textarea
                        value={newsDetails}
                        onChange={(e) => setNewsDetails(e.target.value)}
                        placeholder="e.g. We have signed striker John Doe from City Reserves on a two-year deal..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm text-slate-300 h-32 resize-none focus:border-purple-500 outline-none font-mono"
                    />
                </div>

                <button
                    onClick={handleGenerateNews}
                    disabled={isGeneratingNews || !newsDetails}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold font-display uppercase rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {isGeneratingNews ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    Generate Content
                </button>

                {generatedArticle && (
                    <div className="space-y-4 animate-slide-up">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-[250px] overflow-y-auto custom-scrollbar">
                            <h4 className="text-xs font-bold text-purple-500 uppercase mb-2 sticky top-0 bg-[#0a0a0a] py-1">Website Article</h4>
                            <div className="h-px w-full bg-white/10 mb-3"></div>
                            <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line">
                                {generatedArticle.article}
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-h-[150px] overflow-y-auto custom-scrollbar">
                            <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 sticky top-0 bg-[#0a0a0a] py-1">Social Caption</h4>
                            <div className="h-px w-full bg-white/10 mb-3"></div>
                            <p className="text-xs text-slate-300 font-mono">
                                {generatedArticle.social}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* PANEL 2: NEWSLETTER BUILDER */}
        <div className="glass-card rounded-2xl p-0 overflow-hidden flex flex-col border border-amber-500/20 max-h-[calc(100vh-200px)]">
            <div className="p-6 border-b border-white/5 bg-black/40 flex-shrink-0">
                <h2 className="text-xl font-display font-bold text-white flex items-center gap-3">
                    <Newspaper className="text-amber-500" />
                    Newsletter <span className="text-amber-500">Builder</span>
                </h2>
                <p className="text-slate-400 font-mono text-xs mt-1">Compile weekly fan updates.</p>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar flex flex-col min-h-0">
                <div className="flex gap-2 mb-6 flex-shrink-0">
                    <input
                        type="text"
                        value={newItem}
                        onChange={(e) => setNewItem(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                        placeholder="Add topic (e.g. '3-1 Win vs Riverside')"
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                    <button onClick={handleAddItem} className="bg-white/10 text-white px-4 rounded-lg hover:bg-white/20 transition-colors">
                        +
                    </button>
                </div>

                <div className="flex-shrink-0 mb-6">
                    <h3 className="text-[10px] font-mono text-slate-500 uppercase mb-2">Topics to Include</h3>
                    {newsletterItems.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                            <p className="text-slate-600 text-xs font-mono">No topics added yet</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                            {newsletterItems.map((item, i) => (
                                <div key={i} className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded border border-white/5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                    <span className="text-sm text-slate-200">{item}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {generatedNewsletter ? (
                    <div className="flex-1 bg-white text-black p-6 rounded-xl overflow-y-auto font-serif shadow-inner animate-fade-in relative min-h-[200px] max-h-[300px]">
                        <div className="absolute top-2 right-2 flex gap-2">
                             <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><Copy size={14} /></button>
                        </div>
                        <div className="whitespace-pre-line text-sm" dangerouslySetInnerHTML={{__html: generatedNewsletter}}></div>
                    </div>
                ) : (
                     <button
                        onClick={handleGenerateNewsletter}
                        disabled={newsletterItems.length === 0 || isGeneratingNewsletter}
                        className="w-full py-4 bg-amber-500 text-white font-bold font-display uppercase rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-auto flex-shrink-0"
                    >
                        {isGeneratingNewsletter ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                        Create Newsletter
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};

export default CommsArray;
