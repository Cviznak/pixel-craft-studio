import React, { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import {
  Cloud,
  CloudOff,
  X,
  Mail,
  Lock,
  RefreshCw,
  LogOut,
  Check,
  Sparkles,
  FolderArchive,
  Clock,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';
import type { CloudSyncSummary } from '../utils/cloudSync';

interface CloudAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  displayName: string;
  onUpdateDisplayName: (name: string) => void;
  isSyncing: boolean;
  lastSyncedAt: string | null;
  lastSyncSummary: CloudSyncSummary | null;
  onSyncNow: () => Promise<void>;
  onSignOut: () => Promise<void>;
  localVaultCount: number;
  wipSessionsCount: number;
}

export const CloudAuthModal: React.FC<CloudAuthModalProps> = ({
  isOpen,
  onClose,
  user,
  displayName,
  onUpdateDisplayName,
  isSyncing,
  lastSyncedAt,
  lastSyncSummary,
  onSyncNow,
  onSignOut,
  localVaultCount,
  wipSessionsCount,
}) => {
  const [authTab, setAuthTab] = useState<'magic' | 'password'>('magic');
  const [passwordMode, setPasswordMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nameDraft, setNameDraft] = useState(displayName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedNameFlash, setSavedNameFlash] = useState(false);

  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setNameDraft(displayName);
      setStatusMessage(null);
      setErrorMessage(null);
      setSavedNameFlash(false);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      setStatusMessage(`Magic link sent to ${email.trim()}! Check your inbox to finish signing in.`);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !email.trim() || !password) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      if (passwordMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (data.session) {
          setStatusMessage('Account created and signed in!');
        } else {
          setStatusMessage('Check your email to confirm your new Pixel Craft Studio account.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setStatusMessage('Signed in! Syncing your vault & stash...');
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveName = () => {
    onUpdateDisplayName(nameDraft.trim());
    setSavedNameFlash(true);
    setTimeout(() => setSavedNameFlash(false), 2000);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2 rounded-xl border ${
                !isSupabaseConfigured
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : user
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              }`}
            >
              {!isSupabaseConfigured ? (
                <CloudOff className="w-5 h-5" />
              ) : (
                <Cloud className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                {user ? 'Cloud Account & Sync' : 'Pixel Craft Cloud Sync'}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                {user
                  ? user.email
                  : 'Sync Projects Vault, Stash, WIP Journal & Published Patterns'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close cloud modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {!isSupabaseConfigured ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-1.5 leading-relaxed">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Supabase Project Not Connected Yet</span>
                </p>
                <p className="text-[11px] text-amber-100/80">
                  Pixel Craft Studio runs 100% offline in your browser by default. To activate multi-device Cloud Sync, Community Publishing, and Short Share Links (<code className="font-mono text-white">/p/:id</code>), connect your free Supabase project:
                </p>
              </div>

              <ol className="space-y-2.5 text-slate-300 bg-slate-950/70 p-4 rounded-xl border border-slate-800 list-decimal list-inside leading-relaxed">
                <li>
                  Create a new project in the <strong className="text-white">Supabase Dashboard</strong> and run <code className="text-indigo-300 font-mono">supabase/migrations/20261119_wave4_community_and_cloud_sync.sql</code> in SQL Editor.
                </li>
                <li>
                  Copy your <strong className="text-white">Project URL</strong> and <strong className="text-white">Publishable Key</strong> (<code className="text-emerald-300 font-mono">sb_publishable_...</code>).
                </li>
                <li>
                  Set <code className="text-cyan-300 font-mono">VITE_SUPABASE_URL</code> and <code className="text-cyan-300 font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> in <code className="text-white font-mono">.env.local</code> & Vercel Environment Variables (see <code className="text-white font-mono">SUPABASE_SETUP.md</code>).
                </li>
              </ol>

              <div className="grid grid-cols-2 gap-2.5 text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5 mb-1">
                    <FolderArchive className="w-3.5 h-3.5 text-indigo-400" />
                    Local Vault Ready
                  </div>
                  <p className="text-[11px] text-slate-400">{localVaultCount} projects saved locally</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-[11px] font-bold text-white flex items-center gap-1.5 mb-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    WIP Journal Ready
                  </div>
                  <p className="text-[11px] text-slate-400">{wipSessionsCount} sessions saved locally</p>
                </div>
              </div>
            </div>
          ) : user ? (
            <div className="space-y-4">
              {/* Signed-in Profile */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="font-bold text-emerald-200 truncate">{user.email}</div>
                    <div className="text-[11px] text-emerald-300/80">
                      {lastSyncedAt
                        ? `Last synced ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                        : 'Cloud sync active for Vault, Stash & WIP stats'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>

              {lastSyncSummary && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-sm font-bold text-white font-mono">+{lastSyncSummary.pushedProjects}</div>
                    <div className="text-[10px] text-slate-400">Pushed</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-sm font-bold text-indigo-300 font-mono">+{lastSyncSummary.pulledProjects}</div>
                    <div className="text-[10px] text-slate-400">Pulled</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-sm font-bold text-emerald-300 font-mono">{lastSyncSummary.mergedStashItems}</div>
                    <div className="text-[10px] text-slate-400">Stash Shades</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                    <div className="text-sm font-bold text-pink-300 font-mono">{lastSyncSummary.mergedWipSessions}</div>
                    <div className="text-[10px] text-slate-400">WIP Sessions</div>
                  </div>
                </div>
              )}

              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                  Creator Display Name (shown on published patterns)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="e.g. CozyStitchStudio"
                    maxLength={40}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1 transition"
                  >
                    {savedNameFlash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                    <span>{savedNameFlash ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Local cache stays intact even if you sign out.
                </span>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/60 hover:text-red-300 border border-slate-700 text-slate-300 font-semibold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Benefits Banner */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-[11px] leading-relaxed">
                Sign in to sync your <strong className="text-white">Projects Vault</strong>, <strong className="text-white">DMC/Perler Stash</strong>, and <strong className="text-white">WIP Session Journal</strong> across phone, tablet, and desktop — plus edit or delete patterns you publish.
              </div>

              {/* Method Toggle */}
              <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800 font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('magic');
                    setErrorMessage(null);
                    setStatusMessage(null);
                  }}
                  className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    authTab === 'magic' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Magic Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('password');
                    setErrorMessage(null);
                    setStatusMessage(null);
                  }}
                  className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    authTab === 'password' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Email & Password</span>
                </button>
              </div>

              {authTab === 'magic' ? (
                <form onSubmit={handleMagicLinkSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-60 text-white font-bold shadow-lg transition"
                  >
                    {isSubmitting ? 'Sending Link...' : 'Send Instant Magic Link'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Password
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold shadow-lg transition"
                  >
                    {isSubmitting
                      ? 'Please wait...'
                      : passwordMode === 'signin'
                      ? 'Sign In'
                      : 'Create Free Cloud Account'}
                  </button>
                  <div className="text-center text-[11px] text-slate-400">
                    {passwordMode === 'signin' ? (
                      <button
                        type="button"
                        onClick={() => setPasswordMode('signup')}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        New here? Create an account
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPasswordMode('signin')}
                        className="text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Already have an account? Sign in
                      </button>
                    )}
                  </div>
                </form>
              )}

              {statusMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px]">
                  {statusMessage}
                </div>
              )}
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]">
                  {errorMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
