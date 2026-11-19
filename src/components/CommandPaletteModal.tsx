import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, CornerDownLeft, Command } from 'lucide-react';

export interface CommandPaletteItem {
  id: string;
  label: string;
  description: string;
  category: 'Tools' | 'Crafts' | 'Export & Shop' | 'Canvas Actions';
  shortcut?: string;
  keywords: string[];
  icon: React.ReactNode;
  onExecute: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CommandPaletteItem[];
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  items,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => clearTimeout(t);
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
    );
  }, [items, query]);

  const clampedIndex = filtered.length > 0 ? Math.min(selectedIndex, filtered.length - 1) : 0;

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (filtered.length > 0) {
          setSelectedIndex((prev) => (prev + 1) % filtered.length);
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (filtered.length > 0) {
          setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
        }
      } else if (e.key === 'Enter') {
        if (filtered[clampedIndex]) {
          e.preventDefault();
          filtered[clampedIndex].onExecute();
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filtered, clampedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-[10vh] p-3 animate-in fade-in duration-100 select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900/95 border border-slate-700/90 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Search Input Header */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-2.5 bg-slate-950/90">
          <Search className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Jump to tool, switch craft, open export, calculator, or action..."
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[10px]">
            Esc
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[58vh] overflow-y-auto p-2 space-y-1 [scrollbar-width:thin]">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500">
              No matching command for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === clampedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    item.onExecute();
                    onClose();
                  }}
                  className={`w-full px-3 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition ${
                    isSelected
                      ? 'bg-indigo-600/25 border border-indigo-500/50 text-white shadow-sm'
                      : 'border border-transparent text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isSelected ? 'bg-indigo-600/30 text-indigo-300' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold truncate">{item.label}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 shrink-0">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.shortcut && (
                      <kbd className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-300">
                        {item.shortcut}
                      </kbd>
                    )}
                    {isSelected && <CornerDownLeft className="w-3.5 h-3.5 text-indigo-300" />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hint */}
        <div className="px-3.5 py-2 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <Command className="w-3 h-3 text-indigo-400" />
            <span>Use ↑ ↓ arrows to navigate, Enter to run</span>
          </span>
          <span className="font-mono">{filtered.length} commands</span>
        </div>
      </div>
    </div>
  );
};
