import React, { useEffect, useState, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import type { Club } from '../types';
import {
  BarChart3, Image as ImageIcon, MessageSquare, TrendingUp, Activity, Zap, Database, Trash2, RefreshCw,
  Mic, Globe, Palette, CheckCircle, XCircle, Clock, Wifi, Download, FileText, Users, Trophy,
  Plus, ArrowRight, Command, Briefcase, Radio, AlertTriangle, Shield, Sparkles, LogOut
} from 'lucide-react';
import { seedDemoData, clearDemoData } from '../services/mockDataService';
import { hasDemoData } from '../services/dataPresenceService';
import { Skeleton, StatCardSkeleton } from './Skeleton';
import { getDemoClubProfile, saveDemoClubProfile, DemoClubProfile } from '../services/demoStorageService';
import { signOut } from '../services/authService';

// AI Tone options
const AI_TONES = [
  { id: 'professional', label: 'Professional', desc: 'Formal, corporate-ready content', icon: Briefcase },
  { id: 'casual', label: 'Casual', desc: 'Friendly, approachable tone', icon: MessageSquare },
  { id: 'enthusiastic', label: 'Enthusiastic', desc: 'High-energy, fan-focused', icon: Sparkles },
  { id: 'matchday', label: 'Match-Day Hype', desc: 'Electric, passionate commentary', icon: Radio },
] as const;

// Language options
const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
] as const;

// Brand color presets
const COLOR_PRESETS = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'
];

interface SettingsViewProps {
  club: Club;
  onLogout?: () => void;
}

type OrgMode = 'managed' | 'byok' | 'hybrid';
type ClubMode = 'inherit' | 'byok';

const SettingsView: React.FC<SettingsViewProps> = ({ club, onLogout }) => {
  const orgId = club.org_id;
  const clubId = club.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orgMode, setOrgMode] = useState<OrgMode>('managed');
  const [orgByokKey, setOrgByokKey] = useState('');

  const [clubMode, setClubMode] = useState<ClubMode>('inherit');
  const [clubByokKey, setClubByokKey] = useState('');

  // Demo Data State
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDemoClub, setIsDemoClub] = useState(false);

  // AI Usage Stats
  const [usageStats, setUsageStats] = useState<{
    totalRequests: number;
    textRequests: number;
    imageRequests: number;
    totalInputChars: number;
    totalOutputChars: number;
    last7Days: number;
    last30Days: number;
    dailyUsage: number[];
    featureBreakdown: { feature: string; count: number }[];
    recentActivity: { action: string; timestamp: string; type: string }[];
  } | null>(null);

  // Phase 1: Branding & Tone Settings
  const [aiTone, setAiTone] = useState<string>('professional');
  const [contentLanguage, setContentLanguage] = useState<string>('en');
  const [brandColor, setBrandColor] = useState<string>('#22c55e');
  const [isSavingBranding, setIsSavingBranding] = useState(false);

  // Club Profile Settings
  const [clubProfile, setClubProfile] = useState<DemoClubProfile>({
    club_id: clubId,
    display_name: club.name,
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    address: '',
    stadium_name: '',
    website_url: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Phase 3: System Health
  const [systemHealth, setSystemHealth] = useState<{
    supabaseStatus: 'connected' | 'error' | 'checking';
    geminiStatus: 'connected' | 'error' | 'checking';
    latency: number;
    lastChecked: Date | null;
  }>({
    supabaseStatus: 'checking',
    geminiStatus: 'checking',
    latency: 0,
    lastChecked: null,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
        // Load club profile from localStorage (works in both demo and non-demo mode)
        const savedProfile = getDemoClubProfile(clubId);
        if (savedProfile) {
          setClubProfile(savedProfile);
        } else {
          // Initialize with club name
          setClubProfile(prev => ({ ...prev, display_name: club.name }));
        }

        if (!supabase || !isSupabaseConfigured()) {
          setLoading(false);
          return;
        }

        if (orgId) {
          const { data: orgSettings, error: orgErr } = await supabase
            .from('org_ai_settings')
            .select('mode')
            .eq('org_id', orgId)
            .maybeSingle();
          if (orgErr) throw orgErr;
          if (orgSettings?.mode) setOrgMode(orgSettings.mode as OrgMode);
        }

        const { data: clubSettings, error: clubErr } = await supabase
          .from('club_ai_settings')
          .select('mode')
          .eq('club_id', clubId)
          .maybeSingle();
        if (clubErr) throw clubErr;
        if (clubSettings?.mode) setClubMode(clubSettings.mode as ClubMode);

        // Check if current club is demo club
        const demoStatus = await hasDemoData(clubId);
        setIsDemoClub(demoStatus);

        // Load AI usage stats
        const { data: usageEvents, error: usageErr } = await supabase
          .from('ai_usage_events')
          .select('*')
          .eq('club_id', clubId)
          .order('created_at', { ascending: false });

        if (!usageErr && usageEvents) {
          const now = new Date();
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const textRequests = usageEvents.filter(e => e.meta?.type !== 'image_generation').length;
          const imageRequests = usageEvents.filter(e => e.meta?.type === 'image_generation').length;
          const last7 = usageEvents.filter(e => new Date(e.created_at) > sevenDaysAgo).length;
          const last30 = usageEvents.filter(e => new Date(e.created_at) > thirtyDaysAgo).length;
          const totalInputChars = usageEvents.reduce((sum, e) => sum + (e.approx_input_chars || 0), 0);
          const totalOutputChars = usageEvents.reduce((sum, e) => sum + (e.approx_output_chars || 0), 0);

          // Calculate daily usage for last 7 days
          const dailyUsage = Array(7).fill(0);
          usageEvents.forEach(e => {
            const daysDiff = Math.floor((now.getTime() - new Date(e.created_at).getTime()) / (24 * 60 * 60 * 1000));
            if (daysDiff < 7) dailyUsage[6 - daysDiff]++;
          });

          // Feature breakdown
          const featureCounts: Record<string, number> = {};
          usageEvents.forEach(e => {
            const feature = e.meta?.feature || 'Other';
            featureCounts[feature] = (featureCounts[feature] || 0) + 1;
          });
          const featureBreakdown = Object.entries(featureCounts)
            .map(([feature, count]) => ({ feature, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

          // Recent activity (last 10)
          const recentActivity = usageEvents.slice(0, 10).map(e => ({
            action: e.meta?.feature || 'AI Request',
            timestamp: e.created_at,
            type: e.meta?.type || 'text',
          }));

          setUsageStats({
            totalRequests: usageEvents.length,
            textRequests,
            imageRequests,
            totalInputChars,
            totalOutputChars,
            last7Days: last7,
            last30Days: last30,
            dailyUsage,
            featureBreakdown,
            recentActivity,
          });
        }

        // Load club branding settings
        const { data: brandingData } = await supabase
          .from('club_settings')
          .select('ai_tone, content_language, brand_color')
          .eq('club_id', clubId)
          .maybeSingle();

        if (brandingData) {
          if (brandingData.ai_tone) setAiTone(brandingData.ai_tone);
          if (brandingData.content_language) setContentLanguage(brandingData.content_language);
          if (brandingData.brand_color) setBrandColor(brandingData.brand_color);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId, clubId]);

  const saveOrg = async () => {
    if (!supabase || !isSupabaseConfigured()) return;
    if (!orgId) {
      setError('Missing org_id on club. Re-sync schema/client.');
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-settings', {
        body: {
          scope: 'org',
          orgId,
          mode: orgMode,
          byokKey: orgByokKey || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOrgByokKey('');
      setSuccess('Org AI settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save org settings');
    }
  };

  const saveClub = async () => {
    if (!supabase || !isSupabaseConfigured()) return;
    setError(null);
    setSuccess(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-settings', {
        body: {
          scope: 'club',
          clubId,
          mode: clubMode,
          byokKey: clubByokKey || undefined,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setClubByokKey('');
      setSuccess('Club AI settings saved.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save club settings');
    }
  };

  const handleSeedData = async () => {
    if (!orgId) return;
    setIsSeeding(true);
    setError(null);
    setSuccess(null);
    
    try {
      const result = await seedDemoData(orgId);
      
      if (result.clubId !== clubId) {
        setSuccess(`Demo data generated in 'Neon City FC'. Please switch clubs to view it.`);
      } else {
        setSuccess('Demo data generated successfully! Refresh to see changes.');
        setIsDemoClub(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate demo data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to clear all demo data? This cannot be undone.')) return;

    setIsClearing(true);
    setError(null);
    setSuccess(null);

    try {
      await clearDemoData(clubId, false);
      setSuccess('Demo data cleared successfully.');
      setIsDemoClub(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to clear demo data');
    } finally {
      setIsClearing(false);
    }
  };

  // Save club profile
  const saveClubProfile = async () => {
    setIsSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      saveDemoClubProfile(clubProfile);
      setSuccess('Club profile saved successfully!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save club profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Phase 1: Save branding settings
  const saveBrandingSettings = async () => {
    if (!supabase || !isSupabaseConfigured()) return;
    setIsSavingBranding(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('club_settings')
        .upsert({
          club_id: clubId,
          ai_tone: aiTone,
          content_language: contentLanguage,
          brand_color: brandColor,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'club_id' });

      if (error) throw error;
      setSuccess('Branding settings saved successfully!');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save branding settings');
    } finally {
      setIsSavingBranding(false);
    }
  };

  // Phase 3: Check system health
  const checkSystemHealth = async () => {
    setSystemHealth(prev => ({ ...prev, supabaseStatus: 'checking', geminiStatus: 'checking' }));

    const startTime = Date.now();

    // Check Supabase
    try {
      if (supabase && isSupabaseConfigured()) {
        const { error } = await supabase.from('clubs').select('id').limit(1);
        setSystemHealth(prev => ({
          ...prev,
          supabaseStatus: error ? 'error' : 'connected',
          latency: Date.now() - startTime,
        }));
      } else {
        setSystemHealth(prev => ({ ...prev, supabaseStatus: 'error' }));
      }
    } catch {
      setSystemHealth(prev => ({ ...prev, supabaseStatus: 'error' }));
    }

    // For Gemini, we'll assume connected if Supabase is working (as Gemini is called via edge functions)
    setSystemHealth(prev => ({
      ...prev,
      geminiStatus: prev.supabaseStatus === 'connected' ? 'connected' : 'error',
      lastChecked: new Date(),
    }));
  };

  // Phase 4: Export usage data
  const exportUsageData = () => {
    if (!usageStats) return;

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Requests', usageStats.totalRequests],
      ['Text Requests', usageStats.textRequests],
      ['Image Requests', usageStats.imageRequests],
      ['Total Input Characters', usageStats.totalInputChars],
      ['Total Output Characters', usageStats.totalOutputChars],
      ['Last 7 Days', usageStats.last7Days],
      ['Last 30 Days', usageStats.last30Days],
      [''],
      ['Feature Breakdown'],
      ...usageStats.featureBreakdown.map(f => [f.feature, f.count]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-usage-${club.name.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Run health check on mount
  useEffect(() => {
    checkSystemHealth();
  }, []);

  // Calculate max daily usage for chart scaling
  const maxDailyUsage = useMemo(() => {
    if (!usageStats?.dailyUsage) return 1;
    return Math.max(...usageStats.dailyUsage, 1);
  }, [usageStats?.dailyUsage]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-white glow-text">
          SETTINGS <span className="text-blue-400">OPS</span>
        </h2>
        <p className="text-slate-400 font-mono text-xs mt-1">
          Configure AI mode (managed vs BYOK). Club overrides org.
        </p>
      </div>

      {error && (
        <div className="text-xs font-mono text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs font-mono text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          {success}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          {/* Settings cards skeleton */}
          <div className="glass-card p-6 rounded-2xl border border-white/5">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-20" variant="rectangular" />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Club Profile Section */}
      <div className="glass-card p-6 rounded-2xl border border-green-500/20 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Shield size={18} className="text-green-500" />
            Club Profile
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            {clubProfile.updated_at ? `Last saved: ${new Date(clubProfile.updated_at).toLocaleDateString()}` : 'Not saved yet'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Club Name */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
              Club Name
            </label>
            <input
              type="text"
              value={clubProfile.display_name || ''}
              onChange={(e) => setClubProfile(prev => ({ ...prev, display_name: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
              placeholder="Enter club name"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
              Logo URL
            </label>
            <input
              type="url"
              value={clubProfile.logo_url || ''}
              onChange={(e) => setClubProfile(prev => ({ ...prev, logo_url: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Contact Email */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={clubProfile.contact_email || ''}
              onChange={(e) => setClubProfile(prev => ({ ...prev, contact_email: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
              placeholder="contact@club.com"
            />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
              Contact Phone
            </label>
            <input
              type="tel"
              value={clubProfile.contact_phone || ''}
              onChange={(e) => setClubProfile(prev => ({ ...prev, contact_phone: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
              placeholder="+44 123 456 7890"
            />
          </div>

          {/* Stadium Name */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
              Stadium / Ground
            </label>
            <input
              type="text"
              value={clubProfile.stadium_name || ''}
              onChange={(e) => setClubProfile(prev => ({ ...prev, stadium_name: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
              placeholder="Stadium name"
            />
          </div>

          {/* Website */}
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
              Website
            </label>
            <input
              type="url"
              value={clubProfile.website_url || ''}
              onChange={(e) => setClubProfile(prev => ({ ...prev, website_url: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-green-500 outline-none"
              placeholder="https://yourclub.com"
            />
          </div>

          {/* Address - Full Width */}
          <div className="md:col-span-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2">
              Address
            </label>
            <textarea
              value={clubProfile.address || ''}
              onChange={(e) => setClubProfile(prev => ({ ...prev, address: e.target.value }))}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-green-500 outline-none resize-none h-20"
              placeholder="Club address..."
            />
          </div>
        </div>

        {/* Logo Preview */}
        {clubProfile.logo_url && (
          <div className="flex items-center gap-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <img
              src={clubProfile.logo_url}
              alt="Club logo"
              className="w-16 h-16 rounded-lg object-contain bg-white/10"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
            <div>
              <p className="text-sm text-white font-bold">{clubProfile.display_name || club.name}</p>
              {clubProfile.stadium_name && (
                <p className="text-xs text-slate-400">{clubProfile.stadium_name}</p>
              )}
            </div>
          </div>
        )}

        <button
          onClick={saveClubProfile}
          disabled={isSavingProfile}
          className="w-full py-3 rounded-lg bg-green-500 text-black font-display font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSavingProfile ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {isSavingProfile ? 'Saving...' : 'Save Club Profile'}
        </button>
      </div>

      {/* AI Usage Analytics */}
      {usageStats && (
        <div className="glass-card p-6 rounded-2xl border border-blue-500/20 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-blue-400" />
                AI Usage Analytics
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Club-level AI consumption metrics
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <Activity size={14} className="text-blue-400 animate-pulse" />
              <span className="text-xs font-mono text-blue-400 uppercase font-bold">Live Data</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Requests */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <Zap size={40} className="text-blue-400" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">Total Requests</p>
                <p className="text-3xl font-display font-bold text-white">{usageStats.totalRequests.toLocaleString()}</p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Last 7d: <span className="text-blue-400">{usageStats.last7Days}</span>
                </div>
              </div>
            </div>

            {/* Text Generation */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <MessageSquare size={40} className="text-purple-500" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">Text Gen</p>
                <p className="text-3xl font-display font-bold text-white">{usageStats.textRequests.toLocaleString()}</p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  {((usageStats.textRequests / usageStats.totalRequests) * 100).toFixed(0)}% of total
                </div>
              </div>
            </div>

            {/* Image Generation */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <ImageIcon size={40} className="text-amber-500" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">Image Gen</p>
                <p className="text-3xl font-display font-bold text-white">{usageStats.imageRequests.toLocaleString()}</p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  {usageStats.imageRequests > 0 ? ((usageStats.imageRequests / usageStats.totalRequests) * 100).toFixed(0) : 0}% of total
                </div>
              </div>
            </div>

            {/* Activity Trend */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-green-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <TrendingUp size={40} className="text-green-500" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">30-Day Activity</p>
                <p className="text-3xl font-display font-bold text-white">{usageStats.last30Days.toLocaleString()}</p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Avg: {(usageStats.last30Days / 30).toFixed(1)}/day
                </div>
              </div>
            </div>
          </div>

          {/* Data Volume */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Input Volume</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-display font-bold text-white">
                  {(usageStats.totalInputChars / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-slate-400 font-mono mb-1">characters</p>
              </div>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Output Volume</p>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-display font-bold text-white">
                  {(usageStats.totalOutputChars / 1000).toFixed(1)}K
                </p>
                <p className="text-xs text-slate-400 font-mono mb-1">characters</p>
              </div>
              <div className="mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          {/* Phase 2: Daily Usage Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">7-Day Usage Trend</p>
              <div className="h-24 flex items-end gap-1">
                {usageStats.dailyUsage.map((val, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t transition-all hover:opacity-80"
                      style={{ height: `${(val / maxDailyUsage) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[8px] text-slate-600 font-mono">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).getDay()]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Breakdown */}
            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-3">Top Features</p>
              <div className="space-y-2">
                {usageStats.featureBreakdown.length > 0 ? (
                  usageStats.featureBreakdown.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="flex-1">
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-slate-300 truncate">{f.feature}</span>
                          <span className="text-slate-500 font-mono">{f.count}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${(f.count / usageStats.featureBreakdown[0].count) * 100}%`,
                              background: ['#3b82f6', '#8b5cf6', '#f59e0b', '#22c55e', '#ef4444'][i % 5],
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-600 text-xs font-mono">No feature data yet</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
            <p className="text-[10px] text-slate-400 font-mono">
              💡 <span className="font-bold">Tip:</span> These metrics help you understand AI usage patterns and plan capacity.
            </p>
            <button
              onClick={exportUsageData}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-xs font-bold text-blue-400 hover:bg-blue-500/20 transition-colors"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Phase 5: Quick Actions Hub */}
      <div className="glass-card p-6 rounded-2xl border border-green-500/20 space-y-4">
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Command size={18} className="text-green-500" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'squad' }))}
            className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-xl transition-all group"
          >
            <Users size={24} className="text-slate-400 group-hover:text-green-500 transition-colors" />
            <span className="text-[10px] font-mono text-slate-400 group-hover:text-white uppercase">Add Player</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'match' }))}
            className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-xl transition-all group"
          >
            <Trophy size={24} className="text-slate-400 group-hover:text-green-500 transition-colors" />
            <span className="text-[10px] font-mono text-slate-400 group-hover:text-white uppercase">New Match</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'content' }))}
            className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-xl transition-all group"
          >
            <FileText size={24} className="text-slate-400 group-hover:text-green-500 transition-colors" />
            <span className="text-[10px] font-mono text-slate-400 group-hover:text-white uppercase">Create Content</span>
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'commercial' }))}
            className="flex flex-col items-center gap-2 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-green-500/30 rounded-xl transition-all group"
          >
            <Briefcase size={24} className="text-slate-400 group-hover:text-green-500 transition-colors" />
            <span className="text-[10px] font-mono text-slate-400 group-hover:text-white uppercase">Add Sponsor</span>
          </button>
        </div>
        <div className="bg-white/5 p-3 rounded-lg border border-white/5">
          <p className="text-[10px] text-slate-500 font-mono">
            <span className="text-green-500 font-bold">Keyboard shortcuts:</span> Press <kbd className="px-1.5 py-0.5 bg-black/40 rounded text-slate-400 mx-1">?</kbd> anywhere to see all available shortcuts
          </p>
        </div>
      </div>

      {/* Phase 3: System Health Dashboard */}
      <div className="glass-card p-6 rounded-2xl border border-cyan-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Shield size={18} className="text-cyan-400" />
            System Health
          </h3>
          <button
            onClick={checkSystemHealth}
            className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs font-bold text-cyan-400 hover:bg-cyan-500/20 transition-colors"
          >
            <RefreshCw size={12} className={systemHealth.supabaseStatus === 'checking' ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Supabase Status */}
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              systemHealth.supabaseStatus === 'connected' ? 'bg-green-500/20' :
              systemHealth.supabaseStatus === 'error' ? 'bg-red-500/20' : 'bg-slate-500/20'
            }`}>
              {systemHealth.supabaseStatus === 'connected' ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : systemHealth.supabaseStatus === 'error' ? (
                <XCircle size={20} className="text-red-500" />
              ) : (
                <Clock size={20} className="text-slate-400 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase">Database</p>
              <p className={`text-sm font-bold ${
                systemHealth.supabaseStatus === 'connected' ? 'text-green-500' :
                systemHealth.supabaseStatus === 'error' ? 'text-red-500' : 'text-slate-400'
              }`}>
                {systemHealth.supabaseStatus === 'connected' ? 'Connected' :
                 systemHealth.supabaseStatus === 'error' ? 'Error' : 'Checking...'}
              </p>
            </div>
          </div>

          {/* Gemini API Status */}
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              systemHealth.geminiStatus === 'connected' ? 'bg-green-500/20' :
              systemHealth.geminiStatus === 'error' ? 'bg-red-500/20' : 'bg-slate-500/20'
            }`}>
              {systemHealth.geminiStatus === 'connected' ? (
                <CheckCircle size={20} className="text-green-500" />
              ) : systemHealth.geminiStatus === 'error' ? (
                <XCircle size={20} className="text-red-500" />
              ) : (
                <Clock size={20} className="text-slate-400 animate-pulse" />
              )}
            </div>
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase">AI Engine</p>
              <p className={`text-sm font-bold ${
                systemHealth.geminiStatus === 'connected' ? 'text-green-500' :
                systemHealth.geminiStatus === 'error' ? 'text-red-500' : 'text-slate-400'
              }`}>
                {systemHealth.geminiStatus === 'connected' ? 'Connected' :
                 systemHealth.geminiStatus === 'error' ? 'Error' : 'Checking...'}
              </p>
            </div>
          </div>

          {/* Latency */}
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              systemHealth.latency < 100 ? 'bg-green-500/20' :
              systemHealth.latency < 300 ? 'bg-yellow-500/20' : 'bg-red-500/20'
            }`}>
              <Wifi size={20} className={
                systemHealth.latency < 100 ? 'text-green-500' :
                systemHealth.latency < 300 ? 'text-yellow-500' : 'text-red-500'
              } />
            </div>
            <div>
              <p className="text-xs font-mono text-slate-500 uppercase">Latency</p>
              <p className={`text-sm font-bold ${
                systemHealth.latency < 100 ? 'text-green-500' :
                systemHealth.latency < 300 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {systemHealth.latency}ms
              </p>
            </div>
          </div>
        </div>

        {systemHealth.lastChecked && (
          <p className="text-[10px] text-slate-600 font-mono text-right">
            Last checked: {systemHealth.lastChecked.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Phase 1: Club Branding & AI Tone */}
      <div className="glass-card p-6 rounded-2xl border border-purple-500/20 space-y-6">
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
          <Mic size={18} className="text-purple-500" />
          Club Branding & AI Tone
        </h3>

        {/* AI Tone Selection */}
        <div>
          <label className="text-[10px] font-mono text-slate-500 uppercase block mb-3">AI Voice Style</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {AI_TONES.map((tone) => {
              const Icon = tone.icon;
              return (
                <button
                  key={tone.id}
                  onClick={() => setAiTone(tone.id)}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    aiTone === tone.id
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-white/10 hover:border-white/20 bg-white/5'
                  }`}
                >
                  <Icon size={20} className={aiTone === tone.id ? 'text-purple-500' : 'text-slate-400'} />
                  <p className={`text-sm font-bold mt-2 ${aiTone === tone.id ? 'text-white' : 'text-slate-300'}`}>
                    {tone.label}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1">{tone.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language & Brand Color */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2 flex items-center gap-2">
              <Globe size={12} /> Content Language
            </label>
            <select
              value={contentLanguage}
              onChange={(e) => setContentLanguage(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase block mb-2 flex items-center gap-2">
              <Palette size={12} /> Brand Color
            </label>
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBrandColor(color)}
                    className={`w-8 h-8 rounded-lg transition-all ${
                      brandColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent"
                title="Custom color"
              />
            </div>
          </div>
        </div>

        <button
          onClick={saveBrandingSettings}
          disabled={isSavingBranding}
          className="w-full py-3 rounded-lg bg-purple-500 text-white font-display font-bold uppercase tracking-widest disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSavingBranding ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {isSavingBranding ? 'Saving...' : 'Save Branding Settings'}
        </button>
      </div>

      {/* Phase 4: Recent Activity Log */}
      {usageStats && usageStats.recentActivity.length > 0 && (
        <div className="glass-card p-6 rounded-2xl border border-amber-500/20 space-y-4">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Activity size={18} className="text-amber-500" />
            Recent Activity
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {usageStats.recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-black/40 rounded-lg border border-white/5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === 'image' ? 'bg-amber-500/20' : 'bg-blue-500/20'
                }`}>
                  {activity.type === 'image' ? (
                    <ImageIcon size={14} className="text-amber-500" />
                  ) : (
                    <MessageSquare size={14} className="text-blue-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{activity.action}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
          Org AI Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {(['managed', 'byok', 'hybrid'] as OrgMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setOrgMode(m)}
              className={`px-4 py-3 rounded-lg border text-xs font-bold uppercase transition-colors ${
                orgMode === m ? 'border-blue-500/50 bg-blue-500/10 text-white' : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-mono text-slate-500 uppercase">Org BYOK Key (optional)</label>
          <input
            value={orgByokKey}
            onChange={(e) => setOrgByokKey(e.target.value)}
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
            placeholder="Paste Gemini API key (stored encrypted)"
          />
          <p className="text-[10px] font-mono text-slate-500 mt-2">
            Managed is default. Hybrid means org key is used unless a club override exists.
          </p>
        </div>

        <button
          onClick={saveOrg}
          disabled={!orgId}
          className="w-full py-3 rounded-lg bg-blue-500 text-black font-display font-bold uppercase tracking-widest disabled:opacity-50"
        >
          Save Org AI Settings
        </button>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
          Club AI Override
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {(['inherit', 'byok'] as ClubMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setClubMode(m)}
              className={`px-4 py-3 rounded-lg border text-xs font-bold uppercase transition-colors ${
                clubMode === m ? 'border-purple-500/50 bg-purple-500/10 text-white' : 'border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {clubMode === 'byok' && (
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase">Club BYOK Key</label>
            <input
              value={clubByokKey}
              onChange={(e) => setClubByokKey(e.target.value)}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 outline-none"
              placeholder="Paste club-specific Gemini key (stored encrypted)"
            />
          </div>
        )}

        <button
          onClick={saveClub}
          className="w-full py-3 rounded-lg bg-purple-500 text-white font-display font-bold uppercase tracking-widest"
        >
          Save Club AI Settings
        </button>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <Database size={18} className="text-cyan-400" />
            Demo Data
          </h3>
          {isDemoClub && (
            <div className="px-2 py-1 bg-cyan-900/30 border border-cyan-500/30 rounded text-[10px] text-cyan-400 font-mono uppercase">
              Demo Mode Active
            </div>
          )}
        </div>
        
        <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
          Generate sample data to explore PitchSide AI's features. This will populate your organization with "Neon City FC" demo data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={handleSeedData}
            disabled={isSeeding}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-cyan-900/20 hover:bg-cyan-900/40 border border-cyan-500/30 rounded-lg text-cyan-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={16} className={isSeeding ? 'animate-spin' : ''} />
            <span className="text-xs font-bold uppercase tracking-wider">
              {isSeeding ? 'Generating...' : 'Generate Demo Data'}
            </span>
          </button>

          {isDemoClub && (
            <button
              onClick={handleClearData}
              disabled={isClearing}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-red-900/20 hover:bg-red-900/40 border border-red-500/30 rounded-lg text-red-300 transition-colors disabled:opacity-50"
            >
              <Trash2 size={16} className={isClearing ? 'animate-bounce' : ''} />
              <span className="text-xs font-bold uppercase tracking-wider">
                {isClearing ? 'Clearing...' : 'Clear Demo Data'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Account Section - Logout for mobile */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 md:hidden">
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2 mb-4">
          <LogOut size={18} className="text-red-400" />
          Account
        </h3>
        <button
          onClick={async () => {
            await signOut();
            if (onLogout) onLogout();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 transition-colors"
        >
          <LogOut size={18} />
          <span className="font-bold">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsView;


