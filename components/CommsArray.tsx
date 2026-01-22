
import React, { useState } from 'react';
import { Club } from '../types';
import { generateNewsletter, generateNewsArticle } from '../services/geminiService';
import { Radio, Newspaper, Send, Sparkles, Copy, Check, FileText, Loader2 } from 'lucide-react';
import CollapsibleSection from './CollapsibleSection';

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

  // Mobile accordion state - only one section expanded at a time on mobile
  const [expandedSection, setExpandedSection] = useState<string | null>('news');

  const handleSectionToggle = (sectionId: string, isExpanded: boolean) => {
    // Accordion behavior: if opening a section, close others
    setExpandedSection(isExpanded ? sectionId : null);
  };

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
    <div className="h-full grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-8 animate-fade-in">

        {/* PANEL 1: GLOBAL NEWS PROTOCOL */}
        <CollapsibleSection
          title="GLOBAL NEWS"
          titleHighlight="PROTOCOL"
          subtitle="Generate official club statements and press releases."
          icon={Radio}
          iconColor="text-purple-500"
          borderColor="border-purple-500/20"
          sectionId="news"
          expandedSection={expandedSection}
          onToggle={handleSectionToggle}
          defaultExpandedMobile={true}
        >
          <div className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-2 gap-2 md:gap-4">
                {['Club Statement', 'New Signing', 'Match Postponed', 'Ticket News'].map(type => (
                    <button
                        key={type}
                        onClick={() => setNewsType(type)}
                        className={`p-2 md:p-3 rounded-lg border text-xs font-bold uppercase transition-all ${
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
                    placeholder="e.g. We have signed striker John Doe from Orbital Utd for a record fee..."
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 md:p-4 text-sm text-slate-300 h-24 md:h-32 resize-none focus:border-purple-500 outline-none font-mono"
                />
            </div>

            <button
                onClick={handleGenerateNews}
                disabled={isGeneratingNews || !newsDetails}
                className="w-full py-3 min-h-[44px] bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold font-display uppercase rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
                {isGeneratingNews ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                <span className="text-sm md:text-base">RUN GENERATION</span>
            </button>

            {generatedArticle && (
                <div className="space-y-4 animate-slide-up">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
                        <h4 className="text-xs font-bold text-purple-500 uppercase mb-2">Website Article</h4>
                        <div className="h-px w-full bg-white/10 mb-3"></div>
                        <div className="text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line max-h-48 md:max-h-none overflow-y-auto">
                            {generatedArticle.article}
                        </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4">
                        <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Social Caption</h4>
                        <div className="h-px w-full bg-white/10 mb-3"></div>
                        <p className="text-xs text-slate-300 font-mono">
                            {generatedArticle.social}
                        </p>
                    </div>
                </div>
            )}
          </div>
        </CollapsibleSection>

        {/* PANEL 2: THE COMMS ARRAY (NEWSLETTER) */}
        <CollapsibleSection
          title="THE COMMS"
          titleHighlight="ARRAY"
          subtitle="Compile weekly fan briefings."
          icon={Newspaper}
          iconColor="text-amber-500"
          borderColor="border-amber-500/20"
          sectionId="newsletter"
          expandedSection={expandedSection}
          onToggle={handleSectionToggle}
        >
          <div className="flex flex-col h-full">
            <div className="flex gap-2 mb-4 md:mb-6">
                <input
                    type="text"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                    placeholder="Add topic (e.g. '3-1 Win vs Titan Rovers')"
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 md:px-4 py-2 text-sm text-white focus:border-amber-500 outline-none min-w-0"
                />
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-white/10 text-white px-4 min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/20 transition-colors flex items-center justify-center"
                >
                    +
                </button>
            </div>

            <div className="flex-1 mb-4 md:mb-6">
                <h3 className="text-[10px] font-mono text-slate-500 uppercase mb-2">Build Queue</h3>
                {newsletterItems.length === 0 ? (
                    <div className="text-center py-6 md:py-8 border border-dashed border-white/10 rounded-xl">
                        <p className="text-slate-600 text-xs font-mono">Queue Empty.</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-32 md:max-h-none overflow-y-auto">
                        {newsletterItems.map((item, i) => (
                            <div key={i} className="flex items-center gap-3 bg-white/5 px-3 py-2 rounded border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></div>
                                <span className="text-sm text-slate-200 truncate">{item}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {generatedNewsletter ? (
                <div className="flex-1 bg-white text-black p-4 md:p-6 rounded-xl overflow-y-auto font-serif shadow-inner animate-fade-in relative max-h-64 md:max-h-none">
                    <div className="absolute top-2 right-2 flex gap-2">
                         <button type="button" aria-label="Copy newsletter" title="Copy newsletter" className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"><Copy size={14} /></button>
                    </div>
                    <div className="whitespace-pre-line text-sm pr-12" dangerouslySetInnerHTML={{__html: generatedNewsletter}}></div>
                </div>
            ) : (
                 <button
                    type="button"
                    onClick={handleGenerateNewsletter}
                    disabled={newsletterItems.length === 0 || isGeneratingNewsletter}
                    className="w-full py-3 md:py-4 min-h-[44px] bg-amber-500 text-white font-bold font-display uppercase rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-auto"
                >
                    {isGeneratingNewsletter ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    <span className="text-sm md:text-base">COMPILE NEWSLETTER</span>
                </button>
            )}
          </div>
        </CollapsibleSection>
    </div>
  );
};

export default CommsArray;
