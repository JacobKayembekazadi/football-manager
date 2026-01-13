import React from 'react';
import { Home, Trophy, Users, FileText, Briefcase, Settings } from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'match', label: 'Match', icon: Trophy },
    { id: 'squad', label: 'Squad', icon: Users },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'commercial', label: 'Commercial', icon: Briefcase },
    { id: 'admin', label: 'Admin', icon: Settings },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900 border-t border-slate-700/50 safe-area-pb">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive
                                    ? 'text-green-400'
                                    : 'text-slate-400 active:text-slate-200'
                                }`}
                        >
                            <Icon size={20} className={isActive ? 'text-green-400' : ''} />
                            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
                            {isActive && (
                                <div className="absolute top-0 w-8 h-0.5 bg-green-400 rounded-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
