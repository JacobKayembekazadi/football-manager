/**
 * Education Modules
 *
 * Defines the structured learning content for PitchSide AI.
 * Each module covers a specific use case with steps and navigation links.
 */

export type ModuleCategory = 'getting-started' | 'content' | 'management' | 'integration';

export interface EducationStep {
  title: string;
  description: string;
  action?: string; // Optional action button text
  navigateTo?: string; // Tab to navigate to
}

export interface EducationModule {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
  estimatedTime: string;
  steps: EducationStep[];
  relatedTabs: string[];
  category: ModuleCategory;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export const MODULE_CATEGORIES: { id: ModuleCategory; label: string; color: string }[] = [
  { id: 'getting-started', label: 'Getting Started', color: 'green' },
  { id: 'content', label: 'Content Creation', color: 'blue' },
  { id: 'management', label: 'Management', color: 'purple' },
  { id: 'integration', label: 'Integration', color: 'amber' },
];

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number; // Number of modules to complete
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first-step', title: 'First Steps', description: 'Complete your first module', icon: 'Footprints', requirement: 1, tier: 'bronze' },
  { id: 'getting-started', title: 'Quick Learner', description: 'Complete 3 modules', icon: 'Zap', requirement: 3, tier: 'silver' },
  { id: 'halfway', title: 'Halfway There', description: 'Complete 4 modules', icon: 'Target', requirement: 4, tier: 'silver' },
  { id: 'almost-done', title: 'Almost Pro', description: 'Complete 6 modules', icon: 'Star', requirement: 6, tier: 'gold' },
  { id: 'master', title: 'PitchSide Master', description: 'Complete all modules', icon: 'Crown', requirement: 7, tier: 'platinum' },
];

export const EDUCATION_MODULES: EducationModule[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Set up your workspace with organizations and clubs to begin using PitchSide AI.',
    icon: 'Rocket',
    estimatedTime: '5 min',
    category: 'getting-started',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Create your Organization',
        description: 'An organization is your top-level workspace. It can contain multiple clubs and team members.',
      },
      {
        title: 'Add your first Club',
        description: 'Each club has its own players, fixtures, content, and settings. Set the club name, colors, and tone.',
      },
      {
        title: 'Invite team members',
        description: 'Add colleagues with different roles: Owner, Admin, Editor, or Viewer.',
      },
      {
        title: 'Explore the Command Center',
        description: 'Your dashboard shows upcoming fixtures, content tasks, and quick actions.',
        action: 'Go to Dashboard',
        navigateTo: 'home',
      },
    ],
    relatedTabs: ['home', 'admin'],
  },
  {
    id: 'match-content',
    title: 'Match Day Content',
    description: 'Learn how to generate AI-powered match previews, reports, and social media posts.',
    icon: 'FileText',
    estimatedTime: '8 min',
    category: 'content',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Add fixtures to your schedule',
        description: 'Go to Match Schedule and add upcoming games with opponent, date, venue, and competition.',
        action: 'Go to Match Hub',
        navigateTo: 'match',
      },
      {
        title: 'Generate a match preview',
        description: 'Click "Generate Preview" on any scheduled fixture. The AI uses your club tone and opponent data.',
      },
      {
        title: 'Review and edit content',
        description: 'All generated content appears in Content Hub. Edit, approve, or regenerate as needed.',
        action: 'Go to Content',
        navigateTo: 'content',
      },
      {
        title: 'Post-match reports',
        description: 'After a match, update the score and generate a match report with stats and highlights.',
      },
      {
        title: 'Social media posts',
        description: 'Generate platform-specific posts for Twitter, Instagram, or Facebook with one click.',
      },
    ],
    relatedTabs: ['match', 'content'],
  },
  {
    id: 'squad-management',
    title: 'Squad Management',
    description: 'Manage player profiles, stats, form ratings, and AI-generated analysis.',
    icon: 'Users',
    estimatedTime: '6 min',
    category: 'management',
    difficulty: 'beginner',
    steps: [
      {
        title: 'Add players to your squad',
        description: 'Go to Squad and add players with position, number, and basic stats.',
        action: 'Go to Squad',
        navigateTo: 'squad',
      },
      {
        title: 'Update player stats',
        description: 'Set pace, shooting, passing, dribbling, defending, and physical ratings (0-100).',
      },
      {
        title: 'Track form ratings',
        description: 'Form ratings (0-10) reflect recent performance. Update after each match.',
      },
      {
        title: 'Generate player analysis',
        description: 'Click the AI button on any player card to generate strengths/weaknesses analysis.',
      },
      {
        title: 'Captain designation',
        description: 'Mark a player as captain – this affects AI-generated content tone.',
      },
    ],
    relatedTabs: ['squad'],
  },
  {
    id: 'inbox-setup',
    title: 'Email Inbox Integration',
    description: 'Connect Gmail or Outlook to manage club communications in one unified inbox.',
    icon: 'Inbox',
    estimatedTime: '7 min',
    category: 'integration',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Navigate to Content Hub',
        description: 'Go to the Content section in the navigation.',
        action: 'Go to Content',
        navigateTo: 'content',
      },
      {
        title: 'Connect your email provider',
        description: 'Click "Connect Gmail" or "Connect Outlook" and authorize PitchSide AI.',
      },
      {
        title: 'Choose visibility settings',
        description: 'Private connections are only visible to you. Shared connections can be accessed by team members.',
      },
      {
        title: 'Sync your emails',
        description: 'Click "Sync Now" to pull recent emails. Emails are stored securely in your workspace.',
      },
      {
        title: 'Reply and compose',
        description: 'Send replies directly from PitchSide AI. Emails are sent via your connected account.',
      },
    ],
    relatedTabs: ['content'],
  },
  {
    id: 'ai-settings',
    title: 'AI Configuration',
    description: 'Configure AI settings: use managed AI or bring your own API key (BYOK).',
    icon: 'Sparkles',
    estimatedTime: '4 min',
    category: 'integration',
    difficulty: 'advanced',
    steps: [
      {
        title: 'Understand AI modes',
        description: 'Managed AI uses the platform key (included). BYOK lets you use your own Gemini API key.',
      },
      {
        title: 'Access AI settings',
        description: 'Go to Admin to configure AI at the organization or club level.',
        action: 'Go to Admin',
        navigateTo: 'admin',
      },
      {
        title: 'Organization-level settings',
        description: 'Set default AI mode for all clubs in your org. Admins only.',
      },
      {
        title: 'Club-level overrides',
        description: 'Each club can override the org setting with its own BYOK key if needed.',
      },
      {
        title: 'Usage tracking',
        description: 'View AI usage stats in Admin to monitor token consumption.',
      },
    ],
    relatedTabs: ['admin'],
  },
  {
    id: 'sponsor-management',
    title: 'Sponsor Management',
    description: 'Track sponsors, contracts, and commercial relationships.',
    icon: 'Briefcase',
    estimatedTime: '5 min',
    category: 'management',
    difficulty: 'intermediate',
    steps: [
      {
        title: 'Navigate to Commercial',
        description: 'Go to the Commercial section in the navigation.',
        action: 'Go to Commercial',
        navigateTo: 'commercial',
      },
      {
        title: 'Add sponsors',
        description: 'Create sponsor records with name, tier (Gold/Silver/Bronze), and contact info.',
      },
      {
        title: 'Track contract values',
        description: 'Log contract amounts and renewal dates to stay on top of commercial deals.',
      },
      {
        title: 'Sponsor activation',
        description: 'Use AI to generate sponsor-friendly content that includes partner mentions.',
      },
    ],
    relatedTabs: ['commercial'],
  },
  {
    id: 'admin-operations',
    title: 'HQ Operations & Tasks',
    description: 'Manage administrative tasks, action items, and club operations.',
    icon: 'ShieldAlert',
    estimatedTime: '4 min',
    category: 'management',
    difficulty: 'advanced',
    steps: [
      {
        title: 'Navigate to Admin',
        description: 'Go to the Admin section in the navigation.',
        action: 'Go to Admin',
        navigateTo: 'admin',
      },
      {
        title: 'View system health',
        description: 'Monitor API status, database connections, and storage usage.',
      },
      {
        title: 'Track AI usage',
        description: 'View AI usage statistics and feature breakdown charts.',
      },
      {
        title: 'Export data',
        description: 'Download usage reports and audit logs as CSV files.',
      },
    ],
    relatedTabs: ['admin'],
  },
];

/**
 * Get a module by ID
 */
export const getModuleById = (id: string): EducationModule | undefined => {
  return EDUCATION_MODULES.find(m => m.id === id);
};

/**
 * Calculate overall progress percentage
 */
export const calculateProgress = (completedModules: string[]): number => {
  if (EDUCATION_MODULES.length === 0) return 0;
  return Math.round((completedModules.length / EDUCATION_MODULES.length) * 100);
};

/**
 * Get modules by category
 */
export const getModulesByCategory = (category: ModuleCategory): EducationModule[] => {
  return EDUCATION_MODULES.filter(m => m.category === category);
};

/**
 * Get unlocked achievements based on completed modules
 */
export const getUnlockedAchievements = (completedModules: string[]): Achievement[] => {
  const count = completedModules.length;
  return ACHIEVEMENTS.filter(a => count >= a.requirement);
};

/**
 * Get next achievement to unlock
 */
export const getNextAchievement = (completedModules: string[]): Achievement | null => {
  const count = completedModules.length;
  return ACHIEVEMENTS.find(a => count < a.requirement) || null;
};

/**
 * Calculate total estimated time remaining
 */
export const calculateTimeRemaining = (completedModules: string[]): string => {
  const incompleteModules = EDUCATION_MODULES.filter(m => !completedModules.includes(m.id));
  const totalMinutes = incompleteModules.reduce((sum, m) => {
    const mins = parseInt(m.estimatedTime.replace(/[^0-9]/g, ''), 10);
    return sum + (isNaN(mins) ? 0 : mins);
  }, 0);

  if (totalMinutes === 0) return 'Complete!';
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

/**
 * Get recommended next module
 */
export const getRecommendedModule = (completedModules: string[]): EducationModule | null => {
  // Priority: getting-started category first, then by difficulty
  const incomplete = EDUCATION_MODULES.filter(m => !completedModules.includes(m.id));
  if (incomplete.length === 0) return null;

  // First check for getting-started category
  const gettingStarted = incomplete.find(m => m.category === 'getting-started');
  if (gettingStarted) return gettingStarted;

  // Then prioritize by difficulty
  const difficultyOrder = ['beginner', 'intermediate', 'advanced'];
  return incomplete.sort((a, b) =>
    difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty)
  )[0];
};



