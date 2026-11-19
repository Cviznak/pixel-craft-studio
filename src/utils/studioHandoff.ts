import type { CraftProject } from '../types/craft';

const PENDING_STUDIO_PROJECT_KEY = 'pixel_craft_pending_studio_project';

/**
 * Stores a full CraftProject in sessionStorage so standalone tool pages
 * (e.g., /oxs-viewer) can hand off patterns directly to the interactive Studio.
 */
export function queueProjectForStudio(project: CraftProject): boolean {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false;
  }
  try {
    sessionStorage.setItem(PENDING_STUDIO_PROJECT_KEY, JSON.stringify(project));
    return true;
  } catch (err) {
    console.warn('Could not queue project for Studio handoff:', err);
    return false;
  }
}

/**
 * Reads and immediately clears any queued project waiting to open in the Studio.
 */
export function consumePendingStudioProject(): CraftProject | null {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(PENDING_STUDIO_PROJECT_KEY);
    sessionStorage.removeItem(PENDING_STUDIO_PROJECT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<CraftProject>;
    if (
      !parsed ||
      !parsed.gridConfig ||
      !Array.isArray(parsed.gridData) ||
      parsed.gridData.length === 0 ||
      !Array.isArray(parsed.palette) ||
      parsed.palette.length === 0
    ) {
      return null;
    }

    return {
      version: parsed.version || '2.0',
      name: parsed.name || 'Imported Pattern',
      createdAt: parsed.createdAt || new Date().toISOString(),
      gridConfig: parsed.gridConfig,
      gridData: parsed.gridData,
      palette: parsed.palette,
      completedCells: parsed.completedCells || {},
      backstitches: parsed.backstitches || [],
    };
  } catch {
    try {
      sessionStorage.removeItem(PENDING_STUDIO_PROJECT_KEY);
    } catch {
      // Ignore cleanup errors
    }
    return null;
  }
}
