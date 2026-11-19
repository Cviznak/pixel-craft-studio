import type {
  BackstitchLine,
  BeadStitchStyle,
  CellProgress,
  CraftType,
  GridConfig,
  PaletteColor,
  SavedProject,
} from '../types/craft';
import { getFavoritePatternIds } from './communityPatterns';
import { getMyStash, saveMyStash } from './stashManager';
import { compressGridRLE, decompressGridRLE } from './shareUtils';
import {
  generateProjectThumbnail,
  getAllVaultProjects,
  saveProjectToVault,
} from './storage';
import { isSupabaseConfigured, supabase } from './supabaseClient';
import { saveWipStats, type WipSessionLog, type WipStats } from './wipTracker';

const FAVORITES_STORAGE_KEY = 'pixelcraft_favorite_patterns';
const DISPLAY_NAME_STORAGE_KEY = 'pcs_cloud_display_name';

export interface PublishedPatternRecord {
  id: string;
  short_id: string;
  author_id: string | null;
  author_name: string;
  title: string;
  description: string;
  craft_type: CraftType;
  category: string;
  tags: string[];
  width: number;
  height: number;
  color_count: number;
  grid_rle: string;
  palette: PaletteColor[];
  backstitches: BackstitchLine[];
  bead_stitch_style: BeadStitchStyle;
  thumbnail_data_url: string;
  is_public: boolean;
  likes_count: number;
  remixed_from_short_id?: string | null;
  remixed_from_title?: string;
  remixes_count?: number;
  created_at: string;
  updated_at: string;
}

export interface PatternComment {
  id: string;
  pattern_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
}

export interface CloudSyncSummary {
  pulledProjects: number;
  pushedProjects: number;
  mergedStashItems: number;
  mergedWipSessions: number;
  syncedAtIso: string;
}

export interface CloudPreferencesSyncResult {
  displayName: string;
  dmcStash: string[];
  perlerStash: string[];
  favoritePatternIds: string[];
  wipStats: WipStats;
  mergedStashItems: number;
  mergedWipSessions: number;
}

/**
 * Generates a URL-safe lowercase alphanumeric short ID for `/p/:shortId` share URLs.
 */
export function generateShortId(length = 10): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';
  let result = '';
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (cryptoObj && typeof cryptoObj.getRandomValues === 'function') {
    const bytes = new Uint8Array(length);
    cryptoObj.getRandomValues(bytes);
    for (let i = 0; i < length; i++) {
      result += alphabet[bytes[i] % alphabet.length];
    }
    return result;
  }

  for (let i = 0; i < length; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

/**
 * Computes a deterministic sorted union of two string collections.
 */
export function mergeStringSets(
  local: Iterable<string>,
  remote: Iterable<string>
): string[] {
  const set = new Set<string>();
  for (const item of local) {
    if (typeof item === 'string' && item.trim()) set.add(item);
  }
  for (const item of remote) {
    if (typeof item === 'string' && item.trim()) set.add(item);
  }
  return Array.from(set).sort();
}

/**
 * Merges two WIP session journals without losing logged sessions or total tracked seconds.
 */
export function mergeWipStats(
  local: WipStats,
  remote?: Partial<WipStats> | null
): WipStats {
  const byId = new Map<string, WipSessionLog>();

  const ingest = (list?: WipSessionLog[]) => {
    if (!Array.isArray(list)) return;
    for (const s of list) {
      if (!s || typeof s.id !== 'string') continue;
      byId.set(s.id, {
        id: s.id,
        dateIso: typeof s.dateIso === 'string' ? s.dateIso : new Date().toISOString(),
        durationSeconds: Math.max(0, Number(s.durationSeconds) || 0),
        stitchesCompleted: Math.max(0, Number(s.stitchesCompleted) || 0),
        note: typeof s.note === 'string' ? s.note : undefined,
      });
    }
  };

  ingest(remote?.sessions);
  ingest(local.sessions);

  const mergedSessions = Array.from(byId.values())
    .sort((a, b) => b.dateIso.localeCompare(a.dateIso))
    .slice(0, 60);

  const sessionsSecondsSum = mergedSessions.reduce(
    (sum, s) => sum + (s.durationSeconds || 0),
    0
  );

  const remoteTotal = Number(remote?.totalSeconds) || 0;
  const localTotal = Number(local.totalSeconds) || 0;
  const totalSeconds = Math.max(localTotal, remoteTotal, sessionsSecondsSum);

  const candidates = [local.startedAtIso, remote?.startedAtIso].filter(
    (v): v is string => typeof v === 'string' && v.length > 0
  );
  candidates.sort();

  return {
    totalSeconds,
    sessions: mergedSessions,
    milestoneNote: local.milestoneNote || remote?.milestoneNote || '',
    startedAtIso: candidates[0] || new Date().toISOString(),
  };
}

function getClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error('Supabase cloud connection is not configured yet.');
  }
  return supabase;
}

export async function publishPatternToCloud(params: {
  title: string;
  description?: string;
  authorName?: string;
  category?: string;
  tags?: string[];
  isPublic?: boolean;
  config: GridConfig;
  gridData: number[][];
  palette: PaletteColor[];
  backstitches?: BackstitchLine[];
  userId?: string | null;
  remixedFromShortId?: string | null;
  remixedFromTitle?: string;
}): Promise<{ shortId: string; shareUrl: string; record: PublishedPatternRecord }> {
  const client = getClient();
  const height = params.gridData.length;
  const width = height > 0 ? params.gridData[0].length : params.config.width;

  const gridRle = compressGridRLE(params.gridData);
  const rawThumb = generateProjectThumbnail(
    params.gridData,
    params.palette,
    params.backstitches
  );
  const thumbnailDataUrl = rawThumb.length <= 145000 ? rawThumb : '';

  const cleanTags = (params.tags || [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);

  const basePayload: Record<string, unknown> = {
    author_id: params.userId || null,
    author_name: (params.authorName || 'Anonymous Crafter').trim().slice(0, 40) || 'Anonymous Crafter',
    title: params.title.trim().slice(0, 80) || 'Untitled Pattern',
    description: (params.description || '').trim().slice(0, 300),
    craft_type: params.config.craftType,
    category: (params.category || 'Community').trim().slice(0, 40) || 'Community',
    tags: cleanTags,
    width,
    height,
    color_count: Math.max(1, Math.min(64, params.palette.length)),
    grid_rle: gridRle,
    palette: params.palette,
    backstitches: params.backstitches || [],
    bead_stitch_style: params.config.beadLoom?.stitchStyle || 'loom',
    thumbnail_data_url: thumbnailDataUrl,
    is_public: params.isPublic !== false,
  };

  if (params.remixedFromShortId) {
    basePayload.remixed_from_short_id = params.remixedFromShortId.trim().toLowerCase();
    basePayload.remixed_from_title = (params.remixedFromTitle || '').trim().slice(0, 80);
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const shortId = generateShortId(10);
    let { data, error } = await client
      .from('published_patterns')
      .insert({ ...basePayload, short_id: shortId })
      .select()
      .single();

    // Graceful fallback if Wave 5 migration columns are not applied yet
    if (error && (error.code === '42703' || error.code === 'PGRST204') && basePayload.remixed_from_short_id) {
      const legacyPayload = { ...basePayload };
      delete legacyPayload.remixed_from_short_id;
      delete legacyPayload.remixed_from_title;
      const retry = await client
        .from('published_patterns')
        .insert({ ...legacyPayload, short_id: shortId })
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (!error && data) {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.pixel-craft-studio.com';
      return {
        shortId: data.short_id as string,
        shareUrl: `${origin}/p/${data.short_id}`,
        record: data as PublishedPatternRecord,
      };
    }

    lastError = error;
    if (error?.code !== '23505') {
      throw new Error(error?.message || 'Failed to publish pattern');
    }
  }

  throw new Error(
    lastError instanceof Error ? lastError.message : 'Could not allocate unique short link ID'
  );
}

export async function fetchPublishedPatternByShortId(
  shortId: string
): Promise<{ record: PublishedPatternRecord; gridData: number[][] } | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const cleanId = shortId.trim().toLowerCase();
  if (!cleanId) return null;

  const { data, error } = await supabase
    .from('published_patterns')
    .select('*')
    .eq('short_id', cleanId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data) return null;

  const record = data as PublishedPatternRecord;
  const gridData = decompressGridRLE(record.grid_rle, record.width, record.height);
  return { record, gridData };
}

export async function fetchCommunityFeed(options: {
  craftType?: CraftType | 'all';
  category?: string;
  authorName?: string | null;
  search?: string;
  sort?: 'recent' | 'popular';
  limit?: number;
} = {}): Promise<PublishedPatternRecord[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  let query = supabase
    .from('published_patterns')
    .select('*')
    .eq('is_public', true);

  if (options.craftType && options.craftType !== 'all') {
    query = query.eq('craft_type', options.craftType);
  }
  if (options.category && options.category !== 'All') {
    query = query.eq('category', options.category);
  }
  if (options.authorName && options.authorName.trim()) {
    query = query.eq('author_name', options.authorName.trim());
  }

  const safeSearch = (options.search || '').trim().replace(/[%(),]/g, ' ').trim();
  if (safeSearch) {
    query = query.or(
      `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%,author_name.ilike.%${safeSearch}%`
    );
  }

  if (options.sort === 'popular') {
    query = query
      .order('likes_count', { ascending: false })
      .order('created_at', { ascending: false });
  } else {
    query = query.order('created_at', { ascending: false });
  }

  query = query.limit(options.limit ?? 48);

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  return (data || []) as PublishedPatternRecord[];
}

export async function fetchPatternComments(
  patternId: string
): Promise<{ comments: PatternComment[]; tableReady: boolean }> {
  if (!isSupabaseConfigured || !supabase || !patternId) {
    return { comments: [], tableReady: false };
  }
  const { data, error } = await supabase
    .from('pattern_comments')
    .select('*')
    .eq('pattern_id', patternId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    if (error.code === '42P01' || error.code === 'PGRST205') {
      return { comments: [], tableReady: false };
    }
    throw new Error(error.message);
  }

  return {
    comments: (data || []) as PatternComment[],
    tableReady: true,
  };
}

export async function postPatternComment(params: {
  patternId: string;
  userId: string;
  authorName: string;
  body: string;
}): Promise<PatternComment> {
  const client = getClient();
  const cleanBody = params.body.trim().slice(0, 400);
  if (cleanBody.length < 2) {
    throw new Error('Tip must be at least 2 characters.');
  }

  const { data, error } = await client
    .from('pattern_comments')
    .insert({
      pattern_id: params.patternId,
      author_id: params.userId,
      author_name: (params.authorName || 'Studio Crafter').trim().slice(0, 40) || 'Studio Crafter',
      body: cleanBody,
    })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as PatternComment;
}

export async function deletePatternComment(
  commentId: string,
  userId: string
): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from('pattern_comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchUserLikedPatternIds(userId: string): Promise<Set<string>> {
  if (!isSupabaseConfigured || !supabase || !userId) return new Set();
  const { data, error } = await supabase
    .from('pattern_likes')
    .select('pattern_id')
    .eq('user_id', userId);

  if (error) {
    console.warn('Could not load liked patterns:', error.message);
    return new Set();
  }
  return new Set((data || []).map((row) => row.pattern_id as string));
}

export async function toggleCommunityPatternLike(
  patternId: string,
  userId: string,
  currentlyLiked: boolean
): Promise<boolean> {
  const client = getClient();
  if (currentlyLiked) {
    const { error } = await client
      .from('pattern_likes')
      .delete()
      .eq('pattern_id', patternId)
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
    return false;
  }

  const { error } = await client
    .from('pattern_likes')
    .insert({ pattern_id: patternId, user_id: userId });
  if (error && error.code !== '23505') {
    throw new Error(error.message);
  }
  return true;
}

export async function deletePublishedPattern(
  patternId: string,
  userId: string
): Promise<void> {
  const client = getClient();
  const { error } = await client
    .from('published_patterns')
    .delete()
    .eq('id', patternId)
    .eq('author_id', userId);

  if (error) {
    throw new Error(error.message);
  }
}

interface CloudProjectRow {
  id: string;
  user_id: string;
  name: string;
  craft_type: CraftType;
  width: number;
  height: number;
  color_count: number;
  grid_config: GridConfig;
  grid_rle: string;
  palette: PaletteColor[];
  completed_cells: CellProgress;
  backstitches: BackstitchLine[];
  thumbnail_data_url: string;
  client_updated_at: number;
  created_at: string;
}

export async function pushSingleProjectToCloud(
  userId: string,
  project: SavedProject
): Promise<void> {
  const client = getClient();
  const rawThumb =
    project.thumbnailDataUrl ||
    generateProjectThumbnail(project.gridData, project.palette, project.backstitches);

  const payload = {
    id: project.id.slice(0, 100),
    user_id: userId,
    name: (project.name || 'Untitled Pattern').slice(0, 120),
    craft_type: project.craftType,
    width: project.width || project.gridConfig.width,
    height: project.height || project.gridConfig.height,
    color_count: project.colorCount || project.palette.length,
    grid_config: project.gridConfig,
    grid_rle: compressGridRLE(project.gridData),
    palette: project.palette,
    completed_cells: project.completedCells || {},
    backstitches: project.backstitches || [],
    thumbnail_data_url: rawThumb.length <= 145000 ? rawThumb : '',
    client_updated_at: project.updatedAt || Date.now(),
  };

  const { error } = await client
    .from('cloud_projects')
    .upsert(payload, { onConflict: 'user_id,id' });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteCloudProject(
  userId: string,
  projectId: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;
  const { error } = await supabase
    .from('cloud_projects')
    .delete()
    .eq('user_id', userId)
    .eq('id', projectId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function syncProjectsWithCloud(
  userId: string
): Promise<{ pulledProjects: number; pushedProjects: number }> {
  const client = getClient();
  const localProjects = await getAllVaultProjects();

  const { data, error } = await client
    .from('cloud_projects')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    throw new Error(error.message);
  }

  const remoteRows = (data || []) as CloudProjectRow[];
  const localMap = new Map(localProjects.map((p) => [p.id, p]));
  const remoteMap = new Map(remoteRows.map((r) => [r.id, r]));

  let pulledProjects = 0;
  let pushedProjects = 0;

  for (const remote of remoteRows) {
    const local = localMap.get(remote.id);
    const localTs = local?.updatedAt || 0;
    const remoteTs = Number(remote.client_updated_at) || 0;

    if (!local || remoteTs > localTs) {
      const gridData = decompressGridRLE(remote.grid_rle, remote.width, remote.height);
      const createdAtMs = Date.parse(remote.created_at) || remoteTs || Date.now();
      await saveProjectToVault(
        {
          id: remote.id,
          name: remote.name,
          craftType: remote.craft_type,
          createdAt: createdAtMs,
          updatedAt: remoteTs || Date.now(),
          thumbnailDataUrl:
            remote.thumbnail_data_url ||
            generateProjectThumbnail(gridData, remote.palette, remote.backstitches),
          width: remote.width,
          height: remote.height,
          colorCount: remote.color_count || remote.palette.length,
          gridConfig: remote.grid_config,
          gridData,
          palette: remote.palette,
          completedCells: remote.completed_cells || {},
          backstitches: remote.backstitches || [],
          sourceImageDataUrl: local?.sourceImageDataUrl || null,
        },
        true
      );
      pulledProjects++;
    }
  }

  for (const local of localProjects) {
    const remote = remoteMap.get(local.id);
    const localTs = local.updatedAt || 0;
    const remoteTs = remote ? Number(remote.client_updated_at) || 0 : 0;

    if (!remote || localTs > remoteTs) {
      await pushSingleProjectToCloud(userId, local);
      pushedProjects++;
    }
  }

  return { pulledProjects, pushedProjects };
}

export async function syncStashAndWipWithCloud(
  userId: string,
  localWipStats: WipStats
): Promise<CloudPreferencesSyncResult> {
  const client = getClient();

  const localDmc = getMyStash('DMC');
  const localPerler = getMyStash('Perler');
  const localFavs = getFavoritePatternIds();

  const { data, error } = await client
    .from('user_cloud_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const remoteDmc: string[] = Array.isArray(data?.dmc_stash) ? data.dmc_stash : [];
  const remotePerler: string[] = Array.isArray(data?.perler_stash) ? data.perler_stash : [];
  const remoteFavs: string[] = Array.isArray(data?.favorite_pattern_ids) ? data.favorite_pattern_ids : [];
  const remoteWip = (data?.wip_stats || null) as Partial<WipStats> | null;
  const cachedName = typeof window !== 'undefined' ? (localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) || '') : '';
  const displayName = (typeof data?.display_name === 'string' && data.display_name.trim())
    ? data.display_name.trim()
    : cachedName;

  const dmcStash = mergeStringSets(localDmc, remoteDmc);
  const perlerStash = mergeStringSets(localPerler, remotePerler);
  const favoritePatternIds = mergeStringSets(localFavs, remoteFavs);
  const wipStats = mergeWipStats(localWipStats, remoteWip);

  saveMyStash('DMC', new Set(dmcStash));
  saveMyStash('Perler', new Set(perlerStash));
  saveWipStats(wipStats);

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoritePatternIds));
      if (displayName) {
        localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, displayName);
      }
    } catch {
      // ignore storage errors
    }
  }

  const { error: upsertErr } = await client
    .from('user_cloud_preferences')
    .upsert(
      {
        user_id: userId,
        display_name: displayName.slice(0, 40),
        dmc_stash: dmcStash,
        perler_stash: perlerStash,
        favorite_pattern_ids: favoritePatternIds,
        wip_stats: wipStats,
      },
      { onConflict: 'user_id' }
    );

  if (upsertErr) {
    throw new Error(upsertErr.message);
  }

  return {
    displayName,
    dmcStash,
    perlerStash,
    favoritePatternIds,
    wipStats,
    mergedStashItems: dmcStash.length + perlerStash.length,
    mergedWipSessions: wipStats.sessions.length,
  };
}

export async function pushPreferencesToCloud(
  userId: string,
  partial: {
    displayName?: string;
    dmcStash?: string[];
    perlerStash?: string[];
    favoritePatternIds?: string[];
    wipStats?: WipStats;
  }
): Promise<void> {
  if (!isSupabaseConfigured || !supabase || !userId) return;

  const cachedName =
    typeof window !== 'undefined' ? localStorage.getItem(DISPLAY_NAME_STORAGE_KEY) || '' : '';
  const displayName =
    partial.displayName !== undefined ? partial.displayName.trim().slice(0, 40) : cachedName.slice(0, 40);

  if (typeof window !== 'undefined' && partial.displayName !== undefined) {
    try {
      localStorage.setItem(DISPLAY_NAME_STORAGE_KEY, displayName);
    } catch {
      // ignore
    }
  }

  const payload: Record<string, unknown> = {
    user_id: userId,
    display_name: displayName,
    dmc_stash: partial.dmcStash ?? Array.from(getMyStash('DMC')).sort(),
    perler_stash: partial.perlerStash ?? Array.from(getMyStash('Perler')).sort(),
    favorite_pattern_ids: partial.favoritePatternIds ?? Array.from(getFavoritePatternIds()).sort(),
  };

  if (partial.wipStats !== undefined) {
    payload.wip_stats = partial.wipStats;
  }

  const { error } = await supabase
    .from('user_cloud_preferences')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.warn('Could not push cloud preferences:', error.message);
  }
}
