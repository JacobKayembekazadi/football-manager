/**
 * ContentTemplateModal Component
 *
 * Allows users to generate content from pre-built templates:
 * - Match Report
 * - Player Signing
 * - Training Update
 *
 * With selectable tone (Normal, Formal, Casual)
 */

import React, { useState } from 'react';
import {
  X,
  ClipboardList,
  UserPlus,
  Dumbbell,
  Sparkles,
  Loader2,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Club, ContentItem } from '../types';
import {
  generateFromTemplate,
  getContentTemplates,
  ContentTemplate,
  ContentTone,
  TemplateContext,
} from '../services/geminiService';
import { createContentItem } from '../services/contentService';
import { useToast } from './Toast';

interface ContentTemplateModalProps {
  club: Club;
  onClose: () => void;
  onContentCreated?: (content: ContentItem) => void;
}

const templateIcons: Record<ContentTemplate, React.ReactNode> = {
  match_report: <ClipboardList size={24} />,
  player_signing: <UserPlus size={24} />,
  training_update: <Dumbbell size={24} />,
};

const ContentTemplateModal: React.FC<ContentTemplateModalProps> = ({
  club,
  onClose,
  onContentCreated,
}) => {
  const toast = useToast();
  const [step, setStep] = useState<'select' | 'form'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [tone, setTone] = useState<ContentTone>('normal');
  const [context, setContext] = useState<TemplateContext>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);

  const templates = getContentTemplates();

  const handleSelectTemplate = (templateId: ContentTemplate) => {
    setSelectedTemplate(templateId);
    setContext({});
    setGeneratedContent(null);
    setStep('form');
  };

  const handleGenerate = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      const content = await generateFromTemplate(club, selectedTemplate, context, tone);
      setGeneratedContent(content);
      toast.success('Content generated successfully!');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveContent = async () => {
    if (!generatedContent || !selectedTemplate) return;

    try {
      const contentItem = await createContentItem(club.id, {
        club_id: club.id,
        type: selectedTemplate === 'match_report' ? 'REPORT' : 'ARTICLE',
        body: generatedContent,
        platform: 'Website',
        status: 'DRAFT',
      });
      toast.success('Content saved as draft!');
      onContentCreated?.(contentItem);
      onClose();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save content.');
    }
  };

  const renderForm = () => {
    if (!selectedTemplate) return null;

    if (selectedTemplate === 'match_report') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Opponent *</label>
              <input
                type="text"
                value={context.opponent || ''}
                onChange={(e) => setContext({ ...context, opponent: e.target.value })}
                placeholder="e.g., Riverside FC"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Score *</label>
              <input
                type="text"
                value={context.score || ''}
                onChange={(e) => setContext({ ...context, score: e.target.value })}
                placeholder="e.g., 3-1"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Scorers</label>
            <input
              type="text"
              value={context.scorers?.join(', ') || ''}
              onChange={(e) => setContext({ ...context, scorers: e.target.value.split(',').map(s => s.trim()) })}
              placeholder="e.g., Smith (23'), Jones (45'), Davies (78')"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Venue</label>
              <select
                value={context.venue || 'Home'}
                onChange={(e) => setContext({ ...context, venue: e.target.value })}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              >
                <option value="Home">Home</option>
                <option value="Away">Away</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Competition</label>
              <input
                type="text"
                value={context.competition || ''}
                onChange={(e) => setContext({ ...context, competition: e.target.value })}
                placeholder="e.g., League, Cup"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Man of the Match</label>
            <input
              type="text"
              value={context.manOfTheMatch || ''}
              onChange={(e) => setContext({ ...context, manOfTheMatch: e.target.value })}
              placeholder="e.g., Marcus Smith"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Key Moments / Highlights</label>
            <textarea
              value={context.highlights || ''}
              onChange={(e) => setContext({ ...context, highlights: e.target.value })}
              placeholder="e.g., Red card at 60', penalty saved, last-minute winner..."
              rows={2}
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none resize-none"
            />
          </div>
        </div>
      );
    }

    if (selectedTemplate === 'player_signing') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Player Name *</label>
              <input
                type="text"
                value={context.playerName || ''}
                onChange={(e) => setContext({ ...context, playerName: e.target.value })}
                placeholder="e.g., James Wilson"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Position *</label>
              <input
                type="text"
                value={context.position || ''}
                onChange={(e) => setContext({ ...context, position: e.target.value })}
                placeholder="e.g., Striker"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Previous Club</label>
              <input
                type="text"
                value={context.previousClub || ''}
                onChange={(e) => setContext({ ...context, previousClub: e.target.value })}
                placeholder="e.g., City Reserves"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Shirt Number</label>
              <input
                type="text"
                value={context.shirtNumber || ''}
                onChange={(e) => setContext({ ...context, shirtNumber: e.target.value })}
                placeholder="e.g., 9"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Contract Length</label>
            <input
              type="text"
              value={context.contractLength || ''}
              onChange={(e) => setContext({ ...context, contractLength: e.target.value })}
              placeholder="e.g., 2 years, Until end of season"
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
            />
          </div>
        </div>
      );
    }

    if (selectedTemplate === 'training_update') {
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Session Type</label>
              <select
                value={context.sessionType || 'Regular training'}
                onChange={(e) => setContext({ ...context, sessionType: e.target.value })}
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              >
                <option value="Regular training">Regular Training</option>
                <option value="Match preparation">Match Preparation</option>
                <option value="Recovery session">Recovery Session</option>
                <option value="Set pieces">Set Piece Practice</option>
                <option value="Fitness testing">Fitness Testing</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Focus Area</label>
              <input
                type="text"
                value={context.focusArea || ''}
                onChange={(e) => setContext({ ...context, focusArea: e.target.value })}
                placeholder="e.g., Pressing, finishing"
                className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Player Updates</label>
            <textarea
              value={context.playerUpdates || ''}
              onChange={(e) => setContext({ ...context, playerUpdates: e.target.value })}
              placeholder="e.g., Smith back in full training, Jones working with physio..."
              rows={2}
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Manager Quotes (optional)</label>
            <textarea
              value={context.managerQuotes || ''}
              onChange={(e) => setContext({ ...context, managerQuotes: e.target.value })}
              placeholder="What did the manager say about training?"
              rows={2}
              className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-green-500 outline-none resize-none"
            />
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-[#0a0a0a] rounded-2xl border border-green-500/30 shadow-[0_0_50px_rgba(34,197,94,0.1)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-white/5 border border-white/10 text-green-500">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-white text-lg">Content Templates</h3>
              <p className="text-xs text-slate-500">Generate professional content quickly</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400 mb-6">
                Choose a template to get started. Each template is designed to sound like authentic club communications.
              </p>

              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className="w-full p-4 rounded-xl border border-white/10 hover:border-green-500/50 bg-slate-800/30 hover:bg-slate-800/50 transition-all flex items-center gap-4 text-left group"
                >
                  <div className="p-3 rounded-lg bg-green-500/10 text-green-500 group-hover:bg-green-500/20 transition-colors">
                    {templateIcons[template.id]}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{template.label}</h4>
                    <p className="text-sm text-slate-400">{template.description}</p>
                  </div>
                  <ChevronRight size={20} className="text-slate-500 group-hover:text-green-500 transition-colors" />
                </button>
              ))}
            </div>
          )}

          {step === 'form' && selectedTemplate && (
            <div className="space-y-6">
              {/* Back button */}
              <button
                onClick={() => {
                  setStep('select');
                  setGeneratedContent(null);
                }}
                className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
              >
                <ChevronRight size={16} className="rotate-180" />
                Back to templates
              </button>

              {/* Template title */}
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                  {templateIcons[selectedTemplate]}
                </div>
                <h4 className="font-semibold text-white text-lg">
                  {templates.find((t) => t.id === selectedTemplate)?.label}
                </h4>
              </div>

              {/* Tone selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">Tone</label>
                <div className="flex gap-2">
                  {(['normal', 'formal', 'casual'] as ContentTone[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        tone === t
                          ? 'bg-green-500 text-black'
                          : 'bg-slate-800/50 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Template form */}
              {renderForm()}

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 bg-green-500 text-black font-semibold rounded-lg hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate Content
                  </>
                )}
              </button>

              {/* Generated content preview */}
              {generatedContent && (
                <div className="space-y-4">
                  <label className="block text-xs text-slate-400">Generated Content</label>
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 max-h-64 overflow-y-auto">
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{generatedContent}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleGenerate}
                      disabled={isGenerating}
                      className="flex-1 py-2 border border-white/10 text-slate-300 rounded-lg hover:bg-white/5 transition-colors"
                    >
                      Regenerate
                    </button>
                    <button
                      onClick={handleSaveContent}
                      className="flex-1 py-2 bg-blue-500 text-black font-semibold rounded-lg hover:bg-blue-400 transition-colors"
                    >
                      Save as Draft
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentTemplateModal;
