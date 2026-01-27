
import React, { useState } from 'react';
import { Club } from '../types';
import { generateNewsletter, generateNewsArticle } from '../services/geminiService';
import { Radio, Newspaper, Sparkles, Copy, Check, FileText, Loader2, RefreshCw, X, Maximize2, Minimize2 } from 'lucide-react';

interface CommsArrayProps {
  club: Club;
}

// Fullscreen Content Modal Component
const ExpandedContentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  isHtml?: boolean;
  onCopy: () => void;
  copied: boolean;
  accentColor: string;
}> = ({ isOpen, onClose, title, content, isHtml, onCopy, copied, accentColor }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b border-white/10 bg-black/40`}>
          <h3 className={`font-display font-bold text-lg ${accentColor}`}>{title}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors"
            >
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {isHtml ? (
            <div
              className="bg-white text-black p-6 rounded-xl shadow-inner newsletter-content prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-line font-sans">
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

  // Copy feedback state
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Expanded modal state
  const [expandedModal, setExpandedModal] = useState<'article' | 'social' | 'newsletter' | null>(null);

  // Full-panel expand state (for focusing on one panel)
  const [expandedPanel, setExpandedPanel] = useState<'news' | 'newsletter' | null>(null);

  const handleCopy = async (text: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(itemId);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleClearNewsletter = () => {
    setGeneratedNewsletter('');
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
    <>
      <div className={`h-full grid gap-4 md:gap-8 animate-fade-in ${
        expandedPanel ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-2'
      }`}>

          {/* PANEL 1: NEWS & ANNOUNCEMENTS */}
          {(!expandedPanel || expandedPanel === 'news') && (
          <div className={`glass-card rounded-2xl overflow-hidden flex flex-col border-purple-500/20 border ${
            expandedPanel === 'news' ? 'h-full' : ''
          }`}>
            {/* Panel Header */}
            <div className="p-4 md:p-6 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-display font-bold text-white flex items-center gap-2 md:gap-3">
                  <Radio className="text-purple-500 flex-shrink-0 animate-pulse" size={20} />
                  <span className="truncate">
                    News & <span className="text-purple-500">Announcements</span>
                  </span>
                </h2>
                <p className="text-slate-400 font-mono text-xs mt-1 truncate">Generate official club statements and press releases.</p>
              </div>
              <button
                onClick={() => setExpandedPanel(expandedPanel === 'news' ? null : 'news')}
                className="ml-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                title={expandedPanel === 'news' ? 'Minimize panel' : 'Expand panel'}
              >
                {expandedPanel === 'news' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            {/* Panel Content */}
            <div className={`p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar ${
              expandedPanel === 'news' ? '' : ''
            }`}>
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
                      placeholder="e.g. We have signed striker John Doe from City Reserves on a two-year deal..."
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 md:p-4 text-sm text-slate-300 h-24 md:h-32 resize-none focus:border-purple-500 outline-none font-mono"
                  />
              </div>

              <button
                  onClick={handleGenerateNews}
                  disabled={isGeneratingNews || !newsDetails}
                  className="w-full py-3 min-h-[44px] bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold font-display uppercase rounded-lg shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                  {isGeneratingNews ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  <span className="text-sm md:text-base">Generate Content</span>
              </button>

              {generatedArticle && (
                  <div className="space-y-4 animate-slide-up">
                      {/* Website Article */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 relative group">
                          <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold text-purple-500 uppercase">Website Article</h4>
                              <div className="flex items-center gap-1">
                                  <button
                                      type="button"
                                      onClick={() => setExpandedModal('article')}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                      title="Expand to full view"
                                  >
                                      <Maximize2 size={14} className="text-slate-400" />
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => handleCopy(generatedArticle.article, 'article')}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                      title="Copy article"
                                  >
                                      {copiedItem === 'article' ? (
                                          <Check size={14} className="text-green-500" />
                                      ) : (
                                          <Copy size={14} className="text-slate-400" />
                                      )}
                                  </button>
                              </div>
                          </div>
                          <div className="h-px w-full bg-white/10 mb-3"></div>
                          <div className={`text-xs text-slate-300 font-sans leading-relaxed whitespace-pre-line overflow-y-auto custom-scrollbar ${
                              expandedPanel === 'news' ? 'max-h-[50vh]' : 'max-h-32'
                          }`}>
                              {generatedArticle.article}
                          </div>
                          <button
                              type="button"
                              onClick={() => setExpandedModal('article')}
                              className="w-full mt-3 py-2 text-xs text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors flex items-center justify-center gap-2 border border-purple-500/20"
                          >
                              <Maximize2 size={12} />
                              View Full Article
                          </button>
                      </div>

                      {/* Social Caption */}
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 md:p-4 relative group">
                          <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold text-blue-400 uppercase">Social Caption</h4>
                              <div className="flex items-center gap-1">
                                  <button
                                      type="button"
                                      onClick={() => setExpandedModal('social')}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                      title="Expand to full view"
                                  >
                                      <Maximize2 size={14} className="text-slate-400" />
                                  </button>
                                  <button
                                      type="button"
                                      onClick={() => handleCopy(generatedArticle.social, 'social')}
                                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                      title="Copy social post"
                                  >
                                      {copiedItem === 'social' ? (
                                          <Check size={14} className="text-green-500" />
                                      ) : (
                                          <Copy size={14} className="text-slate-400" />
                                      )}
                                  </button>
                              </div>
                          </div>
                          <div className="h-px w-full bg-white/10 mb-3"></div>
                          <p className={`text-sm text-slate-300 font-mono leading-relaxed overflow-y-auto custom-scrollbar ${
                              expandedPanel === 'news' ? 'max-h-[30vh]' : 'max-h-20'
                          }`}>
                              {generatedArticle.social}
                          </p>
                      </div>

                      <button
                          type="button"
                          onClick={() => setGeneratedArticle(null)}
                          className="w-full py-2 text-xs text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                          <RefreshCw size={12} />
                          Generate Another
                      </button>
                  </div>
              )}
            </div>
            </div>
          </div>
          )}

          {/* PANEL 2: NEWSLETTER BUILDER */}
          {(!expandedPanel || expandedPanel === 'newsletter') && (
          <div className={`glass-card rounded-2xl overflow-hidden flex flex-col border-amber-500/20 border ${
            expandedPanel === 'newsletter' ? 'h-full' : ''
          }`}>
            {/* Panel Header */}
            <div className="p-4 md:p-6 border-b border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-xl font-display font-bold text-white flex items-center gap-2 md:gap-3">
                  <Newspaper className="text-amber-500 flex-shrink-0" size={20} />
                  <span className="truncate">
                    Newsletter <span className="text-amber-500">Builder</span>
                  </span>
                </h2>
                <p className="text-slate-400 font-mono text-xs mt-1 truncate">Compile weekly fan updates.</p>
              </div>
              <button
                onClick={() => setExpandedPanel(expandedPanel === 'newsletter' ? null : 'newsletter')}
                className="ml-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
                title={expandedPanel === 'newsletter' ? 'Minimize panel' : 'Expand panel'}
              >
                {expandedPanel === 'newsletter' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>

            {/* Panel Content */}
            <div className={`p-4 md:p-6 flex-1 overflow-y-auto custom-scrollbar`}>
            <div className="flex flex-col h-full">
              <div className="flex gap-2 mb-4 md:mb-6">
                  <input
                      type="text"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
                      placeholder="Add topic (e.g. '3-1 Win vs Riverside')"
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
                  <h3 className="text-[10px] font-mono text-slate-500 uppercase mb-2">Topics to Include</h3>
                  {newsletterItems.length === 0 ? (
                      <div className="text-center py-6 md:py-8 border border-dashed border-white/10 rounded-xl">
                          <p className="text-slate-600 text-xs font-mono">No topics added yet</p>
                      </div>
                  ) : (
                      <div className={`space-y-2 overflow-y-auto ${
                          expandedPanel === 'newsletter' ? 'max-h-none' : 'max-h-32 md:max-h-none'
                      }`}>
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
                  <div className="flex-1 flex flex-col gap-3 animate-fade-in">
                      {/* Newsletter Preview */}
                      <div className="relative flex-1">
                          <div className={`bg-white text-black p-4 md:p-6 rounded-xl overflow-y-auto shadow-inner custom-scrollbar ${
                              expandedPanel === 'newsletter' ? 'max-h-[60vh]' : 'max-h-40 md:max-h-48'
                          }`}>
                              <div className="newsletter-content" dangerouslySetInnerHTML={{__html: generatedNewsletter}}></div>
                          </div>
                          <button
                              type="button"
                              onClick={() => setExpandedModal('newsletter')}
                              className="w-full mt-3 py-2 text-xs text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors flex items-center justify-center gap-2 border border-amber-500/20"
                          >
                              <Maximize2 size={12} />
                              View Full Newsletter
                          </button>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                          <button
                              type="button"
                              onClick={() => {
                                  // Strip HTML tags for plain text copy
                                  const tempDiv = document.createElement('div');
                                  tempDiv.innerHTML = generatedNewsletter;
                                  handleCopy(tempDiv.textContent || '', 'newsletter-text');
                              }}
                              className="flex-1 py-2.5 min-h-[44px] bg-slate-700 text-white rounded-lg text-sm font-medium hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                              title="Copy as plain text"
                          >
                              {copiedItem === 'newsletter-text' ? (
                                  <><Check size={14} className="text-green-400" /> Copied!</>
                              ) : (
                                  <><Copy size={14} /> Copy Text</>
                              )}
                          </button>
                          <button
                              type="button"
                              onClick={() => handleCopy(generatedNewsletter, 'newsletter-html')}
                              className="flex-1 py-2.5 min-h-[44px] bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded-lg text-sm font-medium hover:bg-amber-500/30 transition-colors flex items-center justify-center gap-2"
                              title="Copy as HTML"
                          >
                              {copiedItem === 'newsletter-html' ? (
                                  <><Check size={14} className="text-green-400" /> Copied!</>
                              ) : (
                                  <><Copy size={14} /> Copy HTML</>
                              )}
                          </button>
                          <button
                              type="button"
                              onClick={handleClearNewsletter}
                              className="py-2.5 px-3 min-h-[44px] bg-white/5 text-slate-400 rounded-lg hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center"
                              title="Start over"
                          >
                              <RefreshCw size={14} />
                          </button>
                      </div>
                  </div>
              ) : (
                   <button
                      type="button"
                      onClick={handleGenerateNewsletter}
                      disabled={newsletterItems.length === 0 || isGeneratingNewsletter}
                      className="w-full py-3 md:py-4 min-h-[44px] bg-amber-500 text-white font-bold font-display uppercase rounded-lg shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-auto"
                  >
                      {isGeneratingNewsletter ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                      <span className="text-sm md:text-base">Create Newsletter</span>
                  </button>
              )}
            </div>
            </div>
          </div>
          )}
      </div>

      {/* Expanded Content Modals */}
      {generatedArticle && (
        <>
          <ExpandedContentModal
            isOpen={expandedModal === 'article'}
            onClose={() => setExpandedModal(null)}
            title="Website Article"
            content={generatedArticle.article}
            onCopy={() => handleCopy(generatedArticle.article, 'article-expanded')}
            copied={copiedItem === 'article-expanded'}
            accentColor="text-purple-500"
          />
          <ExpandedContentModal
            isOpen={expandedModal === 'social'}
            onClose={() => setExpandedModal(null)}
            title="Social Caption"
            content={generatedArticle.social}
            onCopy={() => handleCopy(generatedArticle.social, 'social-expanded')}
            copied={copiedItem === 'social-expanded'}
            accentColor="text-blue-400"
          />
        </>
      )}

      {generatedNewsletter && (
        <ExpandedContentModal
          isOpen={expandedModal === 'newsletter'}
          onClose={() => setExpandedModal(null)}
          title="Newsletter Preview"
          content={generatedNewsletter}
          isHtml={true}
          onCopy={() => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = generatedNewsletter;
            handleCopy(tempDiv.textContent || '', 'newsletter-expanded');
          }}
          copied={copiedItem === 'newsletter-expanded'}
          accentColor="text-amber-500"
        />
      )}
    </>
  );
};

export default CommsArray;
