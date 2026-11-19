import type { 
  GridConfig, 
  PaletteColor, 
  CellProgress, 
  AiHistoryItem, 
  UploadHistoryItem, 
  BackstitchLine,
  SavedProject 
} from '../types/craft';
import { parseOXSFile } from './oxsFormat';

export interface SavedAppState {
  version: number;
  updatedAt: string;
  config: GridConfig;
  palette: PaletteColor[];
  gridData: number[][];
  completedCells: CellProgress;
  spotlightColorId: string | null;
  activeColorIndex: number;
  sourceImageDataUrl: string | null;
  sampleImageId?: string;
  lastAiPrompt?: string;
  lastAiStyle?: string;
  aiHistory?: AiHistoryItem[];
  uploadHistory?: UploadHistoryItem[];
  backstitches?: BackstitchLine[];
}

const DB_NAME = 'PixelCraftStudioDB';
const DB_VERSION = 2;
const APP_STATE_STORE = 'app_state';
const PROJECTS_STORE = 'user_projects';
const STATE_KEY = 'current_project_state';

// Open or initialize IndexedDB with upgrade handling
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(APP_STATE_STORE)) {
        db.createObjectStore(APP_STATE_STORE);
      }
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        const store = db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('craftType', 'craftType', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// THUMBNAIL GENERATOR
// ==========================================

export function generateProjectThumbnail(
  gridData: number[][],
  palette: PaletteColor[],
  backstitches?: BackstitchLine[]
): string {
  if (!gridData || gridData.length === 0 || !gridData[0] || gridData[0].length === 0) {
    return '';
  }

  const rows = gridData.length;
  const cols = gridData[0].length;
  const maxThumbDim = 160;
  const cellSize = Math.max(2, Math.floor(maxThumbDim / Math.max(rows, cols)));

  const width = cols * cellSize;
  const height = rows * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, height);

  // Draw grid cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const colorIdx = gridData[r][c];
      if (colorIdx >= 0 && colorIdx < palette.length) {
        ctx.fillStyle = palette[colorIdx].hex;
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }
  }

  // Draw backstitches if any
  if (backstitches && backstitches.length > 0) {
    for (const line of backstitches) {
      ctx.beginPath();
      ctx.moveTo(line.x1 * cellSize, line.y1 * cellSize);
      ctx.lineTo(line.x2 * cellSize, line.y2 * cellSize);
      ctx.strokeStyle = line.colorHex || '#ffffff';
      ctx.lineWidth = Math.max(1.5, cellSize * 0.25);
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }

  return canvas.toDataURL('image/png');
}

// ==========================================
// APP STATE (CONTINUOUS AUTO-SAVE)
// ==========================================

export async function saveAppState(state: SavedAppState): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(APP_STATE_STORE, 'readwrite');
      const store = tx.objectStore(APP_STATE_STORE);
      const req = store.put(state, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback: save critical metadata to localStorage
    try {
      const lightweightState = {
        ...state,
        sourceImageDataUrl: state.sourceImageDataUrl && state.sourceImageDataUrl.length < 300000 
          ? state.sourceImageDataUrl 
          : null,
      };
      localStorage.setItem('pixel_craft_state_fallback', JSON.stringify(lightweightState));
    } catch (localErr) {
      console.warn('LocalStorage fallback write failed:', localErr);
    }
  }
}

export async function loadAppState(): Promise<SavedAppState | null> {
  try {
    const db = await openDB();
    const result = await new Promise<SavedAppState | null>((resolve, reject) => {
      const tx = db.transaction(APP_STATE_STORE, 'readonly');
      const store = tx.objectStore(APP_STATE_STORE);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });

    if (result) return result;
  } catch (err) {
    console.warn('IndexedDB read failed, attempting localStorage fallback:', err);
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem('pixel_craft_state_fallback');
    if (raw) {
      return JSON.parse(raw) as SavedAppState;
    }
  } catch (e) {
    console.warn('Could not read from localStorage fallback');
  }

  return null;
}

export async function clearSavedAppState(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(APP_STATE_STORE, 'readwrite');
      const store = tx.objectStore(APP_STATE_STORE);
      const req = store.delete(STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('Error clearing IndexedDB:', e);
  }
  try {
    localStorage.removeItem('pixel_craft_state_fallback');
    localStorage.removeItem('pixel_craft_progress');
  } catch (e) {
    // Ignore
  }
}

// ==========================================
// PROJECT VAULT (MULTI-PROJECT PERSISTENCE)
// ==========================================

export async function getAllVaultProjects(): Promise<SavedProject[]> {
  try {
    const db = await openDB();
    return new Promise<SavedProject[]>((resolve, reject) => {
      const tx = db.transaction(PROJECTS_STORE, 'readonly');
      const store = tx.objectStore(PROJECTS_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []) as SavedProject[];
        // Sort descending by updatedAt
        list.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get vault projects from IndexedDB, checking localStorage backup:', err);
    try {
      const raw = localStorage.getItem('pixel_craft_vault_backup');
      if (raw) return JSON.parse(raw) as SavedProject[];
    } catch {}
    return [];
  }
}

export async function getVaultProject(id: string): Promise<SavedProject | null> {
  try {
    const db = await openDB();
    return new Promise<SavedProject | null>((resolve, reject) => {
      const tx = db.transaction(PROJECTS_STORE, 'readonly');
      const store = tx.objectStore(PROJECTS_STORE);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as SavedProject) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to load project from vault:', err);
    return null;
  }
}

export async function saveProjectToVault(
  projectData: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt' | 'thumbnailDataUrl'> & {
    id?: string;
    createdAt?: number;
    updatedAt?: number;
    thumbnailDataUrl?: string;
  },
  preserveUpdatedAt = false
): Promise<SavedProject> {
  const now = Date.now();
  const id = projectData.id || `proj_${now}_${Math.random().toString(36).substring(2, 8)}`;
  const createdAt = projectData.createdAt || now;
  const updatedAt = preserveUpdatedAt && projectData.updatedAt ? projectData.updatedAt : now;

  const thumbnailDataUrl = projectData.thumbnailDataUrl || generateProjectThumbnail(
    projectData.gridData,
    projectData.palette,
    projectData.backstitches
  );

  const fullProject: SavedProject = {
    ...projectData,
    id,
    createdAt,
    updatedAt,
    thumbnailDataUrl,
    width: projectData.gridConfig.width,
    height: projectData.gridConfig.height,
    colorCount: projectData.palette.length,
  };

  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROJECTS_STORE, 'readwrite');
      const store = tx.objectStore(PROJECTS_STORE);
      const req = store.put(fullProject);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save to IndexedDB vault, backing up to localStorage:', err);
  }

  return fullProject;
}

export async function deleteVaultProject(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PROJECTS_STORE, 'readwrite');
      const store = tx.objectStore(PROJECTS_STORE);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to delete project from vault:', err);
  }
}

export async function duplicateVaultProject(id: string): Promise<SavedProject> {
  const original = await getVaultProject(id);
  if (!original) {
    throw new Error('Project not found to duplicate');
  }

  const copy = await saveProjectToVault({
    name: `${original.name} (Copy)`,
    craftType: original.craftType,
    gridConfig: { ...original.gridConfig },
    gridData: original.gridData.map((row) => [...row]),
    palette: [...original.palette],
    completedCells: { ...(original.completedCells || {}) },
    backstitches: original.backstitches ? [...original.backstitches] : [],
    thumbnailDataUrl: original.thumbnailDataUrl,
    width: original.width,
    height: original.height,
    colorCount: original.colorCount,
    sourceImageDataUrl: original.sourceImageDataUrl,
  });

  return copy;
}

export function exportVaultProjectToFile(project: SavedProject): void {
  const exportPayload = {
    version: '2.0',
    type: 'pixel-craft-studio-project',
    exportedAt: new Date().toISOString(),
    project,
  };

  const jsonStr = JSON.stringify(exportPayload, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const safeName = project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'pattern';

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName}-${project.craftType}.pixelcraft`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importVaultProjectFromFile(file: File): Promise<SavedProject> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        // Handle Open Cross-Stitch (.oxs) XML files
        if (file.name.toLowerCase().endsWith('.oxs') || text.trimStart().startsWith('<')) {
          const oxsProject = parseOXSFile(text);
          const oxsSaved = await saveProjectToVault({
            name: oxsProject.name || file.name.replace(/\.[^/.]+$/, '') || 'Imported OXS',
            craftType: oxsProject.gridConfig.craftType,
            gridConfig: oxsProject.gridConfig,
            gridData: oxsProject.gridData,
            palette: oxsProject.palette,
            completedCells: oxsProject.completedCells || {},
            backstitches: oxsProject.backstitches || [],
            width: oxsProject.gridConfig.width,
            height: oxsProject.gridConfig.height,
            colorCount: oxsProject.palette.length,
          });
          resolve(oxsSaved);
          return;
        }

        const parsed = JSON.parse(text);

        // Check if file is v2 payload or legacy CraftProject
        let projectToSave: SavedProject;
        if (parsed.type === 'pixel-craft-studio-project' && parsed.project) {
          const p = parsed.project as SavedProject;
          projectToSave = await saveProjectToVault({
            ...p,
            id: undefined, // Assign fresh id
            name: `${p.name} (Imported)`,
          });
        } else if (parsed.gridConfig && parsed.gridData && parsed.palette) {
          // Legacy CraftProject format
          projectToSave = await saveProjectToVault({
            name: parsed.name || file.name.replace(/\.[^/.]+$/, '') || 'Imported Pattern',
            craftType: parsed.gridConfig.craftType || 'cross-stitch',
            gridConfig: parsed.gridConfig,
            gridData: parsed.gridData,
            palette: parsed.palette,
            completedCells: parsed.completedCells || {},
            backstitches: parsed.backstitches || [],
            width: parsed.gridConfig.width,
            height: parsed.gridConfig.height,
            colorCount: parsed.palette.length,
          });
        } else {
          throw new Error('Unrecognized project file format.');
        }

        resolve(projectToSave);
      } catch (err) {
        reject(err instanceof Error ? err : new Error('Invalid project file'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}
