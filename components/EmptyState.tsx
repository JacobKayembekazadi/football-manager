/**
 * EmptyState Component
 *
 * Provides consistent, friendly empty states across the app.
 * Use when there's no data to display in a view or section.
 */

import React from 'react';
import { LucideIcon, Box, Calendar, Users, FileText, Package, Bell } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact';
}

// Preset configurations for common empty states
export const EMPTY_STATE_PRESETS = {
  fixtures: {
    icon: Calendar,
    title: 'No fixtures scheduled',
    description: 'Add your first match to get started with match day prep',
  },
  players: {
    icon: Users,
    title: 'No players yet',
    description: 'Add your squad to track availability and formations',
  },
  content: {
    icon: FileText,
    title: 'No content yet',
    description: 'Generate match previews, reports, and social posts',
  },
  equipment: {
    icon: Package,
    title: 'No equipment tracked',
    description: 'Add kit items to track inventory and laundry status',
  },
  notifications: {
    icon: Bell,
    title: 'All caught up!',
    description: 'No new notifications to show',
  },
  generic: {
    icon: Box,
    title: 'Nothing here yet',
    description: 'Check back later or add some data to get started',
  },
} as const;

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Box,
  title,
  description,
  action,
  variant = 'default',
}) => {
  if (variant === 'compact') {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-800/50 border border-white/5 flex items-center justify-center mb-3">
          <Icon size={18} className="text-slate-500" />
        </div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        {description && (
          <p className="text-slate-600 text-xs mt-1 max-w-[200px]">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-3 text-xs text-green-400 hover:text-green-300 font-medium transition-colors"
          >
            {action.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 md:py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/50 border border-white/5 flex items-center justify-center mb-4 animate-fade-in">
        <Icon size={28} className="text-slate-500" />
      </div>
      <h3 className="text-lg font-semibold text-slate-300 mb-1">{title}</h3>
      {description && (
        <p className="text-slate-500 text-sm max-w-[280px] leading-relaxed">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 px-4 py-2 bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 text-sm font-medium rounded-lg transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
