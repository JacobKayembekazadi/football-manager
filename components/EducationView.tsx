/**
 * EducationView
 * 
 * Displays education modules with step-by-step guides for using PitchSide AI.
 * Tracks module completion per user/org.
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  CheckCircle,
  Circle,
  ArrowRight,
  Clock,
  Rocket,
  FileText,
  Users,
  Inbox,
  Sparkles,
  Briefcase,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { EDUCATION_MODULES, EducationModule, calculateProgress } from '../content/educationModules';
import {
  getOnboardingState,
  completeModule,
  uncompleteModule,
  resetOnboarding,
  OnboardingState,
} from '../services/onboardingService';

// Icon mapping for module icons
const ICON_MAP: Record<string, React.FC<{ size?: number; className?: string }>> = {
  Rocket,
  FileText,
  Users,
  Inbox,
  Sparkles,
  Briefcase,
  ShieldAlert,
  BookOpen,
};

interface EducationViewProps {
  orgId: string;
  onNavigate?: (tab: string) => void;
}

const EducationView: React.FC<EducationViewProps> = ({ orgId, onNavigate }) => {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load onboarding state
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const onboardingState = await getOnboardingState(orgId);
      setState(onboardingState);
      setLoading(false);
    };
    
    if (orgId) {
      load();
    }
  }, [orgId]);

  const completedModules = state?.completed_modules || [];
  const progress = calculateProgress(completedModules);

  const handleToggleModule = async (moduleId: string) => {
    if (!orgId) return;
    
    const isCompleted = completedModules.includes(moduleId);
    
    if (isCompleted) {
      await uncompleteModule(orgId, moduleId);
      setState(prev => prev ? {
        ...prev,
        completed_modules: prev.completed_modules.filter(m => m !== moduleId),
      } : null);
    } else {
      await completeModule(orgId, moduleId);
      setState(prev => prev ? {
        ...prev,
        completed_modules: [...prev.completed_modules, moduleId],
      } : null);
    }
  };

  const handleResetProgress = async () => {
    if (!orgId) return;
    if (!confirm('Reset all education progress? This will also reset the welcome tour.')) return;
    
    await resetOnboarding(orgId);
    setState(prev => prev ? {
      ...prev,
      welcome_completed: false,
      tour_completed: false,
      completed_modules: [],
    } : null);
  };

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  const renderModuleCard = (module: EducationModule) => {
    const Icon = ICON_MAP[module.icon] || BookOpen;
    const isCompleted = completedModules.includes(module.id);
    const isExpanded = expandedModule === module.id;

    return (
      <div
        key={module.id}
        className={`glass-card rounded-xl border transition-all duration-300 ${
          isCompleted
            ? 'border-green-500/30 bg-green-500/5'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {/* Header */}
        <div
          className="p-5 cursor-pointer"
          onClick={() => setExpandedModule(isExpanded ? null : module.id)}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isCompleted
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-white/5 border border-white/10'
              }`}
            >
              <Icon
                size={24}
                className={isCompleted ? 'text-green-500' : 'text-blue-400'}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display font-bold text-white uppercase tracking-wide">
                  {module.title}
                </h3>
                {isCompleted && (
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                )}
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{module.description}</p>
              <div className="flex items-center gap-3 mt-2 text-[10px] font-mono text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {module.estimatedTime}
                </span>
                <span>{module.steps.length} steps</span>
              </div>
            </div>

            {/* Expand/Collapse */}
            <button className="text-slate-500 hover:text-white transition-colors p-1">
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="px-5 pb-5 border-t border-white/5 pt-4">
            {/* Steps */}
            <div className="space-y-3 mb-4">
              {module.steps.map((step, idx) => (
                <div key={idx} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        isCompleted
                          ? 'bg-green-500/20 text-green-500 border border-green-500/30'
                          : 'bg-white/5 text-slate-400 border border-white/10'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    {idx < module.steps.length - 1 && (
                      <div
                        className={`w-px flex-1 my-1 ${
                          isCompleted ? 'bg-green-500/30' : 'bg-white/10'
                        }`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <h4 className="text-sm font-medium text-white mb-1">{step.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                    {step.action && step.navigateTo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNavigate(step.navigateTo!);
                        }}
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold text-blue-400 hover:text-white transition-colors uppercase"
                      >
                        {step.action} <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mark Complete Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleModule(module.id);
              }}
              className={`w-full py-2.5 rounded-lg font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all ${
                isCompleted
                  ? 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  : 'bg-green-500 text-black hover:shadow-[0_0_20px_rgba(34,197,94,0.35)]'
              }`}
            >
              {isCompleted ? (
                <>
                  <Circle size={14} /> Mark as Incomplete
                </>
              ) : (
                <>
                  <CheckCircle size={14} /> Mark as Complete
                </>
              )}
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white uppercase tracking-widest flex items-center gap-3">
            <BookOpen className="text-blue-400" size={28} />
            Education Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Learn how to use PitchSide AI with step-by-step modules
          </p>
        </div>

        {/* Progress + Reset */}
        <div className="flex items-center gap-4">
          {/* Progress Badge */}
          <div className="flex items-center gap-3 px-4 py-2 bg-black/40 rounded-full border border-white/10">
            <Trophy size={16} className={progress === 100 ? 'text-green-500' : 'text-slate-500'} />
            <div className="text-xs font-mono">
              <span className={progress === 100 ? 'text-green-500' : 'text-white'}>{progress}%</span>
              <span className="text-slate-500"> complete</span>
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetProgress}
            className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title="Reset progress"
          >
            <RotateCcw size={18} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-4 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono text-slate-400 uppercase">Overall Progress</span>
          <span className="text-xs font-mono text-slate-400">
            {completedModules.length} / {EDUCATION_MODULES.length} modules
          </span>
        </div>
        <div className="h-2 bg-black/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <p className="text-xs text-green-500 font-mono mt-2 text-center animate-pulse">
            Congratulations! You've completed all modules!
          </p>
        )}
      </div>

      {/* Modules Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {EDUCATION_MODULES.map(renderModuleCard)}
      </div>

      {/* Quick Tips */}
      <div className="glass-card p-5 rounded-xl border border-purple-500/20 bg-purple-500/5">
        <h3 className="font-display font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="text-purple-500" size={18} />
          Pro Tips
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            Use the AI Assistant (bottom-right) for quick questions anytime
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            Set your club's tone in Settings for consistent AI-generated content
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            Connect email early – the inbox becomes your communication hub
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            Update player form ratings after each match for accurate analysis
          </li>
        </ul>
      </div>
    </div>
  );
};

export default EducationView;



