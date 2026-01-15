import React from 'react';
import { LayoutDashboard, Inbox, UserCheck, Calendar, Package, Building2, Wallet } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'availability', label: 'Availability', icon: UserCheck },
    { id: 'matchday', label: 'Matchday', icon: Calendar },
    { id: 'equipment', label: 'Equipment', icon: Package },
    { id: 'club-ops', label: 'Club Ops', icon: Building2 },
    { id: 'finance', label: 'Finance', icon: Wallet },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900 border-t border-slate-700/50 safe-area-pb"
            aria-label="Mobile navigation"
        >
            <div className="flex justify-around items-center h-16" role="tablist">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={item.label}
                            role="tab"
                            aria-selected={isActive}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                                    ? 'text-green-400'
                                    : 'text-slate-400 active:text-slate-200'
                                }`}
                        >
                            <Icon size={20} className={isActive ? 'text-green-400' : ''} aria-hidden="true" />
                            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                            {isActive && (
                                <div className="absolute top-0 w-8 h-0.5 bg-green-400 rounded-full" aria-hidden="true" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
