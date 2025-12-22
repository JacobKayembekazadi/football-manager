/**
 * InboxView — Unified Email Inbox with Master/My tabs
 * 
 * Features:
 * - Master Inbox (club master → org master precedence)
 * - My Inbox (user's private connections)
 * - Connect Gmail/Outlook buttons
 * - Sync Now functionality
 * - AI-powered smart replies
 * - Send via Edge Function
 */

import React, { useState, useEffect } from 'react';
import { InboxEmail, Club, EmailConnection, EmailProvider } from '../types';
import { generateSmartReply, analyzeEmailSentiment } from '../services/geminiService';
import {
  listEmailConnections,
  findMasterConnection,
  findMyConnection,
  startEmailOAuth,
  syncEmailConnection,
  sendReplyForEmail,
} from '../services/emailConnectionService';
import { isSupabaseConfigured } from '../services/supabaseClient';
import {
  Mail,
  Inbox,
  Users,
  User,
  RefreshCw,
  Send,
  Loader2,
  Link2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HeartPulse,
  Reply,
  ChevronRight,
  Settings,
  Plus,
} from 'lucide-react';

interface InboxViewProps {
  club: Club;
  orgId: string;
  emails: InboxEmail[];
  onRefresh?: () => void;
}

type TabType = 'master' | 'my';

const InboxView: React.FC<InboxViewProps> = ({ club, orgId, emails, onRefresh }) => {
  const [activeTab, setActiveTab] = useState<TabType>('master');
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [masterConnection, setMasterConnection] = useState<EmailConnection | null>(null);
  const [myConnection, setMyConnection] = useState<EmailConnection | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<InboxEmail | null>(null);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [replyDraft, setReplyDraft] = useState('');
  const [sentiment, setSentiment] = useState<{ score: number; mood: string } | null>(null);

  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isProcessingReply, setIsProcessingReply] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectMenu, setShowConnectMenu] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load connections on mount
  useEffect(() => {
    if (isSupabaseConfigured() && orgId && club?.id) {
      loadConnections();
    }
  }, [orgId, club?.id]);

  const loadConnections = async () => {
    setIsLoadingConnections(true);
    try {
      const [all, master, my] = await Promise.all([
        listEmailConnections(orgId, club.id),
        findMasterConnection(orgId, club.id),
        findMyConnection(orgId, club.id),
      ]);
      setConnections(all);
      setMasterConnection(master);
      setMyConnection(my);
    } catch (err) {
      console.error('Failed to load email connections:', err);
      setError('Failed to load email connections');
    } finally {
      setIsLoadingConnections(false);
    }
  };

  // Filter emails by tab
  const filteredEmails = emails.filter((email) => {
    if (activeTab === 'master') {
      // Master inbox: emails from shared connections or unassigned
      return email.visibility === 'shared' || !email.connection_id;
    } else {
      // My inbox: emails from user's private connections
      return email.visibility === 'private';
    }
  });

  // Handle OAuth connect
  const handleConnect = async (provider: EmailProvider, isMaster: boolean) => {
    setIsConnecting(true);
    setError(null);
    setShowConnectMenu(false);
    try {
      const url = await startEmailOAuth({
        provider,
        orgId,
        clubId: isMaster ? club.id : null, // Master at club level, personal at org level
        visibility: isMaster ? 'shared' : 'private',
        isMaster,
        returnTo: window.location.href,
      });
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to start OAuth');
      setIsConnecting(false);
    }
  };

  // Handle sync
  const handleSync = async () => {
    const conn = activeTab === 'master' ? masterConnection : myConnection;
    if (!conn) {
      setError('No connection to sync');
      return;
    }
    setIsSyncing(true);
    setError(null);
    try {
      await syncEmailConnection(conn.id, club.id);
      onRefresh?.();
    } catch (err: any) {
      setError(err.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle email selection
  const handleSelectEmail = async (email: InboxEmail) => {
    setSelectedEmail(email);
    setReplyDraft('');
    setSmartReplies([]);
    setSentiment(null);
    setIsProcessingReply(true);

    try {
      const [replies, sent] = await Promise.all([
        generateSmartReply(email),
        analyzeEmailSentiment(email),
      ]);
      setSmartReplies(replies);
      setSentiment(sent);
    } catch (err) {
      console.error('Failed to generate smart replies:', err);
    } finally {
      setIsProcessingReply(false);
    }
  };

  // Handle send
  const handleSend = async () => {
    if (!selectedEmail || !replyDraft.trim()) return;
    setIsSending(true);
    setError(null);
    try {
      await sendReplyForEmail(selectedEmail.id, replyDraft);
      setReplyDraft('');
      setSelectedEmail(null);
      onRefresh?.();
    } catch (err: any) {
      setError(err.message || 'Failed to send');
    } finally {
      setIsSending(false);
    }
  };

  const currentConnection = activeTab === 'master' ? masterConnection : myConnection;
  const hasConnection = !!currentConnection;

  return (
    <div className="h-full flex flex-col gap-4 animate-fade-in">
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-display font-bold text-white flex items-center gap-2">
            <Mail className="text-neon-blue" />
            INBOX
          </h1>

          {/* Tabs */}
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('master')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'master'
                  ? 'bg-neon-blue/20 text-neon-blue'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users size={16} />
              Master Inbox
              {masterConnection && (
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                activeTab === 'my'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User size={16} />
              My Inbox
              {myConnection && (
                <span className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {hasConnection && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-all"
            >
              <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          )}

          {/* Connect dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowConnectMenu(!showConnectMenu)}
              disabled={isConnecting}
              className="flex items-center gap-2 px-3 py-2 bg-neon-blue/20 hover:bg-neon-blue/30 border border-neon-blue/30 rounded-lg text-sm text-neon-blue transition-all"
            >
              {isConnecting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Plus size={14} />
              )}
              Connect Email
            </button>

            {showConnectMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-white/10 text-xs text-slate-400 uppercase font-mono">
                  {activeTab === 'master' ? 'Shared Master Inbox' : 'Personal Inbox'}
                </div>
                <button
                  onClick={() => handleConnect('gmail', activeTab === 'master')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                    <Mail size={16} className="text-red-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-white font-medium">Gmail</div>
                    <div className="text-xs text-slate-500">Google Workspace</div>
                  </div>
                  <ExternalLink size={12} className="ml-auto text-slate-500" />
                </button>
                <button
                  onClick={() => handleConnect('outlook', activeTab === 'master')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Mail size={16} className="text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-white font-medium">Outlook</div>
                    <div className="text-xs text-slate-500">Microsoft 365</div>
                  </div>
                  <ExternalLink size={12} className="ml-auto text-slate-500" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-400/60 hover:text-red-400">
            ×
          </button>
        </div>
      )}

      {/* Connection status */}
      {currentConnection && (
        <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded-lg text-sm">
          <CheckCircle2 size={14} className="text-neon-green" />
          <span className="text-slate-400">Connected:</span>
          <span className="text-white font-medium">{currentConnection.email_address}</span>
          <span className="text-xs text-slate-500 capitalize">({currentConnection.provider})</span>
          {currentConnection.is_master && (
            <span className="px-2 py-0.5 bg-neon-blue/20 text-neon-blue text-xs rounded">Master</span>
          )}
        </div>
      )}

      {/* No connection state */}
      {!hasConnection && !isLoadingConnections && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Link2 size={24} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {activeTab === 'master' ? 'No Master Inbox Connected' : 'No Personal Inbox Connected'}
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              {activeTab === 'master'
                ? 'Connect a shared email account that all team members can access.'
                : 'Connect your personal email to manage your own correspondence.'}
            </p>
            <div className="flex justify-center gap-2">
              <button
                onClick={() => handleConnect('gmail', activeTab === 'master')}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-all"
              >
                <Mail size={14} />
                Connect Gmail
              </button>
              <button
                onClick={() => handleConnect('outlook', activeTab === 'master')}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg text-blue-400 text-sm transition-all"
              >
                <Mail size={14} />
                Connect Outlook
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      {(hasConnection || filteredEmails.length > 0) && (
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Email list */}
          <div className="w-1/3 flex flex-col glass-panel rounded-xl border border-white/10 overflow-hidden">
            <div className="p-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500 uppercase">
                {filteredEmails.length} Messages
              </span>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredEmails.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  <Inbox size={24} className="mx-auto mb-2 opacity-50" />
                  No emails yet. Click "Sync Now" to fetch.
                </div>
              ) : (
                filteredEmails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-4 border-b border-white/5 cursor-pointer transition-all ${
                      selectedEmail?.id === email.id
                        ? 'bg-neon-blue/10 border-l-2 border-l-neon-blue'
                        : 'hover:bg-white/5'
                    } ${!email.is_read ? 'bg-white/[0.02]' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-medium truncate ${!email.is_read ? 'text-white' : 'text-slate-400'}`}>
                        {email.from}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 flex-shrink-0 ml-2">
                        {new Date(email.received_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className={`text-sm mb-1 truncate ${!email.is_read ? 'text-neon-blue font-semibold' : 'text-slate-300'}`}>
                      {email.subject}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{email.preview}</p>
                    {email.category && (
                      <span className="mt-2 inline-block px-2 py-0.5 bg-white/5 text-[10px] text-slate-400 rounded uppercase">
                        {email.category}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Email detail / compose */}
          <div className="flex-1 flex flex-col glass-panel rounded-xl border border-white/10 overflow-hidden">
            {!selectedEmail ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Mail size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Select an email to view</p>
                </div>
              </div>
            ) : (
              <>
                {/* Email header */}
                <div className="p-4 bg-black/40 border-b border-white/5">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="text-xs text-neon-blue hover:text-white mb-3 flex items-center gap-1"
                  >
                    ← Back to list
                  </button>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 mr-4">
                      <h3 className="text-lg font-bold text-white mb-1">{selectedEmail.subject}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        From: {selectedEmail.from} &lt;{selectedEmail.from_email}&gt;
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {selectedEmail.category && (
                        <span className="px-2 py-0.5 bg-white/10 text-[10px] text-white uppercase rounded">
                          {selectedEmail.category}
                        </span>
                      )}
                      {sentiment && (
                        <div
                          className={`flex items-center gap-2 px-2 py-1 rounded border ${
                            sentiment.score > 60
                              ? 'bg-green-500/10 border-green-500/30 text-green-400'
                              : sentiment.score < 40
                              ? 'bg-red-500/10 border-red-500/30 text-red-400'
                              : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                          }`}
                        >
                          <HeartPulse size={12} />
                          <span className="text-[10px] font-bold uppercase">
                            {sentiment.mood} ({sentiment.score}%)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email body */}
                <div className="flex-1 p-6 overflow-y-auto bg-black/10">
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                    {selectedEmail.body}
                  </p>
                </div>

                {/* Reply section */}
                <div className="p-4 border-t border-white/10 bg-black/40">
                  {isProcessingReply ? (
                    <div className="flex items-center gap-2 text-neon-blue text-xs font-mono py-4">
                      <Loader2 size={14} className="animate-spin" />
                      GENERATING SMART REPLIES...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Smart reply suggestions */}
                      {smartReplies.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
                            AI Suggestions
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {smartReplies.map((reply, i) => (
                              <button
                                key={i}
                                onClick={() => setReplyDraft(reply)}
                                className={`px-3 py-2 text-xs rounded-lg border transition-all ${
                                  replyDraft === reply
                                    ? 'bg-neon-blue/20 border-neon-blue/50 text-neon-blue'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:border-neon-blue/30'
                                }`}
                              >
                                <Reply size={10} className="inline mr-1" />
                                {reply.length > 60 ? reply.substring(0, 60) + '...' : reply}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reply textarea */}
                      <div>
                        <textarea
                          value={replyDraft}
                          onChange={(e) => setReplyDraft(e.target.value)}
                          placeholder="Write your reply..."
                          className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white placeholder-slate-500 h-24 resize-none focus:border-neon-blue focus:outline-none"
                        />
                      </div>

                      {/* Send button */}
                      <div className="flex justify-end">
                        <button
                          onClick={handleSend}
                          disabled={!replyDraft.trim() || isSending}
                          className="flex items-center gap-2 px-4 py-2 bg-neon-blue hover:bg-neon-blue/80 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg text-sm text-black font-semibold transition-all"
                        >
                          {isSending ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Send size={14} />
                          )}
                          {isSending ? 'Sending...' : 'Send Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Demo mode notice */}
      {!isSupabaseConfigured() && (
        <div className="mt-auto p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-400 text-xs text-center">
          Demo mode: Email connections require Supabase configuration
        </div>
      )}
    </div>
  );
};

export default InboxView;
