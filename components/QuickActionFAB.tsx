import React, { useState } from 'react';
import { Plus, X, Calendar, UserCheck, Package, ClipboardList, Zap } from 'lucide-react';

interface QuickActionFABProps {
  onNavigate: (tab: string) => void;
  hasMatchToday?: boolean;
  onMatchdayMode?: () => void;
}

const QuickActionFAB: React.FC<QuickActionFABProps> = ({
  onNavigate,
  hasMatchToday,
  onMatchdayMode
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    ...(hasMatchToday && onMatchdayMode ? [{
      id: 'matchday-mode',
      label: 'Match Day Mode',
      icon: Zap,
      color: 'bg-green-500 text-black',
      onClick: () => { onMatchdayMode(); setIsOpen(false); }
    }] : []),
    {
      id: 'availability',
      label: 'Check Availability',
      icon: UserCheck,
      color: 'bg-blue-500 text-white',
      onClick: () => { onNavigate('availability'); setIsOpen(false); }
    },
    {
      id: 'matchday',
      label: 'New Fixture',
      icon: Calendar,
      color: 'bg-purple-500 text-white',
      onClick: () => { onNavigate('matchday'); setIsOpen(false); }
    },
    {
      id: 'equipment',
      label: 'Kit Check',
      icon: Package,
      color: 'bg-amber-500 text-black',
      onClick: () => { onNavigate('equipment'); setIsOpen(false); }
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: ClipboardList,
      color: 'bg-cyan-500 text-black',
      onClick: () => { onNavigate('templates'); setIsOpen(false); }
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container - only visible on mobile */}
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        {/* Action buttons */}
        <div className={`flex flex-col-reverse gap-3 mb-3 transition-all duration-200 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}>
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.onClick}
                className={`flex items-center gap-3 pl-4 pr-5 py-3 rounded-full shadow-lg ${action.color} transform transition-all duration-200 active:scale-95`}
                style={{
                  transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
                }}
              >
                <Icon size={20} />
                <span className="text-sm font-bold whitespace-nowrap">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main FAB button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95 ${
            isOpen
              ? 'bg-slate-700 rotate-45'
              : 'bg-green-500 hover:bg-green-400'
          }`}
        >
          {isOpen ? (
            <X size={24} className="text-white" />
          ) : (
            <Plus size={24} className="text-black" />
          )}
        </button>
      </div>
    </>
  );
};

export default QuickActionFAB;
