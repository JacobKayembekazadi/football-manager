
import React, { useState } from 'react';
import {
  LayoutDashboard,
  Inbox,
  UserCheck,
  Calendar,
  Package,
  Building2,
  Wallet,
  Settings,
  Menu,
  X,
  Zap,
  Bell,
  LogOut,
} from 'lucide-react';
import { MOCK_CLUB } from '../types';
import { signOut } from '../services/authService';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchWorkspace?: () => void;
  workspaceLabel?: string;
  onLogout?: () => void;
}

interface Notification {
  id: string;
  text: string;
  time: string;
  isRead: boolean;
  type: 'info' | 'success' | 'alert';
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onSwitchWorkspace,
  workspaceLabel,
  onLogout,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', text: 'Match Report generated for Orbital United', time: '10m ago', isRead: false, type: 'success' },
    { id: '2', text: 'Marcus Thorn form increased to 9.1', time: '2h ago', isRead: false, type: 'info' },
    { id: '3', text: 'Scout Report ready: Quantum FC', time: '5h ago', isRead: true, type: 'alert' },
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inbox', label: 'Inbox', icon: Inbox },
    { id: 'availability', label: 'Availability', icon: UserCheck },
    { id: 'matchday', label: 'Matchday', icon: Calendar },
    { id: 'equipment', label: 'Equipment', icon: Package },
    { id: 'club-ops', label: 'Club Ops', icon: Building2 },
    { id: 'finance', label: 'Finance', icon: Wallet },
  ];

  return (
    <div className="flex h-screen bg-dark-bg text-slate-100 overflow-hidden font-sans selection:bg-green-500 selection:text-black">

      {/* Top accent bar */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-green-500 z-50"></div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-md z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Glass Sidebar */}
      <aside className={`
        fixed md:relative z-50 h-full glass-panel border-r-0 border-r-glass-border flex flex-col transition-all duration-300 ease-in-out
        ${isSidebarCollapsed ? 'md:w-20' : 'w-72'}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className={`p-6 flex items-center gap-3 ${isSidebarCollapsed ? 'md:p-4 md:justify-center' : ''}`}>
          <div className="p-2 border border-green-500/30 rounded bg-green-500/10">
            <Zap className="text-green-500" size={20} />
          </div>
          {!isSidebarCollapsed && (
            <h1 className="text-xl font-bold text-white">PitchSide</h1>
          )}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 py-6 space-y-2 overflow-y-auto ${isSidebarCollapsed ? 'md:px-2' : 'px-4'}`}
          aria-label="Main navigation"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                data-tour={`sidebar-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors
                  ${isSidebarCollapsed ? 'md:justify-center md:px-2' : ''}
                  ${isActive
                    ? 'bg-green-500/10 text-white border-l-2 border-green-500'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Icon size={18} className={`flex-shrink-0 ${isActive ? 'text-green-500' : ''}`} />
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* System Status / Footer */}
        <div className={`border-t border-glass-border bg-black/20 ${isSidebarCollapsed ? 'md:p-2' : 'p-6'}`}>
          {!isSidebarCollapsed ? (
            <div className="glass-card p-4 rounded-lg flex items-center gap-3 hover:border-purple-500/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-black relative">
                AI
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse"></span>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold text-white group-hover:text-purple-500 transition-colors">Admin Node</p>
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider">System Online</p>
              </div>
              <Settings size={16} className="text-slate-500 group-hover:animate-spin" />
            </div>
          ) : (
            <div className="hidden md:flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-black relative">
                AI
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse"></span>
              </div>
            </div>
          )}

          {/* Collapse Toggle Button - Desktop Only */}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="hidden md:flex w-full mt-4 items-center justify-center gap-2 py-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all"
            title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}
            >
              <path d="m11 17-5-5 5-5" />
              <path d="m18 17-5-5 5-5" />
            </svg>
            {!isSidebarCollapsed && <span className="text-xs font-mono uppercase">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">

        {/* Top HUD Bar */}
        <header className="h-20 glass-panel border-b border-glass-border flex items-center justify-between px-8 z-20 sticky top-0">
          <div className="flex items-center gap-4 md:hidden">
            <button onClick={() => setIsMobileMenuOpen(true)} className="text-white p-2 hover:bg-white/10 rounded-lg">
              <Menu size={24} />
            </button>
            <span className="font-display font-bold text-xl tracking-wider">PITCH<span className="text-green-500">AI</span></span>
          </div>

          <div className="hidden md:flex flex-col">
            <h2 className="text-2xl font-display font-bold text-white tracking-widest uppercase glow-text">
              {navItems.find(n => n.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-green-500 uppercase tracking-[0.2em] opacity-70">
              <span className="w-1 h-1 bg-green-500 rounded-full animate-ping"></span>
              Live Data Feed
            </div>
          </div>

          <div className="flex items-center gap-6 relative">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-black/40 rounded-full border border-white/5">
              <Radio size={14} className="text-red-500 animate-pulse" />
              <span className="text-xs font-mono text-slate-300">SERVER_LATENCY: <span className="text-green-400">12ms</span></span>
            </div>

            {onSwitchWorkspace && (
              <button
                onClick={onSwitchWorkspace}
                data-tour="workspace-switch"
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full border border-white/5 text-xs font-mono text-slate-300 hover:text-white hover:border-white/10 transition-colors"
                title="Switch club/workspace"
              >
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {workspaceLabel ? `CLUB: ${workspaceLabel}` : 'SWITCH_CLUB'}
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={async () => {
                await signOut();
                if (onLogout) onLogout();
              }}
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 hover:text-white hover:border-red-500/50 hover:bg-red-500/20 transition-colors rounded-full"
              title="Sign out"
            >
              <LogOut size={14} />
              LOGOUT
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative transition-colors ${showNotifications ? 'text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full shadow-[0_0_10px_#f43f5e] animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 top-12 w-80 bg-[#050505]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-slide-up">
                    <div className="p-4 border-b border-white/10 flex items-center justify-between">
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-white">Notifications</span>
                      <button onClick={markAllRead} className="text-[10px] text-green-500 hover:text-white transition-colors">MARK_ALL_READ</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-white/[0.02]' : ''}`}>
                            <div className="flex gap-3">
                              <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-emerald-500' : n.type === 'alert' ? 'bg-rose-500' : 'bg-green-500'}`}></div>
                              <div>
                                <p className={`text-xs font-medium leading-relaxed ${!n.isRead ? 'text-white' : 'text-slate-400'}`}>{n.text}</p>
                                <p className="text-[10px] text-slate-600 font-mono mt-1">{n.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-slate-500 text-xs font-mono">NO DATA</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Area with Custom Scrollbar */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-green-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

          <div className="max-w-8xl mx-auto relative z-10 animate-fade-in h-full flex flex-col">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default Layout;
