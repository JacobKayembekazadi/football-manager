/**
 * Education Modules
 * 
 * Defines the structured learning content for PitchSide AI.
 * Each module covers a specific use case with steps and navigation links.
 */

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
}

export const EDUCATION_MODULES: EducationModule[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    description: 'Set up your workspace with organizations and clubs to begin using PitchSide AI.',
    icon: 'Rocket',
    estimatedTime: '5 min',
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
        navigateTo: 'dashboard',
      },
    ],
    relatedTabs: ['dashboard', 'settings'],
  },
  {
    id: 'match-content',
    title: 'Match Day Content',
    description: 'Learn how to generate AI-powered match previews, reports, and social media posts.',
    icon: 'FileText',
    estimatedTime: '8 min',
    steps: [
      {
        title: 'Add fixtures to your schedule',
        description: 'Go to Match Schedule and add upcoming games with opponent, date, venue, and competition.',
        action: 'Go to Fixtures',
        navigateTo: 'fixtures',
      },
      {
        title: 'Generate a match preview',
        description: 'Click "Generate Preview" on any scheduled fixture. The AI uses your club tone and opponent data.',
      },
      {
        title: 'Review and edit content',
        description: 'All generated content appears in Holo-Content. Edit, approve, or regenerate as needed.',
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
    relatedTabs: ['fixtures', 'content'],
  },
  {
    id: 'squad-management',
    title: 'Squad Management',
    description: 'Manage player profiles, stats, form ratings, and AI-generated analysis.',
    icon: 'Users',
    estimatedTime: '6 min',
    steps: [
      {
        title: 'Add players to your squad',
        description: 'Go to Squad Bio-Metrics and add players with position, number, and basic stats.',
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
    steps: [
      {
        title: 'Navigate to Intel Inbox',
        description: 'Go to the Inbox section in the sidebar.',
        action: 'Go to Inbox',
        navigateTo: 'inbox',
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
    relatedTabs: ['inbox'],
  },
  {
    id: 'ai-settings',
    title: 'AI Configuration',
    description: 'Configure AI settings: use managed AI or bring your own API key (BYOK).',
    icon: 'Sparkles',
    estimatedTime: '4 min',
    steps: [
      {
        title: 'Understand AI modes',
        description: 'Managed AI uses the platform key (included). BYOK lets you use your own Gemini API key.',
      },
      {
        title: 'Access AI settings',
        description: 'Go to Settings to configure AI at the organization or club level.',
        action: 'Go to Settings',
        navigateTo: 'settings',
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
        description: 'View AI usage stats in Settings to monitor token consumption.',
      },
    ],
    relatedTabs: ['settings'],
  },
  {
    id: 'sponsor-management',
    title: 'Sponsor Management',
    description: 'Track sponsors, contracts, and commercial relationships.',
    icon: 'Briefcase',
    estimatedTime: '5 min',
    steps: [
      {
        title: 'Navigate to Sponsor Nexus',
        description: 'Go to the Sponsor Nexus section in the sidebar.',
        action: 'Go to Sponsors',
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
    steps: [
      {
        title: 'Navigate to HQ Operations',
        description: 'Go to the HQ Operations section in the sidebar.',
        action: 'Go to Admin',
        navigateTo: 'admin',
      },
      {
        title: 'Create tasks',
        description: 'Add tasks with title, due date, priority, and assignee.',
      },
      {
        title: 'Track task status',
        description: 'Update tasks as Pending, In Progress, or Complete.',
      },
      {
        title: 'Review email summaries',
        description: 'See a summary of recent inbox activity requiring attention.',
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



