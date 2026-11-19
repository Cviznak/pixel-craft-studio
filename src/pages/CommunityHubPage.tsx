import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cloud,
  ExternalLink,
  GitFork,
  Globe,
  Heart,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { PageShell } from '../components/PageShell';
import type { CraftType } from '../types/craft';
import {
  fetchCommunityFeed,
  fetchUserLikedPatternIds,
  toggleCommunityPatternLike,
  type PublishedPatternRecord,
} from '../utils/cloudSync';
import {
  COMMUNITY_CATEGORIES,
  COMMUNITY_PATTERNS,
  CRAFT_FILTER_TABS,
} from '../utils/communityPatterns';
import { CRAFT_ROUTES, STANDALONE_PAGE_ROUTES, updateDocumentMeta } from '../utils/craftRoutes';
import { isSupabaseConfigured, supabase } from '../utils/supabaseClient';

export const CommunityHubPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [craftFilter, setCraftFilter] = useState<'all' | CraftType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'remixes'>('recent');

  const [patterns, setPatterns] = useState<PublishedPatternRecord[]>([]);
  const [loadedKey, setLoadedKey] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const [userId, setUserId] = useState<string | null>(null);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [likeOffsets, setLikeOffsets] = useState<Record<string, number>>({});
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  const requestKey = `${craftFilter}:${categoryFilter}:${search}:${sortBy}:${refreshTick}`;
  const loading = isSupabaseConfigured && loadedKey !== requestKey;

  useEffect(() => {
    const meta = STANDALONE_PAGE_ROUTES['/community'];
    updateDocumentMeta(meta, {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: meta.metaTitle,
      description: meta.metaDescription,
      url: meta.canonicalUrl,
    });
  }, []);

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
      craftType: craftFilter,
      category: categoryFilter,
      search,
      sort: sortBy,
      limit: 48,
    })
      .then((rows) => {
        if (!active) return;
        setErrorMsg(null);
        setPatterns(rows);
        setLoadedKey(requestKey);
      })
      .catch((err) => {
        if (!active) return;
        setErrorMsg(err instanceof Error ? err.message : 'Failed to load community patterns');
        setLoadedKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [craftFilter, categoryFilter, search, sortBy, refreshTick, requestKey]);

  const handleLikeClick = async (pattern: PublishedPatternRecord) => {
    if (!userId) {
      setNoticeMsg('Sign in via Cloud Sync inside the Studio to like community patterns.');
      setTimeout(() => setNoticeMsg(null), 3200);
      return;
    }

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
      // Revert optimistic toggle if request fails
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

  const filteredCurated = useMemo(() => {
    const q = search.trim().toLowerCase();
    return COMMUNITY_PATTERNS.filter((p) => {
      if (craftFilter !== 'all' && p.recommendedCraft !== craftFilter) return false;
      if (categoryFilter !== 'All' && p.category !== categoryFilter) return false;
      if (
        q &&
        !p.name.toLowerCase().includes(q) &&
        !p.description.toLowerCase().includes(q) &&
        !p.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        return false;
      }
      return true;
    }).slice(0, 8);
  }, [craftFilter, categoryFilter, search]);

  return (
    <PageShell>
      {/* Hero Header */}
      <div className="space-y-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs font-semibold">
          <Globe className="w-3.5 h-3.5" />
          <span>Public Craft Showcase &amp; Remix Directory</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Community <span className="text-pink-400">Pattern Showcase</span>
            </h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Browse free stitch charts shared by makers, read community build tips, explore creator portfolios, or open any design in Studio to remix it with attribution.
            </p>
          </div>

          <Link
            to="/cross-stitch"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 transition shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create &amp; Publish Yours</span>
          </Link>
        </div>
      </div>

      {noticeMsg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-indigo-950/90 border border-indigo-500/40 text-xs text-indigo-200 font-medium">
          {noticeMsg}
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-4 space-y-3 mb-8">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patterns, keywords, or @creators..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter by category"
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-semibold text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            {COMMUNITY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => setSortBy('recent')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                sortBy === 'recent' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Newest
            </button>
            <button
              type="button"
              onClick={() => setSortBy('popular')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                sortBy === 'popular' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-3 h-3" />
              <span>Most Liked</span>
            </button>
            <button
              type="button"
              onClick={() => setSortBy('remixes')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                sortBy === 'remixes' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3 h-3" />
              <span>Most Remixed</span>
            </button>
          </div>
        </div>

        {/* Craft Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CRAFT_FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setCraftFilter(tab.id)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap border transition ${
                craftFilter === tab.id
                  ? 'bg-indigo-600/25 border-indigo-500/50 text-indigo-200'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Community Feed */}
      <section className="space-y-4 mb-12">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Community Publications</span>
            {patterns.length > 0 && (
              <span className="text-xs font-normal text-slate-400">({patterns.length})</span>
            )}
          </h2>
          {isSupabaseConfigured && (
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Refresh</span>
            </button>
          )}
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-8 text-center space-y-2">
            <Cloud className="w-8 h-8 text-cyan-400 mx-auto opacity-80" />
            <p className="text-sm font-bold text-white">Live Community Feed Offline</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Supabase environment keys are not configured in this environment. Browse curated Studio patterns below or publish once connected.
            </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-72 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : errorMsg ? (
          <div className="rounded-2xl bg-rose-950/50 border border-rose-500/40 p-6 text-center space-y-2 text-xs text-rose-200">
            <p>{errorMsg}</p>
            <button
              type="button"
              onClick={() => setRefreshTick((t) => t + 1)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-white font-semibold"
            >
              Retry
            </button>
          </div>
        ) : patterns.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-10 text-center space-y-2">
            <Globe className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-white">No matching community patterns yet</p>
            <p className="text-xs text-slate-400">
              Try clearing your filter or be the first to publish one from the Studio!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {patterns.map((pattern) => {
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

                  <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                    <div className="space-y-1">
                      <Link
                        to={`/p/${pattern.short_id}`}
                        className="text-sm font-bold text-white hover:text-indigo-300 line-clamp-1 block"
                      >
                        {pattern.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <Link
                          to={`/u/${encodeURIComponent(pattern.author_name || 'Studio Crafter')}`}
                          className="inline-flex items-center gap-1 hover:text-indigo-300 font-medium transition"
                        >
                          <UserIcon className="w-3 h-3" />
                          <span>@{pattern.author_name || 'Studio Crafter'}</span>
                        </Link>
                        {pattern.remixed_from_short_id && (
                          <Link
                            to={`/p/${pattern.remixed_from_short_id}`}
                            className="inline-flex items-center gap-1 text-emerald-400 hover:underline"
                          >
                            <GitFork className="w-3 h-3" />
                            <span>Remix</span>
                          </Link>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <div className="flex items-center gap-2.5">
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
                        <span>View / Remix</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Curated Studio Starters */}
      {filteredCurated.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">Curated Studio Starter Charts</h2>
              <p className="text-xs text-slate-400">
                Built-in verified starter patterns ready to open in one click.
              </p>
            </div>
            <Link to="/gallery" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
              Browse All {COMMUNITY_PATTERNS.length} Starters →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCurated.map((item) => {
              const craftInfo = CRAFT_ROUTES[item.recommendedCraft];
              return (
                <Link
                  key={item.id}
                  to={`/patterns/${item.slug}`}
                  className="rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-indigo-500/40 p-3 flex flex-col gap-2.5 transition group"
                >
                  <div className="aspect-square rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={item.url}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-contain group-hover:scale-105 transition duration-300"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white line-clamp-1">{item.name}</div>
                    <div className="text-[11px] text-slate-400">
                      {craftInfo?.icon} {craftInfo?.title} • {item.recommendedGridSize.width}×
                      {item.recommendedGridSize.height}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </PageShell>
  );
};
