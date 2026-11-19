import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { isSupabaseConfigured } from '../utils/supabaseClient';
import {
  deletePublishedPattern,
  fetchPublishedPatternByShortId,
  type PublishedPatternRecord,
} from '../utils/cloudSync';

interface SharedPatternModalProps {
  shortId: string | null;
  onClose: () => void;
  user: User | null;
  likedPatternIds: Set<string>;
  onToggleLike: (patternId: string) => void;
  onOpenCloudAuth: () => void;
  onOpenInStudio: (record: PublishedPatternRecord, gridData: number[][]) => void;
  onSaveToVault: (record: PublishedPatternRecord, gridData: number[][]) => Promise<void>;
  onDeleted?: () => void;
}

export const SharedPatternModal: React.FC<SharedPatternModalProps> = ({
  shortId,
  onClose,
  user,
  likedPatternIds,
  onToggleLike,
  onOpenCloudAuth,
  onOpenInStudio,
  onSaveToVault,
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

  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  if (shortId !== prevShortId) {
    setPrevShortId(shortId);
    setRecord(null);
    setDecodedGrid([]);
    setFetchError(null);
    setLikeDelta(0);
    setCopiedLink(false);
    setSavedToVault(false);
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-slate-300">
                    <UserIcon className="w-4 h-4 text-indigo-400" />
                    <span className="font-semibold">{record.author_name}</span>
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
                    <span>Open & Edit in Studio</span>
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
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
