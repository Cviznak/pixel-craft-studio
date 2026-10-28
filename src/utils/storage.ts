import type { GridConfig, PaletteColor, CellProgress, AiHistoryItem, UploadHistoryItem } from '../types/craft';

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
}

const DB_NAME = 'PixelCraftStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'app_state';
const STATE_KEY = 'current_project_state';

// Open or initialize IndexedDB
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Save state to IndexedDB with localStorage fallback
export async function saveAppState(state: SavedAppState): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(state, STATE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    // Fallback: save critical metadata to localStorage (without heavy image if too large)
    try {
      const lightweightState = {
        ...state,
        // If image URL is a huge data URL, omit or keep if small
        sourceImageDataUrl: state.sourceImageDataUrl && state.sourceImageDataUrl.length < 500000 
          ? state.sourceImageDataUrl 
          : null,
      };
      localStorage.setItem('pixel_craft_state_fallback', JSON.stringify(lightweightState));
    } catch (localErr) {
      console.warn('LocalStorage fallback write failed:', localErr);
    }
  }
}

// Load state from IndexedDB with localStorage fallback
export async function loadAppState(): Promise<SavedAppState | null> {
  try {
    const db = await openDB();
    const result = await new Promise<SavedAppState | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
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

// Clear saved state if user wants a clean slate
export async function clearSavedAppState(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
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
