import React, { useEffect, useMemo, useState } from 'react';
import type { Org, Club } from '../types';
import { getMyOrgs, createOrg } from '../services/orgService';
import { createClub, getClubsForOrg } from '../services/clubService';
import { signOut } from '../services/authService';
import { Skeleton } from './Skeleton';

interface WorkspaceGateProps {
  onReady: (ctx: { orgId: string; clubId: string }) => void;
}

const WorkspaceGate: React.FC<WorkspaceGateProps> = ({ onReady }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [orgs, setOrgs] = useState<Org[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);

  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedClubId, setSelectedClubId] = useState<string>('');

  const [orgName, setOrgName] = useState('');

  const [clubName, setClubName] = useState('');
  const [clubNickname, setClubNickname] = useState('');
  const [clubSlug, setClubSlug] = useState('');
  const [clubTone, setClubTone] = useState('Bold, confident, but never arrogant.');
  const [clubPrimary, setClubPrimary] = useState('#00f3ff');
  const [clubSecondary, setClubSecondary] = useState('#bc13fe');

  const selectedOrg = useMemo(
    () => orgs.find((o) => o.id === selectedOrgId) ?? null,
    [orgs, selectedOrgId]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const myOrgs = await getMyOrgs();
        setOrgs(myOrgs);
        if (myOrgs.length === 1) {
          setSelectedOrgId(myOrgs[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load workspaces');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadClubs = async () => {
      if (!selectedOrgId) {
        setClubs([]);
        setSelectedClubId('');
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const orgClubs = await getClubsForOrg(selectedOrgId);
        setClubs(orgClubs);
        if (orgClubs.length === 1) {
          setSelectedClubId(orgClubs[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load clubs');
      } finally {
        setLoading(false);
      }
    };
    loadClubs();
  }, [selectedOrgId]);

  useEffect(() => {
    if (selectedOrgId && selectedClubId) {
      onReady({ orgId: selectedOrgId, clubId: selectedClubId });
    }
  }, [selectedOrgId, selectedClubId, onReady]);

  const handleCreateOrg = async () => {
    setError(null);
    setLoading(true);
    try {
      const org = await createOrg(orgName.trim());
      const myOrgs = await getMyOrgs();
      setOrgs(myOrgs);
      setSelectedOrgId(org.id);
      setOrgName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClub = async () => {
    if (!selectedOrgId) return;
    setError(null);
    setLoading(true);
    try {
      const club = await createClub(selectedOrgId, {
        name: clubName.trim(),
        nickname: clubNickname.trim(),
        slug: clubSlug.trim(),
        tone_context: clubTone,
        primary_color: clubPrimary,
        secondary_color: clubSecondary,
      });
      const orgClubs = await getClubsForOrg(selectedOrgId);
      setClubs(orgClubs);
      setSelectedClubId(club.id);
      setClubName('');
      setClubNickname('');
      setClubSlug('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center p-6">
      <div className="glass-panel w-full max-w-2xl rounded-2xl p-8 border border-white/10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-display font-bold text-white tracking-widest uppercase">
              Workspace Setup
            </h2>
            <p className="text-xs font-mono text-slate-400 mt-2">
              Choose a workspace (org) and club to continue.
            </p>
          </div>
          <button
            onClick={signOut}
            className="text-xs font-mono text-slate-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>

        {error && (
          <div className="mt-6 text-xs font-mono text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* ORG SECTION */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
              Workspaces
            </h3>
            {loading && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                <span className="text-[10px] font-mono text-slate-500">Loading…</span>
              </div>
            )}
          </div>

          {loading && orgs.length === 0 ? (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border border-white/10 bg-black/20">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              ))}
            </div>
          ) : orgs.length > 0 ? (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              {orgs.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOrgId(o.id)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    selectedOrgId === o.id
                      ? 'border-neon-blue/40 bg-neon-blue/10'
                      : 'border-white/10 hover:border-white/20 bg-black/20'
                  }`}
                >
                  <div className="text-sm font-bold text-white">{o.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 mt-1">ORG_ID: {o.id}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-4 border border-dashed border-white/10 rounded-xl p-6">
              <p className="text-xs font-mono text-slate-400">
                No workspaces yet. Create your first workspace to continue.
              </p>
              <div className="mt-4 flex flex-col md:flex-row gap-3">
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
                  placeholder="Workspace name (e.g. Neon City Media Team)"
                />
                <button
                  onClick={handleCreateOrg}
                  disabled={!orgName.trim() || loading}
                  className="px-5 py-3 rounded-lg bg-neon-blue text-black font-display font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CLUB SECTION */}
        {selectedOrg && (
          <div className="mt-10">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white">
                Clubs in {selectedOrg.name}
              </h3>
            </div>

            {clubs.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                {clubs.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClubId(c.id)}
                    className={`p-4 rounded-xl border text-left transition-colors ${
                      selectedClubId === c.id
                        ? 'border-neon-purple/40 bg-neon-purple/10'
                        : 'border-white/10 hover:border-white/20 bg-black/20'
                    }`}
                  >
                    <div className="text-sm font-bold text-white">{c.name}</div>
                    <div className="text-[10px] font-mono text-slate-500 mt-1">{c.nickname}</div>
                    <div className="text-[10px] font-mono text-slate-600 mt-1">CLUB_ID: {c.id}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 border border-dashed border-white/10 rounded-xl p-6 space-y-4">
                <p className="text-xs font-mono text-slate-400">
                  No clubs found in this workspace. Create your first club.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
                    placeholder="Club name (e.g. Neon City FC)"
                  />
                  <input
                    value={clubNickname}
                    onChange={(e) => setClubNickname(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
                    placeholder="Nickname (e.g. The Cyberpunks)"
                  />
                  <input
                    value={clubSlug}
                    onChange={(e) => setClubSlug(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
                    placeholder="Slug (e.g. neon-city-fc)"
                  />
                  <input
                    value={clubTone}
                    onChange={(e) => setClubTone(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
                    placeholder="Tone context"
                  />
                  <input
                    value={clubPrimary}
                    onChange={(e) => setClubPrimary(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
                    placeholder="#00f3ff"
                  />
                  <input
                    value={clubSecondary}
                    onChange={(e) => setClubSecondary(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none"
                    placeholder="#bc13fe"
                  />
                </div>

                <button
                  onClick={handleCreateClub}
                  disabled={!clubName.trim() || !clubNickname.trim() || !clubSlug.trim() || loading}
                  className="w-full py-3 rounded-lg bg-neon-purple text-white font-display font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  Create Club
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkspaceGate;









