import React, { useState } from 'react';
import type { UploadHistoryItem, AiHistoryItem } from '../types/craft';
import { 
  History, 
  X, 
  Trash2, 
  Upload, 
  Wand2, 
  Crop, 
  Clock
} from 'lucide-react';

interface ImageHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  uploadHistory: UploadHistoryItem[];
  aiHistory: AiHistoryItem[];
  onSelectUploadItem: (item: UploadHistoryItem) => void;
  onSelectAiItem: (item: AiHistoryItem) => void;
  onDeleteUploadItem: (id: string) => void;
  onDeleteAiItem: (id: string) => void;
  onClearAllUploadHistory: () => void;
  onOpenCropForImage?: (dataUrl: string) => void;
}

export const ImageHistoryModal: React.FC<ImageHistoryModalProps> = ({
  isOpen,
  onClose,
  uploadHistory,
  aiHistory,
  onSelectUploadItem,
  onSelectAiItem,
  onDeleteUploadItem,
  onDeleteAiItem,
  onClearAllUploadHistory,
  onOpenCropForImage,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'uploads' | 'ai'>('all');

  if (!isOpen) return null;

  // Combine and sort by timestamp
  const combinedItems = [
    ...uploadHistory.map((u) => ({
      type: 'upload' as const,
      id: u.id,
      name: u.name,
      dataUrl: u.dataUrl,
      timestamp: u.timestamp,
      width: u.width,
      height: u.height,
      rawItem: u,
    })),
    ...aiHistory.map((a) => ({
      type: 'ai' as const,
      id: a.id,
      name: a.prompt,
      dataUrl: a.dataUrl,
      timestamp: new Date(a.createdAt).getTime() || Date.now(),
      width: 512,
      height: 512,
      rawItem: a,
    })),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const displayedItems = combinedItems.filter((item) => {
    if (activeTab === 'uploads') return item.type === 'upload';
    if (activeTab === 'ai') return item.type === 'ai';
    return true;
  });

  const formatTime = (ts: number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2.5 sm:p-4 animate-in fade-in duration-150 select-none"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] shadow-2xl overflow-hidden flex flex-col my-auto"
      >
        {/* Modal Header */}
        <div className="shrink-0 p-3.5 sm:p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Picture History & Library</h2>
              <p className="text-[11px] text-slate-400">Revisit previously uploaded photos and AI generated patterns</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs & Clear Action */}
        <div className="shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs overflow-x-auto [scrollbar-width:none]">
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md font-semibold transition ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({combinedItems.length})
            </button>
            <button
              onClick={() => setActiveTab('uploads')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                activeTab === 'uploads'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Uploads ({uploadHistory.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1 ${
                activeTab === 'ai'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Wand2 className="w-3 h-3" />
              <span>AI ({aiHistory.length})</span>
            </button>
          </div>

          {uploadHistory.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Clear all uploaded images history?')) {
                  onClearAllUploadHistory();
                }
              }}
              className="text-[11px] text-slate-400 hover:text-red-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Upload History</span>
            </button>
          )}
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 [scrollbar-width:thin] [scrollbar-color:#334155_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
          {displayedItems.length === 0 ? (
            <div className="text-center py-16 text-slate-500 space-y-2">
              <History className="w-8 h-8 mx-auto opacity-30 text-indigo-400" />
              <p className="text-xs">No pictures saved in history yet.</p>
              <p className="text-[11px] text-slate-600">
                Upload images or create with AI and they will automatically appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayedItems.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="group bg-slate-950/70 border border-slate-800 hover:border-indigo-500/70 rounded-xl overflow-hidden flex flex-col transition-all hover:shadow-lg hover:-translate-y-0.5"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-square overflow-hidden bg-slate-900 cursor-pointer"
                    onClick={() => {
                      if (item.type === 'upload') onSelectUploadItem(item.rawItem as UploadHistoryItem);
                      else onSelectAiItem(item.rawItem as AiHistoryItem);
                      onClose();
                    }}
                  >
                    <img
                      src={item.dataUrl}
                      alt={item.name}
                      className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-indigo-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-md">
                        Use Pattern
                      </span>
                    </div>

                    {/* Tag badge */}
                    <div className="absolute top-1.5 left-1.5">
                      {item.type === 'upload' ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/80 text-indigo-300 border border-indigo-500/30">
                          Upload
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-900/80 text-purple-300 border border-purple-500/30">
                          AI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Metadata & Actions */}
                  <div className="p-2.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 truncate" title={item.name}>
                        {item.name || 'Untitled Picture'}
                      </h4>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 mt-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatTime(item.timestamp)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/70 text-xs">
                      {onOpenCropForImage && (
                        <button
                          onClick={() => {
                            onOpenCropForImage(item.dataUrl);
                            onClose();
                          }}
                          className="p-1 rounded text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition"
                          title="Crop this picture"
                        >
                          <Crop className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (item.type === 'upload') onDeleteUploadItem(item.id);
                          else onDeleteAiItem(item.id);
                        }}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-slate-800 transition ml-auto"
                        title="Delete from history"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700/80 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
