import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import {
  X,
  Heart,
  Copy,
  Check,
  ArrowRight,
  FolderPlus,
  Trash2,
  User as UserIcon,
  Maximize2,
  Palette,
  CloudOff,
  GitFork,
  MessageSquare,
  Send,
} from 'lucide-react';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import { buildSharedPatternMeta, updateDocumentMeta } from '../utils/craftRoutes';
import {
  deletePatternComment,
  deletePublishedPattern,
  fetchPatternComments,
  fetchPublishedPatternByShortId,
  postPatternComment,
  type PatternComment,
  type PublishedPatternRecord,
} from '../utils/cloudSync';

interface SharedPatternModalProps {
  shortId: string | null;
  onClose: () => void;
  user: User | null;
  displayName?: string;
  likedPatternIds: Set<string>;
  onToggleLike: (patternId: string) => void;
  onOpenCloudAuth: () => void;
  onOpenInStudio: (record: PublishedPatternRecord, gridData: number[][]) => void;
  onSaveToVault: (record: PublishedPatternRecord, gridData: number[][]) => Promise<void>;
  onSelectCreator?: (authorName: string) => void;
  onDeleted?: () => void;
}

export const SharedPatternModal: React.FC<SharedPatternModalProps> = ({
  shortId,
  onClose,
  user,
  displayName = '',
  likedPatternIds,
  onToggleLike,
  onOpenCloudAuth,
  onOpenInStudio,
  onSaveToVault,
  onSelectCreator,
  onDeleted,
}) => {
  const [prevShortId, setPrevShortId] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [record, setRecord] = useState<PublishedPatternRecord | null>(null);
  const [decodedGrid, setDecodedGrid] = useState<number[][]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [likeDelta, setLikeDelta] = useState<number>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [savedToVault, setSavedToVault] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Community Build Tips / Comments state
  const [comments, setComments] = useState<PatternComment[]>([]);
  const [commentsLoadedFor, setCommentsLoadedFor] = useState<string | null>(null);
  const [commentsTableReady, setCommentsTableReady] = useState<boolean>(true);
  const [commentDraft, setCommentDraft] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (shortId !== prevShortId) {
    setPrevShortId(shortId);
    setRecord(null);
    setDecodedGrid([]);
    setFetchError(null);
    setLikeDelta(0);
    setCopiedLink(false);
    setSavedToVault(false);
    setComments([]);
    setCommentsLoadedFor(null);
    setCommentDraft('');
    setCommentError(null);
  }

  useEffect(() => {
    if (!shortId || !isSupabaseConfigured) return;
    let cancelled = false;
    fetchPublishedPatternByShortId(shortId)
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          setFetchError(`Pattern /p/${shortId} was not found or may have been deleted.`);
        } else {
          setRecord(res.record);
          setDecodedGrid(res.gridData);
          updateDocumentMeta(
            buildSharedPatternMeta(
              res.record.short_id,
              res.record.title,
              res.record.craft_type,
              res.record.width,
              res.record.height
            ),
            null
          );
        }
        setLoadedId(shortId);
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : 'Failed to load shared pattern');
        setLoadedId(shortId);
      });
    return () => {
      cancelled = true;
    };
  }, [shortId]);

  // Fetch Build Tips / Comments once pattern UUID loads
  useEffect(() => {
    if (!record?.id || !isSupabaseConfigured) return;
    let cancelled = false;
    fetchPatternComments(record.id)
      .then((res) => {
        if (cancelled) return;
        setComments(res.comments);
        setCommentsTableReady(res.tableReady);
        setCommentsLoadedFor(record.id);
      })
      .catch(() => {
        if (cancelled) return;
        setCommentsLoadedFor(record.id);
      });
    return () => {
      cancelled = true;
    };
  }, [record?.id]);

  useEffect(() => {
    if (!shortId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortId, onClose]);

  useEffect(() => {
    if (!record || decodedGrid.length === 0 || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const rows = decodedGrid.length;
    const cols = decodedGrid[0]?.length || record.width;
    const cellSize = Math.max(4, Math.min(18, Math.floor(380 / Math.max(cols, rows))));

    const isPeyote = record.craft_type === 'loom' && record.bead_stitch_style === 'peyote';
    const isBrick = record.craft_type === 'loom' && record.bead_stitch_style === 'brick';

    canvas.width = Math.ceil((cols + (isBrick && rows > 1 ? 0.5 : 0)) * cellSize);
    canvas.height = Math.ceil((rows + (isPeyote && cols > 1 ? 0.5 : 0)) * cellSize);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const idx = decodedGrid[y][x];
        if (idx < 0 || !record.palette[idx]) continue;
        const ox = isBrick && y % 2 === 1 ? 0.5 * cellSize : 0;
        const oy = isPeyote && x % 2 === 1 ? 0.5 * cellSize : 0;
        ctx.fillStyle = record.palette[idx].hex;
        ctx.fillRect(x * cellSize + ox, y * cellSize + oy, cellSize, cellSize);
      }
    }

    if (Array.isArray(record.backstitches) && record.backstitches.length > 0) {
      ctx.lineCap = 'round';
      for (const bs of record.backstitches) {
        ctx.strokeStyle = bs.colorHex || '#ffffff';
        ctx.lineWidth = Math.max(1.5, cellSize * 0.16);
        ctx.beginPath();
        ctx.moveTo(bs.x1 * cellSize, bs.y1 * cellSize);
        ctx.lineTo(bs.x2 * cellSize, bs.y2 * cellSize);
        ctx.stroke();
      }
    }
  }, [record, decodedGrid]);

  if (!shortId) return null;

  const isLoading = isSupabaseConfigured && loadedId !== shortId && !fetchError;
  const isLiked = record ? likedPatternIds.has(record.id) : false;
  const isOwner = !!(user && record && record.author_id === user.id);

  const handleCopyShortLink = async () => {
    const url = `${window.location.origin}/p/${shortId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      window.prompt('Copy link:', url);
    }
  };

  const handleSaveVaultClick = async () => {
    if (!record || decodedGrid.length === 0) return;
    await onSaveToVault(record, decodedGrid);
    setSavedToVault(true);
  };

  const handleLikeClick = () => {
    if (!record) return;
    if (!user) {
      onOpenCloudAuth();
      return;
    }
    setLikeDelta((d) => d + (isLiked ? -1 : 1));
    onToggleLike(record.id);
  };

  const handleDelete = async () => {
    if (!record || !user || !isOwner) return;
    if (!window.confirm(`Permanently delete "${record.title}"?`)) return;
    setIsDeleting(true);
    try {
      await deletePublishedPattern(record.id, user.id);
      onDeleted?.();
      onClose();
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to delete pattern');
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!record || !user) {
      onOpenCloudAuth();
      return;
    }
    const clean = commentDraft.trim();
    if (clean.length < 2) return;

    setIsPostingComment(true);
    setCommentError(null);
    try {
      const created = await postPatternComment({
        patternId: record.id,
        userId: user.id,
        authorName: displayName || user.email?.split('@')[0] || 'Studio Crafter',
        body: clean,
      });
      setComments((prev) => [created, ...prev]);
      setCommentDraft('');
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Could not post tip');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      await deletePatternComment(commentId, user.id);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : 'Could not delete tip');
    }
  };

  const commentsLoading = !!record && commentsTableReady && commentsLoadedFor !== record.id;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-5 select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="shrink-0 p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                /p/{shortId}
              </span>
              {record && (
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {record.craft_type}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-white truncate mt-1">
              {record ? record.title : 'Shared Community Pattern'}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            aria-label="Close shared pattern view"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto text-xs">
          {!isSupabaseConfigured ? (
            <div className="p-5 text-center space-y-3">
              <CloudOff className="w-8 h-8 text-amber-400 mx-auto" />
              <h3 className="text-sm font-bold text-white">Supabase Connection Required</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Connect your Supabase URL and publishable key in <code className="text-white font-mono">.env.local</code> / Vercel to resolve <code className="text-cyan-300 font-mono">/p/{shortId}</code> links.
              </p>
              <button
                type="button"
                onClick={onOpenCloudAuth}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
              >
                View Setup Instructions
              </button>
            </div>
          ) : isLoading ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Loading shared pattern /p/{shortId}...
            </div>
          ) : fetchError || !record ? (
            <div className="py-14 text-center space-y-3">
              <p className="text-sm font-bold text-rose-300">{fetchError || 'Pattern not found.'}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold"
              >
                Return to Studio
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
              {/* Preview Canvas */}
              <div className="md:col-span-6 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3">
                <canvas
                  ref={previewCanvasRef}
                  className="max-w-full max-h-[340px] rounded-xl shadow-xl border border-slate-800 object-contain"
                />
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-slate-500" />
                    {record.width}×{record.height}
                  </span>
                  <span className="flex items-center gap-1">
                    <Palette className="w-3 h-3 text-slate-500" />
                    {record.color_count} colors
                  </span>
                  {record.craft_type === 'loom' && record.bead_stitch_style !== 'loom' && (
                    <span className="text-teal-300 uppercase">{record.bead_stitch_style}</span>
                  )}
                </div>
              </div>

              {/* Metadata & Actions */}
              <div className="md:col-span-6 space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 text-slate-300 flex-wrap">
                    <UserIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                    {onSelectCreator ? (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onSelectCreator(record.author_name);
                        }}
                        className="font-semibold hover:text-indigo-300 underline decoration-indigo-500/40 underline-offset-2 transition"
                        title={`View all public patterns by ${record.author_name}`}
                      >
                        {record.author_name}
                      </button>
                    ) : (
                      <span className="font-semibold">{record.author_name}</span>
                    )}
                    <span className="text-slate-500">•</span>
                    <span className="text-slate-400">{record.category}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLikeClick}
                    className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition ${
                      isLiked
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                        : 'bg-slate-950 border-slate-700 text-slate-300 hover:border-rose-500/40'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{Math.max(0, record.likes_count + likeDelta)}</span>
                  </button>
                </div>

                {/* Remix Lineage Attribution & Remix Count */}
                {(record.remixed_from_short_id || (record.remixes_count || 0) > 0) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {record.remixed_from_short_id && (
                      <Link
                        to={`/p/${record.remixed_from_short_id}`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-[11px] font-semibold text-teal-300 transition"
                      >
                        <GitFork className="w-3 h-3" />
                        <span>
                          Remixed from /p/{record.remixed_from_short_id}
                          {record.remixed_from_title ? ` (${record.remixed_from_title})` : ''}
                        </span>
                      </Link>
                    )}
                    {(record.remixes_count || 0) > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-300">
                        <GitFork className="w-3 h-3 text-indigo-400" />
                        {record.remixes_count} {record.remixes_count === 1 ? 'Remix' : 'Remixes'}
                      </span>
                    )}
                  </div>
                )}

                {record.description && (
                  <p className="text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    {record.description}
                  </p>
                )}

                {record.tags && record.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {record.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-semibold"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Palette Swatches */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Palette ({record.palette.length} shades)
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {record.palette.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px]"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-white/25"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span className="text-slate-200 font-mono">
                          {c.code || c.name || c.hex}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenInStudio(record, decodedGrid);
                      onClose();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold shadow-lg flex items-center justify-center gap-2 transition"
                  >
                    <span>Open &amp; Remix in Studio</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSaveVaultClick}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      {savedToVault ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />}
                      <span>{savedToVault ? 'Saved to Vault' : 'Save Copy'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyShortLink}
                      className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>

                  {isOwner && (
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={handleDelete}
                      className="w-full py-1.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-950/70 border border-rose-500/30 text-rose-300 font-semibold flex items-center justify-center gap-1.5 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDeleting ? 'Deleting...' : 'Delete My Published Pattern'}</span>
                    </button>
                  )}
                </div>

                {/* Community Build Tips & Comments */}
                {commentsTableReady && (
                  <div className="pt-3 border-t border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Build Tips &amp; Notes ({comments.length})</span>
                      </span>
                    </div>

                    {user ? (
                      <form onSubmit={handlePostComment} className="flex gap-1.5">
                        <input
                          type="text"
                          value={commentDraft}
                          onChange={(e) => setCommentDraft(e.target.value)}
                          placeholder="Share a fabric count, bead finish, or yarn substitution tip..."
                          maxLength={400}
                          className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="submit"
                          disabled={isPostingComment || commentDraft.trim().length < 2}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <Send className="w-3 h-3" />
                          <span>Post</span>
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={onOpenCloudAuth}
                        className="w-full py-1.5 px-3 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-400 hover:text-indigo-300 transition text-center"
                      >
                        Sign in to leave a stitching or colorway tip
                      </button>
                    )}

                    {commentError && (
                      <p className="text-[10px] text-rose-300">{commentError}</p>
                    )}

                    <div className="space-y-1.5 max-h-36 overflow-y-auto [scrollbar-width:thin]">
                      {commentsLoading ? (
                        <p className="text-[10px] text-slate-500">Loading build tips...</p>
                      ) : comments.length === 0 ? (
                        <p className="text-[10px] text-slate-500 italic">
                          No build tips yet — be the first to share thread or fabric notes!
                        </p>
                      ) : (
                        comments.map((cm) => (
                          <div
                            key={cm.id}
                            className="p-2 rounded-lg bg-slate-950/75 border border-slate-800/80 flex items-start justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="font-bold text-indigo-300">{cm.author_name}</span>
                                <span className="text-slate-500">•</span>
                                <span className="text-slate-500">
                                  {new Date(cm.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-200 mt-0.5 break-words">
                                {cm.body}
                              </p>
                            </div>
                            {user && user.id === cm.author_id && (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(cm.id)}
                                className="p-1 rounded text-slate-500 hover:text-rose-400 transition shrink-0"
                                title="Delete my tip"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
