
import React, { useState } from 'react';
import { 
  LayoutGrid, 
  CalendarDays, 
  FileCode, 
  Users, 
  Settings, 
  Menu, 
  X,
  Zap,
  Radio,
  Bell,
  Check,
  Briefcase,
  ShieldAlert,
  Newspaper,
  Inbox,
  BookOpen
} from 'lucide-react';
import { MOCK_CLUB } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSwitchWorkspace?: () => void;
  workspaceLabel?: string;
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
    { id: 'dashboard', label: 'Command Center', icon: LayoutGrid },
    { id: 'fixtures', label: 'Match Schedule', icon: CalendarDays },
    { id: 'squad', label: 'Squad Bio-Metrics', icon: Users },
    { id: 'content', label: 'Holo-Content', icon: FileCode },
    { id: 'commercial', label: 'Sponsor Nexus', icon: Briefcase },
    { id: 'inbox', label: 'Intel Inbox', icon: Inbox },
    { id: 'admin', label: 'HQ Operations', icon: ShieldAlert },
    { id: 'comms', label: 'Fan Comms', icon: Newspaper },
    { id: 'education', label: 'Education', icon: BookOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-dark-bg text-slate-100 overflow-hidden font-sans selection:bg-neon-blue selection:text-black">
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-grid-pattern bg-[length:40px_40px] opacity-[0.05] pointer-events-none z-0"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink z-50 shadow-[0_0_20px_rgba(0,243,255,0.5)]"></div>

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
        <div className={`p-8 flex items-center gap-4 relative overflow-hidden ${isSidebarCollapsed ? 'md:p-4 md:justify-center' : ''}`}>
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-neon-blue/10 to-transparent opacity-50"></div>
          <div className="relative z-10 p-2 border border-neon-blue/30 rounded bg-neon-blue/10 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
            <Zap className="text-neon-blue animate-pulse" size={24} />
          </div>
          {!isSidebarCollapsed && (
            <div className="relative z-10">
              <h1 className="text-2xl font-display font-bold tracking-wider text-white leading-none uppercase">Pitch<span className="text-neon-blue">AI</span></h1>
              <p className="text-[10px] text-neon-purple tracking-[0.2em] uppercase mt-1 glow-text">Pro Edition v2.0</p>
            </div>
          )}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 py-6 space-y-2 overflow-y-auto ${isSidebarCollapsed ? 'md:px-2' : 'px-4'}`}>
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
                className={`
                  w-full flex items-center gap-4 px-4 py-4 rounded-xl text-sm font-medium transition-all duration-300 group relative overflow-hidden
                  ${isSidebarCollapsed ? 'md:justify-center md:px-2' : ''}
                  ${isActive 
                    ? 'text-white shadow-[0_0_20px_rgba(0,243,255,0.15)] border border-neon-blue/30' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }
                `}
              >
                {/* Active Background Gradient */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/20 to-transparent opacity-100 transition-opacity"></div>
                )}
                
                <Icon size={20} className={`relative z-10 transition-colors duration-300 flex-shrink-0 ${isActive ? 'text-neon-blue drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]' : 'group-hover:text-neon-blue'}`} />
                {!isSidebarCollapsed && <span className="relative z-10 tracking-wide font-display uppercase">{item.label}</span>}
                
                {isActive && !isSidebarCollapsed && <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-neon-blue shadow-[0_0_10px_#00f3ff]"></div>}
              </button>
            );
          })}
        </nav>

        {/* System Status / Footer */}
        <div className={`border-t border-glass-border bg-black/20 ${isSidebarCollapsed ? 'md:p-2' : 'p-6'}`}>
          {!isSidebarCollapsed ? (
            <div className="glass-card p-4 rounded-lg flex items-center gap-3 hover:border-neon-purple/50 transition-colors cursor-pointer group">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-black relative">
                AI
                <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-black rounded-full animate-pulse"></span>
              </div>
              <div className="text-left flex-1">
                <p className="text-sm font-bold text-white group-hover:text-neon-purple transition-colors">Admin Node</p>
                <p className="text-[10px] text-emerald-400 uppercase tracking-wider">System Online</p>
              </div>
              <Settings size={16} className="text-slate-500 group-hover:animate-spin" />
            </div>
          ) : (
            <div className="hidden md:flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-purple to-blue-600 flex items-center justify-center text-xs font-bold text-white ring-2 ring-black relative">
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
              <path d="m11 17-5-5 5-5"/>
              <path d="m18 17-5-5 5-5"/>
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
             <span className="font-display font-bold text-xl tracking-wider">PITCH<span className="text-neon-blue">AI</span></span>
          </div>

          <div className="hidden md:flex flex-col">
             <h2 className="text-2xl font-display font-bold text-white tracking-widest uppercase glow-text">
                 {navItems.find(n => n.id === activeTab)?.label}
             </h2>
             <div className="flex items-center gap-2 text-[10px] text-neon-blue uppercase tracking-[0.2em] opacity-70">
                <span className="w-1 h-1 bg-neon-blue rounded-full animate-ping"></span>
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
                  <span className="w-1.5 h-1.5 bg-neon-blue rounded-full"></span>
                  {workspaceLabel ? `CLUB: ${workspaceLabel}` : 'SWITCH_CLUB'}
                </button>
             )}
             
             {/* Notification Bell */}
             <div className="relative">
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative transition-colors ${showNotifications ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-pink rounded-full shadow-[0_0_10px_#ff0055] animate-pulse"></span>
                    )}
                 </button>

                 {/* Notification Dropdown */}
                 {showNotifications && (
                     <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                        <div className="absolute right-0 top-12 w-80 bg-[#050505]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-slide-up">
                            <div className="p-4 border-b border-white/10 flex items-center justify-between">
                                <span className="text-xs font-bold font-display uppercase tracking-wider text-white">Notifications</span>
                                <button onClick={markAllRead} className="text-[10px] text-neon-blue hover:text-white transition-colors">MARK_ALL_READ</button>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {notifications.length > 0 ? (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${!n.isRead ? 'bg-white/[0.02]' : ''}`}>
                                            <div className="flex gap-3">
                                                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-neon-green' : n.type === 'alert' ? 'bg-neon-pink' : 'bg-neon-blue'}`}></div>
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
           <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none"></div>
           <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none"></div>
           
           <div className="max-w-8xl mx-auto relative z-10 animate-fade-in h-full flex flex-col">
             {children}
           </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
