import React, { useState } from 'react';
import { Club, ContentItem, Fixture, ContentGenStatus, ContentType } from '../types';
import CommsArray from './CommsArray';
import ContentPipeline from './ContentPipeline';
import { FileText, Image, Calendar, Loader2, Plus, Sparkles } from 'lucide-react';
import { generateContent } from '../services/geminiService';
import { createContentItem } from '../services/contentService';

interface ContentHubProps {
    club: Club;
    contentItems: ContentItem[];
    fixtures: Fixture[];
    generateStatus: ContentGenStatus;
    onManualGenerate: () => Promise<void>;
    onUpdateContent: (updatedItem: ContentItem) => void;
    onDeleteContent?: (contentId: string) => Promise<void>;
    onContentCreated?: () => Promise<void>;
}

type SubTab = 'posts' | 'assets' | 'schedule';

const ContentHub: React.FC<ContentHubProps> = ({
    club,
    contentItems,
    fixtures,
    generateStatus,
    onManualGenerate,
    onUpdateContent,
    onDeleteContent,
    onContentCreated,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<SubTab>('posts');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatingSlot, setGeneratingSlot] = useState<string | null>(null);

    // Handle creating content for a specific fixture and slot
    const handleCreateContent = async (fixture: Fixture, slotType: 'pre' | 'matchday' | 'post') => {
        const slotKey = `${fixture.id}-${slotType}`;
        setGeneratingSlot(slotKey);

        try {
            // Map slot type to content type
            const contentType: ContentType = slotType === 'pre' ? 'PREVIEW' : slotType === 'post' ? 'REPORT' : 'SOCIAL';
            const platform = contentType === 'SOCIAL' ? 'Twitter' : 'Website';

            // Generate content using AI
            const body = await generateContent(club, fixture, contentType);

            // Create content item in database
            await createContentItem(club.id, {
                club_id: club.id,
                fixture_id: fixture.id,
                type: contentType,
                platform,
                body,
                status: 'DRAFT',
            });

            // Notify parent to refetch content
            if (onContentCreated) {
                await onContentCreated();
            }
        } catch (error) {
            console.error('Error creating content:', error);
            alert('Failed to generate content. Please try again.');
        } finally {
            setGeneratingSlot(null);
        }
    };

    // Handle "Add Content" button - creates content for next upcoming fixture
    const handleAddContent = async () => {
        const upcomingFixtures = fixtures.filter(f => f.status === 'SCHEDULED');
        if (upcomingFixtures.length === 0) {
            alert('No upcoming fixtures to create content for. Add a fixture first!');
            return;
        }

        setIsGenerating(true);
        try {
            // Generate a preview for the next fixture
            const nextFixture = upcomingFixtures[0];
            await handleCreateContent(nextFixture, 'pre');
        } finally {
            setIsGenerating(false);
        }
    };

    const subTabs: { id: SubTab; label: string; icon: React.ElementType }[] = [
        { id: 'posts', label: 'Posts', icon: FileText },
        { id: 'assets', label: 'Assets', icon: Image },
        { id: 'schedule', label: 'Schedule', icon: Calendar },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Sub-tab Navigation (FM Mobile style) */}
            <div className="flex border-b border-slate-700/50 bg-slate-800/30 -mx-4 md:-mx-8 px-4 md:px-8 mb-6">
                {subTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeSubTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSubTab(tab.id)}
                            className={`
                flex items-center gap-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 -mb-px
                ${isActive
                                    ? 'border-green-500 text-white'
                                    : 'border-transparent text-slate-400 hover:text-slate-200'
                                }
              `}
                        >
                            <Icon size={14} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto">
                {activeSubTab === 'posts' && (
                    <CommsArray club={club} />
                )}

                {activeSubTab === 'assets' && (
                    <ContentPipeline
                        contentItems={contentItems}
                        fixtures={fixtures}
                        club={club}
                        generateStatus={generateStatus}
                        onManualGenerate={onManualGenerate}
                        onUpdateContent={onUpdateContent}
                        onDeleteContent={onDeleteContent}
                    />
                )}

                {activeSubTab === 'schedule' && (
                    <div className="space-y-6">
                        {/* Schedule Header */}
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Content Calendar</h3>
                                <p className="text-sm text-slate-400">Plan content around upcoming fixtures</p>
                            </div>
                            <button
                                onClick={handleAddContent}
                                disabled={isGenerating}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={14} />
                                        Add Content
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Upcoming Fixtures with Content Slots */}
                        <div className="space-y-4">
                            {fixtures.length > 0 ? (
                                fixtures.slice(0, 5).map((fixture) => {
                                    const fixtureDate = new Date(fixture.kickoff_time);
                                    const daysUntil = Math.ceil((fixtureDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                    const fixtureContent = contentItems.filter(c => c.fixture_id === fixture.id);

                                    return (
                                        <div key={fixture.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
                                            {/* Fixture Header */}
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                                                        <Calendar size={18} className="text-slate-400" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-white">
                                                            vs {fixture.opponent}
                                                        </h4>
                                                        <p className="text-xs text-slate-400">
                                                            {fixtureDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                            {' • '}
                                                            {daysUntil > 0 ? `${daysUntil} days away` : daysUntil === 0 ? 'Today' : 'Past'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${fixtureContent.length >= 3
                                                    ? 'bg-green-500/20 text-green-400'
                                                    : fixtureContent.length > 0
                                                        ? 'bg-amber-500/20 text-amber-400'
                                                        : 'bg-slate-700 text-slate-400'
                                                    }`}>
                                                    {fixtureContent.length}/3 Ready
                                                </span>
                                            </div>

                                            {/* Content Slots */}
                                            <div className="grid grid-cols-3 gap-3">
                                                {[
                                                    { label: 'Pre-Match', type: 'pre' as const },
                                                    { label: 'Matchday', type: 'matchday' as const },
                                                    { label: 'Post-Match', type: 'post' as const }
                                                ].map((slot) => {
                                                    const slotContent = fixtureContent.find(c =>
                                                        c.type?.toLowerCase().includes(slot.label.toLowerCase().split('-')[0])
                                                    );
                                                    const slotKey = `${fixture.id}-${slot.type}`;
                                                    const isSlotGenerating = generatingSlot === slotKey;

                                                    return (
                                                        <div
                                                            key={slot.label}
                                                            onClick={() => {
                                                                if (!slotContent && !isSlotGenerating) {
                                                                    handleCreateContent(fixture, slot.type);
                                                                }
                                                            }}
                                                            className={`p-3 rounded-lg border transition-colors ${slotContent
                                                                ? 'bg-green-500/10 border-green-500/30'
                                                                : isSlotGenerating
                                                                    ? 'bg-green-500/5 border-green-500/20 cursor-wait'
                                                                    : 'bg-slate-800/50 border-slate-700/50 border-dashed hover:border-green-500/50 hover:bg-green-500/5 cursor-pointer'
                                                                }`}
                                                        >
                                                            <p className="text-xs text-slate-400 mb-1">{slot.label}</p>
                                                            {isSlotGenerating ? (
                                                                <div className="flex items-center gap-2 text-sm text-green-400">
                                                                    <Loader2 size={12} className="animate-spin" />
                                                                    <span>Generating...</span>
                                                                </div>
                                                            ) : slotContent ? (
                                                                <p className="text-sm text-white truncate">{slotContent.title || slotContent.type}</p>
                                                            ) : (
                                                                <div className="flex items-center gap-1 text-sm text-slate-500 hover:text-green-400">
                                                                    <Sparkles size={12} />
                                                                    <span>Generate</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
                                    <Calendar size={48} className="mx-auto text-slate-500 mb-4" />
                                    <h4 className="text-lg font-semibold text-slate-300">No Fixtures Yet</h4>
                                    <p className="text-sm text-slate-500 mt-2">
                                        Add fixtures in Match Hub to start planning content
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentHub;
