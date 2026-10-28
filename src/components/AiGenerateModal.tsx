import React, { useState, useEffect } from 'react';
import { 
  Wand2, 
  X, 
  Sparkles, 
  RefreshCw, 
  Check, 
  Lightbulb, 
  AlertCircle,
  Dice5,
  Key,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Trash2,
  Copy,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { 
  AI_STYLE_PRESETS, 
  INSPIRATION_PROMPTS, 
  generateImageFromPrompt,
  type GenerationError 
} from '../utils/aiGenerator';
import type { AiHistoryItem } from '../types/craft';

interface AiGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageGenerated: (dataUrl: string, promptUsed: string, styleUsed: string) => void;
  history: AiHistoryItem[];
  onDeleteHistoryItem: (id: string) => void;
  onClearHistory: () => void;
  onInspectImage?: (url: string, prompt?: string, styleName?: string) => void;
  initialPrompt?: string;
  initialStyleId?: string;
}

export const AiGenerateModal: React.FC<AiGenerateModalProps> = ({
  isOpen,
  onClose,
  onImageGenerated,
  history,
  onDeleteHistoryItem,
  onClearHistory,
  onInspectImage,
  initialPrompt = '',
  initialStyleId = 'pixel-art',
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [selectedStyleId, setSelectedStyleId] = useState(initialStyleId || 'pixel-art');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Optional API key
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('pollinations_api_key') || '';
    } catch {
      return '';
    }
  });
  const [showKeyInput, setShowKeyInput] = useState<boolean>(false);

  // Countdown timer for free limit cooldown
  useEffect(() => {
    if (retryCountdown <= 0) return;
    const interval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          setErrorMessage(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [retryCountdown]);

  if (!isOpen) return null;

  const handleApiKeyChange = (newKey: string) => {
    setApiKey(newKey);
    try {
      localStorage.setItem('pollinations_api_key', newKey);
    } catch {
      // Ignore
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || retryCountdown > 0) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedPreviewUrl(null);

    try {
      const dataUrl = await generateImageFromPrompt({
        prompt: prompt.trim(),
        styleId: selectedStyleId,
        width: 512,
        height: 512,
        apiKey: apiKey.trim(),
      });

      setGeneratedPreviewUrl(dataUrl);
    } catch (err: unknown) {
      console.error('AI generation error:', err);
      const genErr = err as GenerationError & Error;

      if (genErr.retryAfterSeconds && genErr.retryAfterSeconds > 0) {
        setRetryCountdown(genErr.retryAfterSeconds);
      }

      setErrorMessage(
        genErr.message ||
        'Failed to generate picture. Please check your network connection and try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseImage = (urlToUse?: string, promptToUse?: string, styleToUse?: string) => {
    const finalUrl = urlToUse || generatedPreviewUrl;
    if (!finalUrl) return;

    onImageGenerated(
      finalUrl, 
      promptToUse || prompt, 
      styleToUse || selectedStyleId
    );
    onClose();
  };

  const handlePickRandomInspiration = () => {
    const random = INSPIRATION_PROMPTS[Math.floor(Math.random() * INSPIRATION_PROMPTS.length)];
    setPrompt(random);
  };

  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReuseFromHistory = (item: AiHistoryItem) => {
    setPrompt(item.prompt);
    setSelectedStyleId(item.styleId);
    setActiveTab('create');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-md shadow-pink-500/20">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                AI Picture Studio
              </h2>
              <p className="text-[11px] text-slate-400">
                Generate custom craft subjects and browse your picture history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg font-bold transition border-b-2 ${
              activeTab === 'create'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Create Picture
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-t-lg font-bold transition border-b-2 ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-300 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Generation History</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.2 rounded-full">
              {history.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
          {/* TAB 1: CREATE */}
          {activeTab === 'create' && (
            <div className="space-y-4">
              {/* Prompt Input Area */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    What would you like to create?
                  </label>
                  <button
                    type="button"
                    onClick={handlePickRandomInspiration}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition font-medium"
                  >
                    <Dice5 className="w-3.5 h-3.5" />
                    Surprise Me
                  </button>
                </div>

                <textarea
                  rows={3}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., A cute chubby red panda eating bamboo, vibrant colors..."
                  className="w-full p-3 bg-slate-950 border border-slate-700/80 rounded-xl text-slate-100 text-xs placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 resize-none transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                      handleGenerate();
                    }
                  }}
                />

                {/* Inspiration Chips */}
                <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                  <span className="text-slate-500 shrink-0 flex items-center gap-1 font-medium">
                    <Lightbulb className="w-3 h-3 text-amber-400" />
                    Try:
                  </span>
                  {INSPIRATION_PROMPTS.slice(0, 5).map((insp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPrompt(insp)}
                      className="shrink-0 px-2.5 py-1 bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded-lg border border-slate-700/60 transition truncate max-w-[200px]"
                      title={insp}
                    >
                      {insp}
                    </button>
                  ))}
                </div>
              </div>

              {/* Art Style Presets */}
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-2">
                  Choose Art & Craft Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AI_STYLE_PRESETS.map((style) => {
                    const isSelected = selectedStyleId === style.id;
                    return (
                      <button
                        key={style.id}
                        type="button"
                        onClick={() => setSelectedStyleId(style.id)}
                        className={`p-2.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500 text-indigo-200'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="text-base mb-1">{style.icon}</div>
                          <div className="font-bold text-xs text-slate-200">{style.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                            {style.description}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Custom API Key Accordion */}
              <div className="border border-slate-800/80 rounded-xl bg-slate-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowKeyInput(!showKeyInput)}
                  className="w-full flex items-center justify-between p-2.5 text-[11px] text-slate-400 hover:text-slate-200 transition"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Optional: Custom Pollen API Key (removes 45s wait between pictures)
                  </span>
                  {showKeyInput ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {showKeyInput && (
                  <div className="p-3 pt-0 border-t border-slate-800/60 space-y-2 mt-1">
                    <p className="text-[10px] text-slate-400">
                      The free tier allows 1 image every 45 seconds per IP. If you have a Pollen API key, enter it below to bypass all waiting:
                    </p>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => handleApiKeyChange(e.target.value)}
                      placeholder="Paste your Pollen API key..."
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-100 text-xs focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Error or Rate Limit Notice */}
              {errorMessage && (
                <div className={`p-3.5 rounded-xl border flex items-start gap-2.5 ${
                  retryCountdown > 0 
                    ? 'bg-amber-950/40 border-amber-500/50 text-amber-200' 
                    : 'bg-red-950/40 border-red-500/50 text-red-200'
                }`}>
                  {retryCountdown > 0 ? (
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <div className="font-semibold text-xs">
                      {retryCountdown > 0 ? 'Free Generation Cooldown Active' : 'Generation Notice'}
                    </div>
                    <div className="text-[11px] leading-relaxed">
                      {errorMessage}
                    </div>
                    {retryCountdown > 0 && (
                      <div className="text-xs font-bold text-amber-300 font-mono pt-1">
                        Ready in: {retryCountdown} seconds
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <div className="p-8 rounded-xl bg-slate-950/70 border border-indigo-500/30 flex flex-col items-center justify-center space-y-3 animate-pulse">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-pink-500 animate-spin" />
                    <Sparkles className="w-5 h-5 text-amber-400 absolute inset-0 m-auto" />
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-slate-200 text-sm">
                      AI is painting your craft picture...
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Creating vibrant colors and high-contrast shapes
                    </div>
                  </div>
                </div>
              )}

              {/* Preview & Action */}
              {generatedPreviewUrl && !isGenerating && (
                <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-indigo-500/40 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Generated Artwork Ready!
                    </span>
                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={retryCountdown > 0}
                      className="text-xs text-indigo-400 hover:text-indigo-300 disabled:opacity-40 flex items-center gap-1 font-semibold"
                    >
                      <RefreshCw className="w-3 h-3" />
                      {retryCountdown > 0 ? `Wait ${retryCountdown}s` : 'Try Another Variation'}
                    </button>
                  </div>

                  <div className="relative aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden border-2 border-indigo-500/60 shadow-xl group">
                    <img
                      src={generatedPreviewUrl}
                      alt="AI Generated Craft Subject"
                      className="w-full h-full object-cover"
                    />
                    {onInspectImage && (
                      <button
                        type="button"
                        onClick={() => {
                          const currentStyle = AI_STYLE_PRESETS.find((s) => s.id === selectedStyleId);
                          onInspectImage(generatedPreviewUrl, prompt, currentStyle?.name);
                        }}
                        className="absolute top-2 right-2 p-1.5 px-2 bg-slate-900/85 hover:bg-slate-900 text-white rounded-lg backdrop-blur-md shadow-md border border-white/20 transition flex items-center gap-1.5 text-[10px] font-semibold"
                        title="Inspect full resolution picture"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleUseImage()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    Turn into Pixel Craft Grid!
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-slate-400 text-xs">
                  {history.length} saved picture{history.length === 1 ? '' : 's'} in history
                </span>
                {history.length > 0 && (
                  <button
                    onClick={onClearHistory}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear All
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-500 text-xl">
                    📜
                  </div>
                  <h4 className="text-slate-300 font-bold text-sm">No History Yet</h4>
                  <p className="text-slate-500 text-xs max-w-xs mx-auto">
                    Generate your first picture in the &quot;Create Picture&quot; tab and it will automatically be saved here with its prompt!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item) => {
                    const stylePreset = AI_STYLE_PRESETS.find((s) => s.id === item.styleId);
                    const formattedDate = new Date(item.createdAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    });

                    return (
                      <div
                        key={item.id}
                        className="p-3 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl transition flex flex-col sm:flex-row gap-3.5 items-start sm:items-center justify-between group"
                      >
                        {/* Image & Prompt Details */}
                        <div className="flex gap-3 min-w-0 flex-1">
                          <img
                            src={item.dataUrl}
                            alt={item.prompt}
                            className="w-16 h-16 rounded-lg object-cover border border-slate-700/80 shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <p className="text-xs font-semibold text-slate-100 line-clamp-2">
                              &ldquo;{item.prompt}&rdquo;
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400">
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                {stylePreset ? `${stylePreset.icon} ${stylePreset.name}` : 'Custom'}
                              </span>
                              <span>•</span>
                              <span>{formattedDate}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {onInspectImage && (
                            <button
                              type="button"
                              onClick={() => onInspectImage(item.dataUrl, item.prompt, stylePreset?.name)}
                              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                              title="Inspect full image in high resolution"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleCopyPrompt(item.prompt, item.id)}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                            title="Copy prompt text"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReuseFromHistory(item)}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition text-[11px] flex items-center gap-1"
                            title="Reuse this prompt & style"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteHistoryItem(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
                            title="Delete this history item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUseImage(item.dataUrl, item.prompt, item.styleId)}
                            className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 ml-1"
                          >
                            <Check className="w-3 h-3" />
                            Turn into Grid
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            {retryCountdown > 0 ? (
              <span className="text-amber-400 font-medium">Cooldown: {retryCountdown}s remaining</span>
            ) : (
              'History automatically saved'
            )}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
            >
              Close
            </button>
            {activeTab === 'create' && (
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim() || retryCountdown > 0}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-40 disabled:hover:from-indigo-600 text-white rounded-lg text-xs font-bold shadow-md transition flex items-center gap-1.5 active:scale-98"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Painting...
                  </>
                ) : retryCountdown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    Wait {retryCountdown}s
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    Generate Picture
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
