import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  FolderArchive, 
  X, 
  Plus, 
  Upload, 
  Search, 
  Trash2, 
  Copy, 
  Download, 
  Play, 
  Edit2, 
  Check, 
  Layers, 
  Clock, 
  Sparkles,
  Cloud,
  RefreshCw
} from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import type { 
  SavedProject, 
  CraftType, 
  GridConfig, 
  PaletteColor, 
  CellProgress, 
  BackstitchLine 
} from '../types/craft';
import { 
  getAllVaultProjects, 
  saveProjectToVault, 
  deleteVaultProject, 
  duplicateVaultProject, 
  exportVaultProjectToFile, 
  importVaultProjectFromFile,
  generateProjectThumbnail 
} from '../utils/storage';
import {
  deleteCloudProject,
  pushSingleProjectToCloud,
} from '../utils/cloudSync';

interface ProjectVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Current canvas state to allow 1-click "Save Current Canvas"
  currentConfig: GridConfig;
  currentGridData: number[][];
  currentPalette: PaletteColor[];
  currentCompletedCells?: CellProgress;
  currentBackstitches?: BackstitchLine[];
  currentSourceImageDataUrl?: string | null;
  // Handler when user selects a project to open
  onLoadProject: (project: SavedProject) => void;
  onProjectsChanged?: () => void;
  // Cloud Sync props (Wave 4)
  cloudUser?: User | null;
  isCloudSyncing?: boolean;
  lastCloudSyncedAt?: string | null;
  onTriggerCloudSync?: () => Promise<void>;
  onOpenCloudAuth?: () => void;
}

const CRAFT_FILTERS: { id: CraftType | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'All Projects', icon: '📁' },
  { id: 'cross-stitch', label: 'Cross-Stitch', icon: '🧵' },
  { id: 'crochet', label: 'Crochet', icon: '🧶' },
  { id: 'knitting', label: 'Knitting', icon: '🥢' },
  { id: 'loom', label: 'Bead Loom', icon: '📿' },
  { id: 'alpha', label: 'Alpha Knot', icon: '🪢' },
  { id: 'perler', label: 'Perler', icon: '🔘' },
  { id: 'diamond', label: 'Diamond', icon: '💎' },
  { id: 'pixel', label: 'Pixel Art', icon: '🔲' },
];

export const ProjectVaultModal: React.FC<ProjectVaultModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  currentGridData,
  currentPalette,
  currentCompletedCells,
  currentBackstitches,
  currentSourceImageDataUrl,
  onLoadProject,
  onProjectsChanged,
  cloudUser = null,
  isCloudSyncing = false,
  lastCloudSyncedAt = null,
  onTriggerCloudSync,
  onOpenCloudAuth,
}) => {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<CraftType | 'all'>('all');
  const [isSavingCurrent, setIsSavingCurrent] = useState<boolean>(false);
  const [currentProjectName, setCurrentProjectName] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load projects whenever modal opens
  const refreshProjects = async () => {
    setIsLoading(true);
    try {
      const list = await getAllVaultProjects();
      setProjects(list);
      if (onProjectsChanged) onProjectsChanged();
    } catch (err) {
      console.error('Failed to load vault projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshProjects();
      setDeleteConfirmId(null);
      setIsSavingCurrent(false);
      setCurrentProjectName(`${currentConfig.craftType.toUpperCase()} Pattern ${currentConfig.width}×${currentConfig.height}`);
    }
  }, [isOpen, currentConfig]);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    let result = projects;
    if (activeFilter !== 'all') {
      result = result.filter((p) => p.craftType === activeFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    return result;
  }, [projects, activeFilter, searchQuery]);

  // Save current canvas to vault
  const handleSaveCurrent = async () => {
    if (!currentGridData || currentGridData.length === 0) return;
    const name = currentProjectName.trim() || `Pattern ${new Date().toLocaleDateString()}`;

    const thumb = generateProjectThumbnail(currentGridData, currentPalette, currentBackstitches);

    const saved = await saveProjectToVault({
      name,
      craftType: currentConfig.craftType,
      gridConfig: currentConfig,
      gridData: currentGridData,
      palette: currentPalette,
      completedCells: currentCompletedCells,
      backstitches: currentBackstitches,
      thumbnailDataUrl: thumb,
      width: currentConfig.width,
      height: currentConfig.height,
      colorCount: currentPalette.length,
      sourceImageDataUrl: currentSourceImageDataUrl,
    });

    if (cloudUser) {
      pushSingleProjectToCloud(cloudUser.id, saved).catch((err) =>
        console.warn('Cloud push failed:', err)
      );
    }

    setIsSavingCurrent(false);
    await refreshProjects();
  };

  // Duplicate
  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const copy = await duplicateVaultProject(id);
      if (cloudUser) {
        pushSingleProjectToCloud(cloudUser.id, copy).catch((err) =>
          console.warn('Cloud duplicate push failed:', err)
        );
      }
      await refreshProjects();
    } catch (err) {
      console.error('Duplicate failed:', err);
    }
  };

  // Delete
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteVaultProject(id);
      if (cloudUser) {
        deleteCloudProject(cloudUser.id, id).catch((err) =>
          console.warn('Cloud delete failed:', err)
        );
      }
      setDeleteConfirmId(null);
      await refreshProjects();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  // Export
  const handleExport = (project: SavedProject, e: React.MouseEvent) => {
    e.stopPropagation();
    exportVaultProjectToFile(project);
  };

  // Import file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const imported = await importVaultProjectFromFile(file);
      if (cloudUser) {
        pushSingleProjectToCloud(cloudUser.id, imported).catch((err) =>
          console.warn('Cloud import push failed:', err)
        );
      }
      await refreshProjects();
    } catch (err) {
      alert(`Could not import project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Inline rename submit
  const handleSaveRename = async (project: SavedProject) => {
    if (!editingName.trim()) {
      setEditingId(null);
      return;
    }
    const renamed = await saveProjectToVault({
      ...project,
      name: editingName.trim(),
    });
    if (cloudUser) {
      pushSingleProjectToCloud(cloudUser.id, renamed).catch((err) =>
        console.warn('Cloud rename push failed:', err)
      );
    }
    setEditingId(null);
    await refreshProjects();
  };

  // Relative time format helper
  const formatTimeAgo = (timestamp: number) => {
    const elapsed = Math.floor((Date.now() - timestamp) / 1000);
    if (elapsed < 60) return 'Just now';
    if (elapsed < 3600) return `${Math.floor(elapsed / 60)}m ago`;
    if (elapsed < 86400) return `${Math.floor(elapsed / 3600)}h ago`;
    return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0 gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  My Projects Vault
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {projects.length} Saved
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Switch between works-in-progress, duplicate designs, or export backups.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cloud Sync Trigger */}
            {cloudUser ? (
              <button
                onClick={async () => {
                  if (onTriggerCloudSync) {
                    await onTriggerCloudSync();
                    await refreshProjects();
                  }
                }}
                disabled={isCloudSyncing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 transition"
                title={lastCloudSyncedAt ? `Last synced ${new Date(lastCloudSyncedAt).toLocaleTimeString()}` : 'Sync Vault & Stash with Cloud'}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">{isCloudSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>
            ) : onOpenCloudAuth ? (
              <button
                onClick={() => {
                  onClose();
                  onOpenCloudAuth();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
                title="Sign in to sync projects across devices"
              >
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Cloud Sync</span>
              </button>
            ) : null}

            {/* 1-Click Save Current Canvas */}
            <button
              onClick={() => setIsSavingCurrent(!isSavingCurrent)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md active:scale-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Save Current Canvas</span>
              <span className="sm:hidden">Save</span>
            </button>

            {/* Import Project File */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-95 transition"
              title="Import .pixelcraft or .json pattern backup"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pixelcraft,.json"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Save Current Prompt Bar */}
        {isSavingCurrent && (
          <div className="px-5 py-3 bg-indigo-950/40 border-b border-indigo-900/50 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-150 shrink-0">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-xs font-semibold text-indigo-300 shrink-0">Project Name:</span>
              <input
                type="text"
                value={currentProjectName}
                onChange={(e) => setCurrentProjectName(e.target.value)}
                placeholder="Give your pattern a name..."
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-indigo-500/40 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveCurrent();
                }}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={handleSaveCurrent}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition shadow-sm"
              >
                Confirm Save
              </button>
              <button
                onClick={() => setIsSavingCurrent(false)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-950/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Craft Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {CRAFT_FILTERS.map((f) => {
              const active = activeFilter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setActiveFilter(f.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{f.icon}</span>
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-60 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Projects Gallery */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-500">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs">Loading your saved designs...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/20">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {searchQuery || activeFilter !== 'all' ? 'No matching projects found' : 'Your Vault is empty'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {searchQuery || activeFilter !== 'all'
                  ? 'Try adjusting your search terms or craft filters above.'
                  : 'Save your current canvas to keep multiple works-in-progress safe and ready to resume anytime.'}
              </p>
              <button
                onClick={() => setIsSavingCurrent(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition"
              >
                Save Current Canvas Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((p) => {
                const isEditing = editingId === p.id;
                const isConfirmingDelete = deleteConfirmId === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      onLoadProject(p);
                      onClose();
                    }}
                    className="group relative bg-slate-950/70 border border-slate-800/90 hover:border-indigo-500/50 rounded-2xl p-3.5 flex flex-col gap-3 shadow-lg hover:shadow-indigo-500/10 transition cursor-pointer select-none"
                  >
                    {/* Thumbnail Frame */}
                    <div className="relative w-full aspect-square rounded-xl bg-slate-900 border border-slate-800/90 overflow-hidden flex items-center justify-center">
                      {p.thumbnailDataUrl ? (
                        <img
                          src={p.thumbnailDataUrl}
                          alt={p.name}
                          className="w-full h-full object-contain p-2 image-rendering-pixelated group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="text-slate-600 flex flex-col items-center gap-1 text-[10px]">
                          <Layers className="w-6 h-6 text-slate-700" />
                          <span>No Preview</span>
                        </div>
                      )}

                      {/* Craft Badge */}
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[10px] font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1 shadow">
                        <span>
                          {CRAFT_FILTERS.find((c) => c.id === p.craftType)?.icon || '🧵'}
                        </span>
                        <span>{p.craftType}</span>
                      </div>

                      {/* Quick Open Overlay on hover */}
                      <div className="absolute inset-0 bg-indigo-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-xl scale-95 group-hover:scale-100 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Open Project</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-start justify-between gap-2">
                        {isEditing ? (
                          <div 
                            className="flex items-center gap-1 flex-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 px-2 py-0.5 rounded bg-slate-900 border border-indigo-400 text-xs text-white focus:outline-none"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveRename(p);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                            />
                            <button
                              onClick={() => handleSaveRename(p)}
                              className="p-1 rounded bg-indigo-600 text-white"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <h4 
                            className="text-xs font-bold text-white truncate flex-1 group-hover:text-indigo-300 transition"
                            title={p.name}
                          >
                            {p.name}
                          </h4>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(p.id);
                            setEditingName(p.name);
                          }}
                          className="p-1 text-slate-500 hover:text-slate-300 transition"
                          title="Rename project"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Grid Stats */}
                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        <span>{p.width} × {p.height} sts</span>
                        <span>•</span>
                        <span>{p.colorCount} colors</span>
                        <span>•</span>
                        <div className="flex items-center gap-1 text-slate-500 ml-auto text-[10px]">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{formatTimeAgo(p.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Actions Footer */}
                    <div 
                      className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-1 text-slate-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => handleDuplicate(p.id, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
                        title="Duplicate project"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={(e) => handleExport(p, e)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 hover:text-slate-200 transition"
                        title="Export .pixelcraft file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleDelete(p.id, e)}
                            className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-500/20 hover:text-rose-400 transition"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
