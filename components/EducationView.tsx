/**
 * EducationView
 *
 * Enhanced education center with:
 * - Visual learning journey
 * - Achievement badges system
 * - Category filtering
 * - Completion certificate
 * - Smart recommendations
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Search,
  Filter,
  Zap,
  Target,
  Star,
  Crown,
  Footprints,
  Award,
  X,
  Download,
  Share2,
  GraduationCap,
  TrendingUp,
  Lock,
} from 'lucide-react';
import {
  EDUCATION_MODULES,
  MODULE_CATEGORIES,
  ACHIEVEMENTS,
  EducationModule,
  ModuleCategory,
  Achievement,
  calculateProgress,
  getUnlockedAchievements,
  getNextAchievement,
  calculateTimeRemaining,
  getRecommendedModule,
} from '../content/educationModules';
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
  Footprints,
  Zap,
  Target,
  Star,
  Crown,
};

// Achievement tier colors
const TIER_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  bronze: { bg: 'bg-amber-900/20', border: 'border-amber-700/50', text: 'text-amber-600', glow: 'shadow-amber-700/20' },
  silver: { bg: 'bg-slate-400/10', border: 'border-slate-400/50', text: 'text-slate-300', glow: 'shadow-slate-400/20' },
  gold: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/50', text: 'text-yellow-400', glow: 'shadow-yellow-500/30' },
  platinum: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/50', text: 'text-cyan-400', glow: 'shadow-cyan-500/30' },
};

// Category colors
const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-500' },
};

// Difficulty badge colors
const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'bg-green-500/20', text: 'text-green-400' },
  intermediate: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  advanced: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
};

interface EducationViewProps {
  orgId: string;
  onNavigate?: (tab: string) => void;
}

const EducationView: React.FC<EducationViewProps> = ({ orgId, onNavigate }) => {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ModuleCategory | 'all'>('all');
  const [showCertificate, setShowCertificate] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);

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
  const unlockedAchievements = getUnlockedAchievements(completedModules);
  const nextAchievement = getNextAchievement(completedModules);
  const timeRemaining = calculateTimeRemaining(completedModules);
  const recommendedModule = getRecommendedModule(completedModules);

  // Filtered modules
  const filteredModules = useMemo(() => {
    let modules = [...EDUCATION_MODULES];

    // Filter by category
    if (selectedCategory !== 'all') {
      modules = modules.filter(m => m.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      modules = modules.filter(
        m =>
          m.title.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.steps.some(s => s.title.toLowerCase().includes(query))
      );
    }

    return modules;
  }, [selectedCategory, searchQuery]);

  const handleToggleModule = async (moduleId: string) => {
    if (!orgId) return;

    const isCompleted = completedModules.includes(moduleId);

    if (isCompleted) {
      await uncompleteModule(orgId, moduleId);
      setState(prev =>
        prev
          ? {
              ...prev,
              completed_modules: prev.completed_modules.filter(m => m !== moduleId),
            }
          : null
      );
    } else {
      await completeModule(orgId, moduleId);
      setState(prev =>
        prev
          ? {
              ...prev,
              completed_modules: [...prev.completed_modules, moduleId],
            }
          : null
      );
    }
  };

  const handleResetProgress = async () => {
    if (!orgId) return;
    if (!confirm('Reset all education progress? This will also reset the welcome tour.')) return;

    await resetOnboarding(orgId);
    setState(prev =>
      prev
        ? {
            ...prev,
            welcome_completed: false,
            tour_completed: false,
            completed_modules: [],
          }
        : null
    );
  };

  const handleNavigate = (tab: string) => {
    if (onNavigate) {
      onNavigate(tab);
    }
  };

  // Render achievement card
  const renderAchievementCard = (achievement: Achievement, isUnlocked: boolean) => {
    const Icon = ICON_MAP[achievement.icon] || Award;
    const colors = TIER_COLORS[achievement.tier];

    return (
      <div
        key={achievement.id}
        className={`relative p-4 rounded-xl border transition-all ${
          isUnlocked
            ? `${colors.bg} ${colors.border} shadow-lg ${colors.glow}`
            : 'bg-slate-800/30 border-slate-700/30 opacity-60'
        }`}
      >
        {!isUnlocked && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm">
            <Lock size={20} className="text-slate-500" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isUnlocked ? colors.bg : 'bg-slate-700/30'
            } border ${isUnlocked ? colors.border : 'border-slate-700/50'}`}
          >
            <Icon size={24} className={isUnlocked ? colors.text : 'text-slate-600'} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={`font-bold text-sm ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                {achievement.title}
              </h4>
              <span
                className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  isUnlocked ? `${colors.bg} ${colors.text}` : 'bg-slate-700/50 text-slate-500'
                }`}
              >
                {achievement.tier}
              </span>
            </div>
            <p className={`text-xs ${isUnlocked ? 'text-slate-400' : 'text-slate-600'}`}>
              {achievement.description}
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Render module card
  const renderModuleCard = (module: EducationModule, isRecommended: boolean = false) => {
    const Icon = ICON_MAP[module.icon] || BookOpen;
    const isCompleted = completedModules.includes(module.id);
    const isExpanded = expandedModule === module.id;
    const category = MODULE_CATEGORIES.find(c => c.id === module.category);
    const categoryColors = category ? CATEGORY_COLORS[category.color] : CATEGORY_COLORS.blue;
    const difficultyColors = DIFFICULTY_COLORS[module.difficulty];

    return (
      <div
        key={module.id}
        className={`glass-card rounded-xl border transition-all duration-300 ${
          isCompleted
            ? 'border-green-500/30 bg-green-500/5'
            : isRecommended
            ? 'border-blue-500/30 bg-blue-500/5 ring-1 ring-blue-500/20'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        {/* Recommended badge */}
        {isRecommended && !isCompleted && (
          <div className="px-5 pt-3">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-full">
              <TrendingUp size={10} />
              Recommended Next
            </span>
          </div>
        )}

        {/* Header */}
        <div
          className={`p-5 cursor-pointer ${isRecommended && !isCompleted ? 'pt-2' : ''}`}
          onClick={() => setExpandedModule(isExpanded ? null : module.id)}
        >
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isCompleted
                  ? 'bg-green-500/20 border border-green-500/30'
                  : `${categoryColors.bg} border ${categoryColors.border}`
              }`}
            >
              <Icon size={24} className={isCompleted ? 'text-green-500' : categoryColors.text} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-display font-bold text-white uppercase tracking-wide">
                  {module.title}
                </h3>
                {isCompleted && <CheckCircle size={16} className="text-green-500 flex-shrink-0" />}
              </div>
              <p className="text-sm text-slate-400 line-clamp-2">{module.description}</p>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="flex items-center gap-1 text-[10px] font-mono text-slate-500">
                  <Clock size={12} />
                  {module.estimatedTime}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {module.steps.length} steps
                </span>
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${difficultyColors.bg} ${difficultyColors.text}`}
                >
                  {module.difficulty}
                </span>
                {category && (
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${categoryColors.bg} ${categoryColors.text}`}
                  >
                    {category.label}
                  </span>
                )}
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
                        className={`w-px flex-1 my-1 ${isCompleted ? 'bg-green-500/30' : 'bg-white/10'}`}
                      />
                    )}
                  </div>
                  <div className="flex-1 pb-3">
                    <h4 className="text-sm font-medium text-white mb-1">{step.title}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">{step.description}</p>
                    {step.action && step.navigateTo && (
                      <button
                        onClick={e => {
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
              onClick={e => {
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
            <GraduationCap className="text-blue-400" size={28} />
            Learning Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Master PitchSide AI with interactive modules and earn achievements
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3">
          {/* Time Remaining */}
          <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-black/40 rounded-full border border-white/10">
            <Clock size={14} className="text-slate-500" />
            <span className="text-xs font-mono text-slate-400">
              {timeRemaining}
              {timeRemaining !== 'Complete!' && ' left'}
            </span>
          </div>

          {/* Achievements Button */}
          <button
            onClick={() => setShowAchievements(true)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 hover:bg-purple-500/20 transition-colors"
          >
            <Trophy size={14} />
            <span className="text-xs font-bold">
              {unlockedAchievements.length}/{ACHIEVEMENTS.length}
            </span>
          </button>

          {/* Certificate Button (show when complete) */}
          {progress === 100 && (
            <button
              onClick={() => setShowCertificate(true)}
              className="flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/30 rounded-full text-green-400 hover:bg-green-500/20 transition-colors"
            >
              <Award size={14} />
              <span className="text-xs font-bold hidden md:inline">Certificate</span>
            </button>
          )}

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

      {/* Progress Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Main Progress Card */}
        <div className="md:col-span-2 glass-card p-5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase">Learning Journey</span>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-2xl font-bold text-white">{progress}%</span>
                <span className="text-sm text-slate-500">
                  {completedModules.length} of {EDUCATION_MODULES.length} modules
                </span>
              </div>
            </div>
            {progress === 100 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                <CheckCircle size={14} className="text-green-500" />
                <span className="text-xs font-bold text-green-400">Complete!</span>
              </div>
            )}
          </div>

          {/* Progress Bar with Milestones */}
          <div className="relative">
            <div className="h-3 bg-black/40 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Milestone markers */}
            <div className="absolute top-0 left-0 right-0 h-3 flex items-center">
              {ACHIEVEMENTS.map(ach => {
                const position = (ach.requirement / EDUCATION_MODULES.length) * 100;
                const isUnlocked = completedModules.length >= ach.requirement;
                return (
                  <div
                    key={ach.id}
                    className="absolute transform -translate-x-1/2"
                    style={{ left: `${position}%` }}
                    title={ach.title}
                  >
                    <div
                      className={`w-3 h-3 rounded-full border-2 ${
                        isUnlocked
                          ? 'bg-white border-white shadow-[0_0_8px_rgba(255,255,255,0.5)]'
                          : 'bg-slate-700 border-slate-600'
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next achievement hint */}
          {nextAchievement && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <Sparkles size={12} className="text-purple-500" />
              <span>
                Complete {nextAchievement.requirement - completedModules.length} more module
                {nextAchievement.requirement - completedModules.length > 1 ? 's' : ''} to unlock "
                {nextAchievement.title}"
              </span>
            </div>
          )}
        </div>

        {/* Recent Achievements */}
        <div className="glass-card p-5 rounded-xl border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono text-slate-400 uppercase">Latest Achievement</span>
            <button
              onClick={() => setShowAchievements(true)}
              className="text-[10px] text-blue-400 hover:text-white transition-colors"
            >
              View All
            </button>
          </div>
          {unlockedAchievements.length > 0 ? (
            (() => {
              const latest = unlockedAchievements[unlockedAchievements.length - 1];
              const Icon = ICON_MAP[latest.icon] || Award;
              const colors = TIER_COLORS[latest.tier];
              return (
                <div className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${colors.bg} border ${colors.border}`}
                    >
                      <Icon size={20} className={colors.text} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">{latest.title}</h4>
                      <p className="text-[10px] text-slate-400">{latest.description}</p>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="text-center py-4 text-slate-500 text-sm">
              Complete your first module to earn an achievement!
            </div>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-colors ${
              selectedCategory === 'all'
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-black/40 text-slate-400 border border-transparent hover:text-white'
            }`}
          >
            All
          </button>
          {MODULE_CATEGORIES.map(cat => {
            const colors = CATEGORY_COLORS[cat.color];
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-lg text-xs font-bold uppercase whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? `${colors.bg} ${colors.text} border ${colors.border}`
                    : 'bg-black/40 text-slate-400 border border-transparent hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommended Module (if not already shown in filtered list) */}
      {recommendedModule &&
        selectedCategory === 'all' &&
        !searchQuery &&
        !completedModules.includes(recommendedModule.id) && (
          <div>
            <h3 className="text-xs font-mono text-slate-400 uppercase mb-3 flex items-center gap-2">
              <TrendingUp size={12} className="text-blue-400" />
              Recommended for You
            </h3>
            {renderModuleCard(recommendedModule, true)}
          </div>
        )}

      {/* Modules Grid */}
      <div>
        <h3 className="text-xs font-mono text-slate-400 uppercase mb-3 flex items-center gap-2">
          <BookOpen size={12} />
          {selectedCategory === 'all' ? 'All Modules' : MODULE_CATEGORIES.find(c => c.id === selectedCategory)?.label}
          <span className="text-slate-600">({filteredModules.length})</span>
        </h3>
        {filteredModules.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredModules.map(module =>
              renderModuleCard(module, recommendedModule?.id === module.id && selectedCategory !== 'all')
            )}
          </div>
        ) : (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <Search size={48} className="mx-auto text-slate-500 mb-4" />
            <h4 className="text-lg font-semibold text-slate-300">No modules found</h4>
            <p className="text-sm text-slate-500 mt-2">Try adjusting your search or filter</p>
          </div>
        )}
      </div>

      {/* Pro Tips */}
      <div className="glass-card p-5 rounded-xl border border-purple-500/20 bg-purple-500/5">
        <h3 className="font-display font-bold text-white uppercase tracking-wide mb-3 flex items-center gap-2">
          <Sparkles className="text-purple-500" size={18} />
          Pro Tips
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            Complete the "Getting Started" module first for the best learning experience
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            Use the navigation links in each step to practice as you learn
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            Earn all achievements to unlock your completion certificate
          </li>
          <li className="flex items-start gap-2">
            <span className="text-purple-500">•</span>
            Filter by category to focus on specific areas like Content or Management
          </li>
        </ul>
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Trophy className="text-purple-500" size={24} />
                <h2 className="text-lg font-display font-bold text-white uppercase tracking-wide">
                  Achievements
                </h2>
              </div>
              <button
                onClick={() => setShowAchievements(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3 overflow-y-auto max-h-[60vh]">
              {ACHIEVEMENTS.map(achievement =>
                renderAchievementCard(achievement, unlockedAchievements.some(a => a.id === achievement.id))
              )}
            </div>
            <div className="p-4 border-t border-white/10 bg-black/20">
              <div className="text-center text-xs text-slate-400">
                {unlockedAchievements.length} of {ACHIEVEMENTS.length} achievements unlocked
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Completion Certificate Modal */}
      {showCertificate && progress === 100 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-green-500/30 rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_60px_rgba(34,197,94,0.15)]">
            {/* Certificate Header */}
            <div className="relative p-8 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent" />
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-blue-500 to-purple-500" />

              <button
                onClick={() => setShowCertificate(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 mb-4">
                  <GraduationCap size={40} className="text-green-500" />
                </div>
                <h2 className="text-3xl font-display font-bold text-white uppercase tracking-widest mb-2">
                  Certificate of Completion
                </h2>
                <p className="text-sm text-slate-400">PitchSide AI Learning Center</p>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="px-8 pb-8 text-center">
              <p className="text-slate-400 mb-4">This certifies that</p>
              <p className="text-2xl font-bold text-white mb-4">PitchSide AI User</p>
              <p className="text-slate-400 mb-6">
                has successfully completed all {EDUCATION_MODULES.length} learning modules and earned the title of
              </p>

              <div className="inline-flex items-center gap-3 px-6 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-full mb-6">
                <Crown size={24} className="text-cyan-400" />
                <span className="text-xl font-bold text-cyan-400">PitchSide Master</span>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6">
                {ACHIEVEMENTS.map(ach => {
                  const Icon = ICON_MAP[ach.icon] || Award;
                  const colors = TIER_COLORS[ach.tier];
                  return (
                    <div
                      key={ach.id}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${colors.bg} border ${colors.border}`}
                      title={ach.title}
                    >
                      <Icon size={18} className={colors.text} />
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-slate-500 mt-6">
                Completed on {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducationView;
