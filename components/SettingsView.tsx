import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import type { Club } from '../types';
import { BarChart3, Image as ImageIcon, MessageSquare, TrendingUp, Activity, Zap } from 'lucide-react';

interface SettingsViewProps {
  club: Club;
}

type OrgMode = 'managed' | 'byok' | 'hybrid';
type ClubMode = 'inherit' | 'byok';

const SettingsView: React.FC<SettingsViewProps> = ({ club }) => {
  const orgId = club.org_id;
  const clubId = club.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [orgMode, setOrgMode] = useState<OrgMode>('managed');
  const [orgByokKey, setOrgByokKey] = useState('');

  const [clubMode, setClubMode] = useState<ClubMode>('inherit');
  const [clubByokKey, setClubByokKey] = useState('');

  // AI Usage Stats
  const [usageStats, setUsageStats] = useState<{
    totalRequests: number;
    textRequests: number;
    imageRequests: number;
    totalInputChars: number;
    totalOutputChars: number;
    last7Days: number;
    last30Days: number;
  } | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);

      try {
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

          setUsageStats({
            totalRequests: usageEvents.length,
            textRequests,
            imageRequests,
            totalInputChars,
            totalOutputChars,
            last7Days: last7,
            last30Days: last30,
          });
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

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-display font-bold text-white glow-text">
          SETTINGS <span className="text-neon-blue">OPS</span>
        </h2>
        <p className="text-slate-400 font-mono text-xs mt-1">
          Configure AI mode (managed vs BYOK). Club overrides org.
        </p>
      </div>

      {(loading || error || success) && (
        <div className="space-y-2">
          {loading && <div className="text-[10px] font-mono text-slate-500">Loading…</div>}
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
        </div>
      )}

      {/* AI Usage Analytics */}
      {usageStats && (
        <div className="glass-card p-6 rounded-2xl border border-neon-blue/20 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <BarChart3 size={18} className="text-neon-blue" />
                AI Usage Analytics
              </h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Club-level AI consumption metrics
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-neon-blue/10 border border-neon-blue/30 rounded-lg">
              <Activity size={14} className="text-neon-blue animate-pulse" />
              <span className="text-xs font-mono text-neon-blue uppercase font-bold">Live Data</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Requests */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-neon-blue/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <Zap size={40} className="text-neon-blue" />
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-mono text-slate-500 uppercase mb-2">Total Requests</p>
                <p className="text-3xl font-display font-bold text-white">{usageStats.totalRequests.toLocaleString()}</p>
                <div className="mt-2 text-[10px] text-slate-400 font-mono">
                  Last 7d: <span className="text-neon-blue">{usageStats.last7Days}</span>
                </div>
              </div>
            </div>

            {/* Text Generation */}
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-neon-purple/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <MessageSquare size={40} className="text-neon-purple" />
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
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-neon-pink/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <ImageIcon size={40} className="text-neon-pink" />
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
            <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden group hover:border-neon-green/30 transition-colors">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-30 transition-opacity">
                <TrendingUp size={40} className="text-neon-green" />
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
                <div className="h-full bg-gradient-to-r from-neon-blue to-cyan-400 rounded-full" style={{ width: '75%' }}></div>
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
                <div className="h-full bg-gradient-to-r from-neon-purple to-neon-pink rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-3 rounded-lg border border-white/5">
            <p className="text-[10px] text-slate-400 font-mono">
              💡 <span className="font-bold">Tip:</span> These metrics help you understand AI usage patterns and plan capacity. 
              Data refreshes when you reload this page.
            </p>
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
                orgMode === m ? 'border-neon-blue/50 bg-neon-blue/10 text-white' : 'border-white/10 text-slate-400 hover:text-white'
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
            className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
            placeholder="Paste Gemini API key (stored encrypted)"
          />
          <p className="text-[10px] font-mono text-slate-500 mt-2">
            Managed is default. Hybrid means org key is used unless a club override exists.
          </p>
        </div>

        <button
          onClick={saveOrg}
          disabled={!orgId}
          className="w-full py-3 rounded-lg bg-neon-blue text-black font-display font-bold uppercase tracking-widest disabled:opacity-50"
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
                clubMode === m ? 'border-neon-purple/50 bg-neon-purple/10 text-white' : 'border-white/10 text-slate-400 hover:text-white'
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
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
              placeholder="Paste club-specific Gemini key (stored encrypted)"
            />
          </div>
        )}

        <button
          onClick={saveClub}
          className="w-full py-3 rounded-lg bg-neon-purple text-white font-display font-bold uppercase tracking-widest"
        >
          Save Club AI Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsView;


