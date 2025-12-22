import React, { useState } from 'react';
import { signInWithEmailPassword, signUpWithEmailPassword } from '../services/authService';

type Mode = 'signin' | 'signup';

const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      if (mode === 'signin') {
        await signInWithEmailPassword(email.trim(), password);
        // Success - auth listener will handle navigation
      } else {
        const result = await signUpWithEmailPassword(email.trim(), password);
        
        // Check if email confirmation is required
        if (result.user && !result.session) {
          setSuccess('Check your email for a confirmation link, then sign in!');
          setMode('signin');
        }
        // If session exists, user is auto-logged in (no confirmation required)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed';
      
      // Provide friendlier error messages
      if (message.includes('Email not confirmed')) {
        setError('Please check your email and click the confirmation link first.');
      } else if (message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (message.includes('User already registered')) {
        setError('This email is already registered. Try signing in instead.');
        setMode('signin');
      } else if (message.includes('Password should be at least')) {
        setError('Password must be at least 6 characters long.');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-slate-100 flex items-center justify-center p-6">
      <div className="glass-panel w-full max-w-md rounded-2xl p-8 border border-white/10">
        <h1 className="text-3xl font-display font-bold text-white tracking-widest uppercase">
          Pitch<span className="text-neon-blue">Side</span>
        </h1>
        <p className="text-xs font-mono text-slate-400 mt-2">
          {mode === 'signin' 
            ? 'Sign in to your workspace to access clubs, inbox, and AI tools.'
            : 'Create your account to get started with PitchSide.'}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none transition-colors"
              placeholder="you@club.com"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono text-slate-500 uppercase">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-neon-blue outline-none transition-colors"
              placeholder="••••••••"
              required
              minLength={6}
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
            {mode === 'signup' && (
              <p className="text-[10px] font-mono text-slate-600 mt-1">
                Minimum 6 characters
              </p>
            )}
          </div>

          {error && (
            <div className="text-xs font-mono text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          {success && (
            <div className="text-xs font-mono text-green-300 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-neon-blue text-black font-display font-bold uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,243,255,0.35)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              mode === 'signin' ? 'Sign in' : 'Create account'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs font-mono text-slate-500">
          <span>
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setSuccess(null);
            }}
            className="text-neon-blue hover:text-white transition-colors"
            type="button"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        {/* Demo mode hint */}
        <div className="mt-6 pt-4 border-t border-white/5">
          <p className="text-[10px] font-mono text-slate-600 text-center">
            Football club management powered by AI
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
