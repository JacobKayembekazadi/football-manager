import React, { useState } from 'react';
import {
    LayoutDashboard,
    Calendar,
    FileText,
    UserCheck,
    MoreHorizontal,
    X,
    Users,
    Package,
    ClipboardList,
    Settings,
    Inbox,
    Radio,
    Shirt,
} from 'lucide-react';

interface BottomNavProps {
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

// Main bottom nav items (4 + More)
const mainNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'matchday', label: 'Match', icon: Calendar },
    { id: 'availability', label: 'Squad', icon: UserCheck },
    { id: 'content', label: 'Content', icon: FileText },
];

// Items in the "More" menu
const moreNavItems = [
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'squad', label: 'Players', icon: Users },
    { id: 'formation', label: 'Formation', icon: Shirt },
    { id: 'operations', label: 'Operations', icon: Radio },
    { id: 'equipment', label: 'Equipment', icon: Package },
    { id: 'templates', label: 'Templates', icon: ClipboardList },
    { id: 'settings', label: 'Settings', icon: Settings },
];

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    // Check if active tab is in the "more" menu
    const isMoreActive = moreNavItems.some(item => item.id === activeTab);

    const handleNavClick = (id: string) => {
        setActiveTab(id);
        setShowMoreMenu(false);
    };

    return (
        <>
            {/* More Menu Overlay */}
            {showMoreMenu && (
                <div
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setShowMoreMenu(false)}
                />
            )}

            {/* More Menu Panel */}
            {showMoreMenu && (
                <div className="fixed bottom-20 left-4 right-4 bg-slate-800 border border-slate-700 rounded-2xl z-50 md:hidden overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                        <span className="text-sm font-bold text-white">More</span>
                        <button
                            onClick={() => setShowMoreMenu(false)}
                            className="p-1 text-slate-400 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 p-4">
                        {moreNavItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavClick(item.id)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-colors ${
                                        isActive
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'text-slate-400 hover:bg-slate-700'
                                    }`}
                                >
                                    <Icon size={22} />
                                    <span className="text-[10px] mt-1.5 font-medium">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Bottom Navigation Bar */}
            <nav
                className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-slate-900 border-t border-slate-700/50 safe-area-pb"
                aria-label="Mobile navigation"
            >
                <div className="flex justify-around items-center h-16" role="tablist">
                    {mainNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavClick(item.id)}
                                aria-current={isActive ? 'page' : undefined}
                                aria-label={item.label}
                                role="tab"
                                aria-selected={isActive}
                                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                                    isActive ? 'text-green-400' : 'text-slate-400 active:text-slate-200'
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

                    {/* More Button */}
                    <button
                        onClick={() => setShowMoreMenu(!showMoreMenu)}
                        aria-label="More options"
                        className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
                            isMoreActive || showMoreMenu ? 'text-green-400' : 'text-slate-400 active:text-slate-200'
                        }`}
                    >
                        <MoreHorizontal size={20} className={isMoreActive || showMoreMenu ? 'text-green-400' : ''} />
                        <span className="text-[10px] mt-1 font-medium">More</span>
                        {isMoreActive && (
                            <div className="absolute top-0 w-8 h-0.5 bg-green-400 rounded-full" aria-hidden="true" />
                        )}
                    </button>
                </div>
            </nav>
        </>
    );
};

export default BottomNav;
