import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  Copy,
  ExternalLink,
  GitFork,
  Heart,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import type { CraftType } from '../types/craft';
import {
  fetchCommunityFeed,
  fetchUserLikedPatternIds,
  toggleCommunityPatternLike,
  type PublishedPatternRecord,
} from '../utils/cloudSync';
import { buildCreatorProfileMeta, CRAFT_ROUTES, updateDocumentMeta } from '../utils/craftRoutes';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';

export const CreatorProfilePage: React.FC = () => {
  const { handle } = useParams<{ handle: string }>();

  const creatorName = useMemo(() => {
    const raw = handle || 'Creator';
    try {
      return decodeURIComponent(raw).trim() || 'Creator';
    } catch {
      return raw.trim() || 'Creator';
    }
  }, [handle]);

  const initials = useMemo(() => {
    const parts = creatorName.split(/[\s_-]+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return creatorName.slice(0, 2).toUpperCase() || 'PC';
  }, [creatorName]);

  const [patterns, setPatterns] = useState<PublishedPatternRecord[]>([]);
  const [loadedCreator, setLoadedCreator] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [craftFilter, setCraftFilter] = useState<'all' | CraftType>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'remixes'>('recent');
  const [copiedUrl, setCopiedUrl] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeOffsets, setLikeOffsets] = useState<Record<string, number>>({});

  const loading = isSupabaseConfigured && loadedCreator !== creatorName;

  useEffect(() => {
    const meta = buildCreatorProfileMeta(creatorName);
    updateDocumentMeta(meta, {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: meta.metaTitle,
      description: meta.metaDescription,
      url: meta.canonicalUrl,
      mainEntity: {
        '@type': 'Person',
        name: creatorName,
      },
    });
  }, [creatorName]);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const uid = data.user?.id || null;
      setUserId(uid);
      if (uid) {
        fetchUserLikedPatternIds(uid)
          .then((ids) => {
            if (active) setLikedIds(ids);
          })
          .catch(() => {});
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;

    fetchCommunityFeed({
      authorName: creatorName,
      sort: 'recent',
      limit: 60,
    })
      .then((rows) => {
        if (!active) return;
        setErrorMsg(null);
        setPatterns(rows);
        setLoadedCreator(creatorName);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Could not load creator portfolio');
        setLoadedCreator(creatorName);
      });

    return () => {
      active = false;
    };
  }, [creatorName]);

  const stats = useMemo(() => {
    const totalLikes = patterns.reduce(
      (sum, p) => sum + Math.max(0, p.likes_count + (likeOffsets[p.id] || 0)),
      0
    );
    const totalRemixes = patterns.reduce((sum, p) => sum + (p.remixes_count || 0), 0);
    const crafts = Array.from(new Set(patterns.map((p) => p.craft_type)));
    return { totalLikes, totalRemixes, crafts };
  }, [patterns, likeOffsets]);

  const visiblePatterns = useMemo(() => {
    const list =
      craftFilter === 'all'
        ? [...patterns]
        : patterns.filter((p) => p.craft_type === craftFilter);

    if (sortBy === 'popular') {
      list.sort(
        (a, b) =>
          b.likes_count + (likeOffsets[b.id] || 0) - (a.likes_count + (likeOffsets[a.id] || 0))
      );
    } else if (sortBy === 'remixes') {
      list.sort((a, b) => (b.remixes_count || 0) - (a.remixes_count || 0));
    }
    return list;
  }, [patterns, craftFilter, sortBy, likeOffsets]);

  const handleCopyPortfolioUrl = async () => {
    const shareUrl = `https://www.pixel-craft-studio.com/u/${encodeURIComponent(creatorName)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleLikeClick = async (pattern: PublishedPatternRecord) => {
    if (!userId) return;
    const currentlyLiked = likedIds.has(pattern.id);
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (currentlyLiked) next.delete(pattern.id);
      else next.add(pattern.id);
      return next;
    });
    setLikeOffsets((prev) => ({
      ...prev,
      [pattern.id]: (prev[pattern.id] || 0) + (currentlyLiked ? -1 : 1),
    }));

    try {
      await toggleCommunityPatternLike(pattern.id, userId, currentlyLiked);
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.add(pattern.id);
        else next.delete(pattern.id);
        return next;
      });
      setLikeOffsets((prev) => ({
        ...prev,
        [pattern.id]: (prev[pattern.id] || 0) + (currentlyLiked ? 1 : -1),
      }));
    }
  };

  return (
    <PageShell>
      {/* Back breadcrumb */}
      <div className="mb-5">
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Community Showcase</span>
        </Link>
      </div>

      {/* Creator Portfolio Banner */}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-950/70 via-slate-900 to-pink-950/40 border border-indigo-500/30 p-5 sm:p-7 mb-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-500 p-[2px] shrink-0 shadow-lg shadow-indigo-600/25">
              <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center text-xl font-extrabold text-white">
                {initials}
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                  @{creatorName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold">
                  Creator Portfolio
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Public craft patterns, color legends, and open remixes shared on Pixel Craft Studio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyPortfolioUrl}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-700 text-xs font-bold text-slate-200 transition shrink-0"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Portfolio URL Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-indigo-400" />
                <span>Share Portfolio</span>
              </>
            )}
          </button>
        </div>

        {/* Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-xl bg-slate-950/75 border border-slate-800/90 p-3">
            <div className="text-slate-400 text-[11px]">Published Patterns</div>
            <div className="text-lg font-extrabold text-white mt-0.5">{patterns.length}</div>
          </div>
          <div className="rounded-xl bg-slate-950/75 border border-slate-800/90 p-3">
            <div className="text-slate-400 text-[11px]">Total Likes</div>
            <div className="text-lg font-extrabold text-rose-300 mt-0.5">{stats.totalLikes}</div>
          </div>
          <div className="rounded-xl bg-slate-950/75 border border-slate-800/90 p-3">
            <div className="text-slate-400 text-[11px]">Community Remixes</div>
            <div className="text-lg font-extrabold text-emerald-300 mt-0.5">
              {stats.totalRemixes}
            </div>
          </div>
          <div className="rounded-xl bg-slate-950/75 border border-slate-800/90 p-3">
            <div className="text-slate-400 text-[11px]">Craft Specialties</div>
            <div className="text-lg font-extrabold text-indigo-300 mt-0.5">
              {stats.crafts.length || 0}
            </div>
          </div>
        </div>
      </section>

      {/* Filters when patterns exist */}
      {patterns.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCraftFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                craftFilter === 'all'
                  ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-200'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({patterns.length})
            </button>
            {stats.crafts.map((ct) => {
              const info = CRAFT_ROUTES[ct];
              return (
                <button
                  key={ct}
                  type="button"
                  onClick={() => setCraftFilter(ct)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold border transition ${
                    craftFilter === ct
                      ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-200'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {info ? `${info.icon} ${info.title}` : ct}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setSortBy('recent')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                sortBy === 'recent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSortBy('popular')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold ${
                sortBy === 'popular' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Most Liked</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('remixes')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold ${
                sortBy === 'remixes' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3 h-3" />
              <span>Remixed</span>
            </button>
          </div>
        </div>
      )}

      {/* Pattern Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
            />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="rounded-2xl bg-rose-950/50 border border-rose-500/40 p-6 text-xs text-rose-200">
          {errorMsg}
        </div>
      ) : visiblePatterns.length === 0 ? (
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-indigo-400 mx-auto opacity-80" />
          <h2 className="text-base font-bold text-white">
            No public patterns published under @{creatorName} yet
          </h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Creators appear here as soon as they publish a pattern publicly from the Studio.
          </p>
          <div className="pt-2 flex flex-wrap justify-center gap-2">
            <Link
              to="/community"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
            >
              Browse All Community Patterns
            </Link>
            <Link
              to="/cross-stitch"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
            >
              Open Studio
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visiblePatterns.map((pattern) => {
            const craftInfo = CRAFT_ROUTES[pattern.craft_type];
            const liked = likedIds.has(pattern.id);
            const likeCount = Math.max(0, pattern.likes_count + (likeOffsets[pattern.id] || 0));

            return (
              <article
                key={pattern.id}
                className="rounded-2xl bg-slate-900/85 border border-slate-800 hover:border-indigo-500/50 overflow-hidden flex flex-col transition group"
              >
                <Link
                  to={`/p/${pattern.short_id}`}
                  className="relative aspect-square bg-slate-950 overflow-hidden flex items-center justify-center p-3"
                >
                  {pattern.thumbnail_data_url ? (
                    <img
                      src={pattern.thumbnail_data_url}
                      alt={pattern.title}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    />
                  ) : (
                    <div className="text-xs text-slate-500 font-mono">
                      {pattern.width}×{pattern.height}
                    </div>
                  )}
                  <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-slate-950/90 border border-slate-700/80 text-[10px] font-bold text-slate-200">
                    {craftInfo ? `${craftInfo.icon} ${craftInfo.title}` : pattern.craft_type}
                  </span>
                  <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/85 text-[10px] font-mono text-slate-300 border border-slate-800">
                    {pattern.width}×{pattern.height} • {pattern.color_count}c
                  </span>
                </Link>

                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      to={`/p/${pattern.short_id}`}
                      className="text-sm font-bold text-white hover:text-indigo-300 line-clamp-1 block"
                    >
                      {pattern.title}
                    </Link>
                    {pattern.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">{pattern.description}</p>
                    )}
                    {pattern.remixed_from_short_id && (
                      <Link
                        to={`/p/${pattern.remixed_from_short_id}`}
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-400 hover:underline"
                      >
                        <GitFork className="w-3 h-3" />
                        <span>
                          Remixed from {pattern.remixed_from_title || `/p/${pattern.remixed_from_short_id}`}
                        </span>
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-800/80">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleLikeClick(pattern)}
                        className={`inline-flex items-center gap-1 text-xs font-semibold transition ${
                          liked ? 'text-rose-400' : 'text-slate-400 hover:text-rose-300'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-rose-400' : ''}`} />
                        <span>{likeCount}</span>
                      </button>
                      {(pattern.remixes_count || 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold">
                          <GitFork className="w-3.5 h-3.5" />
                          <span>{pattern.remixes_count}</span>
                        </span>
                      )}
                    </div>

                    <Link
                      to={`/p/${pattern.short_id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300"
                    >
                      <span>Open Pattern</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};
