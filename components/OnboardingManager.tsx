/**
 * OnboardingManager
 * 
 * Handles first-time user experience:
 * - Welcome modal with "Start Tour" / "Skip" options
 * - Guided tour using react-joyride
 * - Persists completion state per user/org
 */

import React, { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from 'react-joyride';
import { Zap, X, Rocket, BookOpen, ArrowRight } from 'lucide-react';
import {
  getOnboardingState,
  initOnboardingState,
  completeWelcome,
  completeTour,
  OnboardingState,
} from '../services/onboardingService';

interface OnboardingManagerProps {
  orgId: string;
  onNavigate?: (tab: string) => void;
}

const TOUR_STEPS: Step[] = [
  {
    target: '[data-tour="sidebar-dashboard"]',
    title: 'Command Center',
    content: 'Your dashboard shows upcoming fixtures, AI predictions, content status, and quick actions. Start here each day to see what needs attention.',
    disableBeacon: true,
    placement: 'right',
  },
  {
    target: '[data-tour="quickstart"]',
    title: 'Quick Start Checklist',
    content: 'Follow these steps to set up your club. Each item links directly to the relevant page. The checklist disappears once you complete all tasks!',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-fixtures"]',
    title: 'Match Schedule',
    content: 'Schedule your upcoming matches here. Click "Schedule Fixture" to add a new match, then use "Hype Pack" to auto-generate pre-match content.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-squad"]',
    title: 'Squad Bio-Metrics',
    content: 'Manage your player roster. Click "Add" to create a player, and the AI will automatically generate performance analysis when you view their profile.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-content"]',
    title: 'Holo-Content Pipeline',
    content: 'Your AI content factory! Click "Weekly Scout" to generate fresh content, or use "AI Graphics" for matchday images. Drag content through Draft → Approved → Published.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-commercial"]',
    title: 'Sponsor Nexus',
    content: 'Track sponsor relationships and ROI. Add sponsors, generate value reports, and draft renewal pitches with AI assistance.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-inbox"]',
    title: 'Intel Inbox',
    content: 'Connect your Gmail or Outlook to unify club communications. AI generates smart reply suggestions for every email.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-admin"]',
    title: 'Deadline Sentinel',
    content: 'Track admin tasks and deadlines. Add tasks, generate action plans, and draft communications with AI help.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-education"]',
    title: 'Education Center',
    content: 'Learn platform features through interactive modules. Great for training new staff members!',
    placement: 'right',
  },
  {
    target: '[data-tour="workspace-switch"]',
    title: 'Switch Workspace',
    content: 'Managing multiple clubs? Switch between them here. Each workspace has completely separate data.',
    placement: 'bottom',
  },
];

const OnboardingManager: React.FC<OnboardingManagerProps> = ({ orgId, onNavigate }) => {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [runTour, setRunTour] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize onboarding state on mount
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      const onboardingState = await initOnboardingState(orgId);
      setState(onboardingState);
      
      // Show welcome if not completed
      if (onboardingState && !onboardingState.welcome_completed) {
        setShowWelcome(true);
      }
      setLoading(false);
    };
    
    if (orgId) {
      init();
    }
  }, [orgId]);

  const handleStartTour = useCallback(async () => {
    setShowWelcome(false);
    // Small delay to let modal close animation complete
    setTimeout(() => {
      setRunTour(true);
    }, 300);
  }, []);

  const handleSkip = useCallback(async () => {
    setShowWelcome(false);
    await completeWelcome(orgId);
    setState(prev => prev ? { ...prev, welcome_completed: true } : null);
  }, [orgId]);

  const handleJoyrideCallback = useCallback(async (data: CallBackProps) => {
    const { status, action, type } = data;

    // Tour finished or skipped
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRunTour(false);
      await completeTour(orgId);
      setState(prev => prev ? { ...prev, tour_completed: true, welcome_completed: true } : null);
    }

    // Handle step changes to highlight UI
    if (type === EVENTS.STEP_AFTER && action === ACTIONS.NEXT) {
      // Could navigate to relevant tab here if needed
    }
  }, [orgId]);

  // Don't render anything while loading or if no state needed
  if (loading || !state) return null;

  return (
    <>
      {/* Welcome Modal */}
      {showWelcome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={handleSkip}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-lg mx-4 bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-[0_0_60px_rgba(0,243,255,0.15)] overflow-hidden animate-fade-in">
            {/* Header gradient */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink" />
            
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-6 bg-neon-blue/10 border border-neon-blue/30 rounded-2xl flex items-center justify-center">
                <Zap className="text-neon-blue" size={32} />
              </div>

              <h2 className="text-2xl font-display font-bold text-white text-center tracking-wider uppercase mb-2">
                Welcome to Pitch<span className="text-neon-blue">Side</span> AI
              </h2>
              
              <p className="text-slate-400 text-center text-sm mb-8">
                Your AI-powered football club command center. Let's get you started with a quick tour.
              </p>

              {/* Quick highlights */}
              <div className="space-y-3 mb-8">
                {[
                  { icon: Rocket, text: 'Generate match previews & reports with AI' },
                  { icon: BookOpen, text: 'Manage squad, fixtures, and content' },
                  { icon: Zap, text: 'Connect Gmail/Outlook for unified inbox' },
                ].map(({ icon: Icon, text }, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                    <Icon size={18} className="text-neon-blue flex-shrink-0" />
                    <span className="text-sm text-slate-300">{text}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="flex-1 py-3 px-4 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-lg transition-all text-sm font-medium"
                >
                  Skip for now
                </button>
                <button
                  onClick={handleStartTour}
                  className="flex-1 py-3 px-4 bg-neon-blue text-black rounded-lg font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(0,243,255,0.35)] transition-all"
                >
                  Start Tour <ArrowRight size={16} />
                </button>
              </div>

              {/* Education hint */}
              <p className="text-center text-[10px] text-slate-600 mt-6 font-mono">
                You can always revisit the tour from the Education page
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Joyride Tour */}
      <Joyride
        steps={TOUR_STEPS}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        disableOverlayClose
        spotlightPadding={4}
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#00f3ff',
            backgroundColor: '#0a0a0a',
            textColor: '#e2e8f0',
            arrowColor: '#0a0a0a',
            overlayColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 10000,
          },
          tooltip: {
            borderRadius: 12,
            padding: 20,
          },
          tooltipTitle: {
            fontSize: 16,
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
          },
          tooltipContent: {
            fontSize: 14,
            lineHeight: 1.6,
          },
          buttonNext: {
            backgroundColor: '#00f3ff',
            color: '#000',
            fontWeight: 700,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            fontSize: 12,
            padding: '10px 20px',
            borderRadius: 8,
          },
          buttonBack: {
            color: '#94a3b8',
            marginRight: 10,
          },
          buttonSkip: {
            color: '#64748b',
          },
          spotlight: {
            borderRadius: 12,
          },
        }}
        locale={{
          back: 'Back',
          close: 'Close',
          last: 'Finish',
          next: 'Next',
          skip: 'Skip Tour',
        }}
      />
    </>
  );
};

export default OnboardingManager;

