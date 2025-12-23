/**
 * QuickStartChecklist
 * 
 * A checklist component that guides new users through essential setup steps.
 * Progress is derived from actual data (players, fixtures, content, etc.)
 */

import React from 'react';
import { CheckCircle2, Circle, ChevronRight, Rocket, Users, Calendar, Sparkles, BookOpen } from 'lucide-react';
import { Fixture, ContentItem, Player } from '../types';

interface QuickStartChecklistProps {
  players: Player[];
  fixtures: Fixture[];
  contentItems: ContentItem[];
  hasCompletedEducation?: boolean;
  onNavigate: (tab: string) => void;
}

interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  icon: React.ElementType;
  tab: string;
}

const QuickStartChecklist: React.FC<QuickStartChecklistProps> = ({
  players,
  fixtures,
  contentItems,
  hasCompletedEducation = false,
  onNavigate,
}) => {
  const items: ChecklistItem[] = [
    {
      id: 'players',
      label: 'Add your first player',
      description: 'Build your squad roster',
      completed: players.length > 0,
      icon: Users,
      tab: 'squad',
    },
    {
      id: 'fixtures',
      label: 'Schedule a fixture',
      description: 'Add an upcoming match',
      completed: fixtures.filter(f => f.status === 'SCHEDULED').length > 0,
      icon: Calendar,
      tab: 'fixtures',
    },
    {
      id: 'content',
      label: 'Generate content',
      description: 'Create your first AI content',
      completed: contentItems.length > 0,
      icon: Sparkles,
      tab: 'fixtures',
    },
    {
      id: 'education',
      label: 'Complete education modules',
      description: 'Learn platform features',
      completed: hasCompletedEducation,
      icon: BookOpen,
      tab: 'education',
    },
  ];

  const completedCount = items.filter(i => i.completed).length;
  const progressPercent = (completedCount / items.length) * 100;

  // Hide when all items are complete
  if (completedCount === items.length) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 border border-neon-green/20" data-tour="quickstart">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neon-green/10 border border-neon-green/30 flex items-center justify-center">
            <Rocket size={20} className="text-neon-green" />
          </div>
          <div>
            <h3 className="font-display font-bold text-white uppercase tracking-wider">Quick Start</h3>
            <p className="text-xs font-mono text-slate-500">
              {completedCount} of {items.length} complete
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-display font-bold text-neon-green">{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-white/5 rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-gradient-to-r from-neon-green to-emerald-400 transition-all duration-500 shadow-[0_0_10px_rgba(0,255,136,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.tab)}
            className={`w-full flex items-center gap-4 p-3 rounded-lg transition-all group ${
              item.completed 
                ? 'bg-neon-green/5 border border-neon-green/20' 
                : 'bg-white/[0.02] border border-white/5 hover:border-neon-green/30 hover:bg-neon-green/5'
            }`}
          >
            {/* Checkbox */}
            <div className={`flex-shrink-0 ${item.completed ? 'text-neon-green' : 'text-slate-600'}`}>
              {item.completed ? (
                <CheckCircle2 size={20} className="fill-neon-green/20" />
              ) : (
                <Circle size={20} />
              )}
            </div>

            {/* Icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              item.completed 
                ? 'bg-neon-green/10 text-neon-green' 
                : 'bg-white/5 text-slate-500 group-hover:text-neon-green group-hover:bg-neon-green/10'
            } transition-colors`}>
              <item.icon size={16} />
            </div>

            {/* Label */}
            <div className="flex-1 text-left">
              <span className={`text-sm font-medium ${
                item.completed ? 'text-neon-green' : 'text-white group-hover:text-neon-green'
              } transition-colors`}>
                {item.label}
              </span>
              <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                {item.description}
              </p>
            </div>

            {/* Arrow */}
            {!item.completed && (
              <ChevronRight size={16} className="text-slate-600 group-hover:text-neon-green transition-colors" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickStartChecklist;



