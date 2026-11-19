import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import {
  Share2,
  X,
  Globe,
  Link2,
  Copy,
  Check,
  ExternalLink,
  CloudOff,
  Sparkles,
  Lock,
  GitFork,
} from 'lucide-react';
import type { BackstitchLine, GridConfig, PaletteColor } from '../types/craft';
import { COMMUNITY_CATEGORIES } from '../utils/communityPatterns';
import { generateProjectThumbnail } from '../utils/storage';
import { buildShareablePatternUrl } from '../utils/shareUtils';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { publishPatternToCloud } from '../utils/cloudSync';

const GUEST_AUTHOR_KEY = 'pcs_guest_author_name';

interface PublishPatternModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GridConfig;
  gridData: number[][];
  palette: PaletteColor[];
  backstitches?: BackstitchLine[];
  user: User | null;
  defaultAuthorName: string;
  remixedFrom?: { shortId: string; title: string } | null;
  onOpenCloudAuth: () => void;
  onPublished?: (shortId: string, title: string) => void;
}

export const PublishPatternModal: React.FC<PublishPatternModalProps> = ({
  isOpen,
  onClose,
  config,
  gridData,
  palette,
  backstitches = [],
  user,
  defaultAuthorName,
  remixedFrom = null,
  onOpenCloudAuth,
  onPublished,
}) => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Community');
  const [tagsText, setTagsText] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [includeRemixAttribution, setIncludeRemixAttribution] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishedResult, setPublishedResult] = useState<{
    shortId: string;
    shareUrl: string;
  } | null>(null);
  const [copiedShortUrl, setCopiedShortUrl] = useState(false);
  const [copiedOfflineUrl, setCopiedOfflineUrl] = useState(false);

  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      const dims = `${gridData[0]?.length || config.width}×${gridData.length || config.height}`;
      setTitle(remixedFrom ? `${remixedFrom.title} (Remix)` : `My ${config.craftType} Pattern (${dims})`);
      const savedGuest = typeof window !== 'undefined' ? localStorage.getItem(GUEST_AUTHOR_KEY) || '' : '';
      setAuthorName(defaultAuthorName || savedGuest || 'Studio Crafter');
      setDescription('');
      setCategory('Community');
      setTagsText(config.craftType);
      setIsPublic(true);
      setIncludeRemixAttribution(!!remixedFrom);
      setErrorMsg(null);
      setPublishedResult(null);
      setCopiedShortUrl(false);
      setCopiedOfflineUrl(false);
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

  const previewThumb = useMemo(() => {
    if (!isOpen || gridData.length === 0) return '';
    return generateProjectThumbnail(gridData, palette, backstitches);
  }, [isOpen, gridData, palette, backstitches]);

  if (!isOpen) return null;

  const categories = ['Community', ...COMMUNITY_CATEGORIES.filter((c) => c !== 'All')];

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (gridData.length === 0) return;

    setIsPublishing(true);
    setErrorMsg(null);
    try {
      const cleanAuthor = authorName.trim() || 'Anonymous Crafter';
      if (!user && typeof window !== 'undefined') {
        try {
          localStorage.setItem(GUEST_AUTHOR_KEY, cleanAuthor);
        } catch {
          // ignore
        }
      }

      const tags = tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await publishPatternToCloud({
        title,
        description,
        authorName: cleanAuthor,
        category,
        tags,
        isPublic,
        config,
        gridData,
        palette,
        backstitches,
        userId: user?.id || null,
        remixedFromShortId: includeRemixAttribution && remixedFrom ? remixedFrom.shortId : null,
        remixedFromTitle: includeRemixAttribution && remixedFrom ? remixedFrom.title : undefined,
      });

      setPublishedResult({ shortId: res.shortId, shareUrl: res.shareUrl });
      onPublished?.(res.shortId, res.record.title);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not publish pattern');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyShortUrl = async () => {
    if (!publishedResult) return;
    try {
      await navigator.clipboard.writeText(publishedResult.shareUrl);
      setCopiedShortUrl(true);
      setTimeout(() => setCopiedShortUrl(false), 2200);
    } catch {
      window.prompt('Copy short link:', publishedResult.shareUrl);
    }
  };

  const handleCopyOfflineUrl = async () => {
    const hashUrl = buildShareablePatternUrl(config, gridData, palette, title || 'My Pattern');
    try {
      await navigator.clipboard.writeText(hashUrl);
      setCopiedOfflineUrl(true);
      setTimeout(() => setCopiedOfflineUrl(false), 2200);
    } catch {
      window.prompt('Copy offline share URL:', hashUrl);
    }
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
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-pink-500/15 border border-pink-500/30 text-pink-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-white truncate">
                Publish Pattern & Short Share Link (/p/:id)
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Share a compact link on Reddit, Pinterest, Discord, or list in the live Community Feed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close publish modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {!isSupabaseConfigured ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="font-bold text-amber-300 flex items-center gap-2">
                  <CloudOff className="w-4 h-4" />
                  <span>Supabase Cloud Required for Short /p/:id Links</span>
                </div>
                <p className="text-[11px] text-amber-100/85 leading-relaxed">
                  Short cloud links & Community Feed storage require connecting a Supabase project (<code className="font-mono text-white">VITE_SUPABASE_URL</code> + <code className="font-mono text-white">VITE_SUPABASE_PUBLISHABLE_KEY</code>). You can still share full patterns offline right now using URL-hash compression!
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyOfflineUrl}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2 transition shadow"
                >
                  {copiedOfflineUrl ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                  <span>{copiedOfflineUrl ? 'Copied Instant Offline URL!' : 'Copy Instant Offline Share URL'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenCloudAuth();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold transition"
                >
                  Cloud Setup Guide
                </button>
              </div>
            </div>
          ) : publishedResult ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                <Sparkles className="w-7 h-7 text-emerald-400 mx-auto" />
                <h3 className="text-sm font-bold text-white">
                  {isPublic ? 'Published to Live Community Feed!' : 'Short Share Link Created!'}
                </h3>
                <p className="text-[11px] text-emerald-200/80">
                  Anyone with this short URL can inspect the chart, view colors, or remix it in Studio.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <input
                  type="text"
                  readOnly
                  value={publishedResult.shareUrl}
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 bg-transparent font-mono text-xs text-cyan-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopyShortUrl}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  {copiedShortUrl ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedShortUrl ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate(`/p/${publishedResult.shortId}`);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Open /p/{publishedResult.shortId}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handlePublish} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
              {/* Thumbnail Preview */}
              <div className="sm:col-span-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-3 flex flex-col items-center gap-2">
                {previewThumb ? (
                  <img
                    src={previewThumb}
                    alt="Pattern preview"
                    className="w-full aspect-square object-contain rounded-xl bg-slate-900 border border-slate-800"
                    style={{ imageRendering: 'pixelated' }}
                  />
                ) : (
                  <div className="w-full aspect-square rounded-xl bg-slate-900" />
                )}
                <div className="text-[11px] font-mono text-slate-400 text-center">
                  {gridData[0]?.length || config.width}×{gridData.length || config.height} • {palette.length} colors
                </div>
              </div>

              {/* Metadata Form */}
              <div className="sm:col-span-8 space-y-3">
                {remixedFrom && (
                  <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <GitFork className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span className="text-[11px] text-teal-200 truncate">
                        Remixing <strong className="text-white">/p/{remixedFrom.shortId}</strong> ({remixedFrom.title})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncludeRemixAttribution((v) => !v)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition shrink-0 ${
                        includeRemixAttribution
                          ? 'bg-teal-600 text-white border-teal-500'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {includeRemixAttribution ? 'Credit ON' : 'Credit OFF'}
                    </button>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Pattern Title *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={80}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      {user ? 'Creator Name' : 'Guest Nickname'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={40}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Notes / Story (Optional)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={300}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Thread tips, bead finish notes, or fabric recommendations..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={tagsText}
                    onChange={(e) => setTagsText(e.target.value)}
                    placeholder="botanical, cute, retro"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Visibility */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      isPublic
                        ? 'bg-indigo-600/15 border-indigo-500/60 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-[11px]">
                      <Globe className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Public Showcase</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Listed in Community Feed + /p/:id</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      !isPublic
                        ? 'bg-pink-600/15 border-pink-500/60 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="font-bold flex items-center gap-1.5 text-[11px]">
                      <Lock className="w-3.5 h-3.5 text-pink-400" />
                      <span>Unlisted Short Link</span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">Only people with the /p/:id link</p>
                  </button>
                </div>

                {!user && (
                  <p className="text-[11px] text-slate-400">
                    Publishing as guest with nickname.{' '}
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenCloudAuth();
                      }}
                      className="text-indigo-400 hover:text-indigo-300 underline font-semibold"
                    >
                      Sign in
                    </button>{' '}
                    if you want to edit or delete this pattern later.
                  </p>
                )}

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[11px]">
                    {errorMsg}
                  </div>
                )}

                <div className="pt-1 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPublishing}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-60 text-white font-bold shadow-lg flex items-center gap-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>{isPublishing ? 'Publishing...' : 'Publish & Get Short Link'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
