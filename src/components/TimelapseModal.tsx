import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Video, 
  X, 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Sparkles, 
  Smartphone, 
  Square, 
  Monitor, 
  Loader2
} from 'lucide-react';
import type { PaletteColor, CraftType } from '../types/craft';
import { 
  createTimelapseController, 
  recordTimelapseVideo,
  type TimelapseAnimationMode,
  type TimelapseAspectRatio
} from '../utils/timelapseGenerator';

interface TimelapseModalProps {
  isOpen: boolean;
  onClose: () => void;
  gridData: number[][];
  palette: PaletteColor[];
  craftType: CraftType;
  defaultTitle?: string;
}

export const TimelapseModal: React.FC<TimelapseModalProps> = ({
  isOpen,
  onClose,
  gridData,
  palette,
  craftType,
  defaultTitle = 'Pixel Craft Timelapse',
}) => {
  const [mode, setMode] = useState<TimelapseAnimationMode>('layer-reveal');
  const [aspectRatio, setAspectRatio] = useState<TimelapseAspectRatio>('9:16');
  const [title, setTitle] = useState<string>(defaultTitle);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [duration, setDuration] = useState<number>(6); // seconds
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const gridHeight = gridData.length;
  const gridWidth = gridHeight > 0 ? gridData[0].length : 0;

  // Create controller
  const controllerRef = useRef<ReturnType<typeof createTimelapseController> | null>(null);

  const initController = useCallback(() => {
    if (!canvasRef.current || gridWidth === 0 || gridHeight === 0) return;
    controllerRef.current = createTimelapseController(
      {
        gridData,
        palette,
        craftType,
        mode,
        aspectRatio,
        title,
        watermark: true,
      },
      canvasRef.current
    );
    controllerRef.current.renderStep(progress);
  }, [gridData, palette, craftType, mode, aspectRatio, title, gridWidth, gridHeight, progress]);

  // Re-initialize controller when dependencies change
  useEffect(() => {
    if (!isOpen) return;
    initController();
  }, [isOpen, initController]);

  // Animation Loop for live preview
  useEffect(() => {
    if (!isOpen || !isPlaying || isRecording) return;

    const loop = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
      }
      const delta = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      setProgress((prev) => {
        const next = prev + delta / duration;
        if (next >= 1) {
          // Loop back to start after a brief pause
          return 0;
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
    };
  }, [isOpen, isPlaying, duration, isRecording]);

  // Render current progress step
  useEffect(() => {
    if (controllerRef.current) {
      controllerRef.current.renderStep(progress);
    }
  }, [progress]);

  // Video recording handler
  const handleDownloadVideo = async () => {
    if (isRecording) return;
    setIsRecording(true);
    setIsPlaying(false);
    setRecordProgress(0);

    try {
      const blob = await recordTimelapseVideo(
        {
          gridData,
          palette,
          craftType,
          mode,
          aspectRatio,
          durationSeconds: duration,
          title,
          watermark: true,
          fps: 30,
        },
        (pct) => setRecordProgress(pct)
      );

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-timelapse.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating timelapse video:', err);
      alert('Could not generate video. Please try again or use another browser.');
    } finally {
      setIsRecording(false);
      setIsPlaying(true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/20">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Animated Craft Timelapse Generator
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                  TikTok • Reels • Pinterest
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Generate high-engagement stitch-by-stitch reveal videos for social media
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Live Video Canvas */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div className="relative w-full aspect-[9/16] max-h-[460px] mx-auto rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center shadow-2xl">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain"
              />

              {/* Play / Pause Overlay on hover or when paused */}
              {!isPlaying && !isRecording && (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition backdrop-blur-sm"
                  title="Play"
                >
                  <Play className="w-6 h-6 ml-0.5" />
                </button>
              )}

              {/* Recording Progress Overlay */}
              {isRecording && (
                <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <Loader2 className="w-8 h-8 text-rose-500 animate-spin mb-3" />
                  <h4 className="text-sm font-bold text-white">Rendering HD Video...</h4>
                  <p className="text-xs text-slate-400 mt-1 mb-3">Capturing frames at 30 fps</p>
                  <div className="w-48 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-rose-500 to-indigo-500 transition-all duration-150"
                      style={{ width: `${recordProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-slate-300 mt-2">{recordProgress}%</span>
                </div>
              )}
            </div>

            {/* Video Controls Bar */}
            <div className="flex items-center gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-200 transition"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => {
                  setProgress(0);
                  setIsPlaying(true);
                }}
                className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                title="Restart from beginning"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Scrub Slider */}
              <input
                type="range"
                min="0"
                max="1"
                step="0.005"
                value={progress}
                onChange={(e) => {
                  setIsPlaying(false);
                  setProgress(parseFloat(e.target.value));
                }}
                className="flex-1 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />

              <span className="text-xs font-mono text-slate-400 w-10 text-right">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>

          {/* Right Column: Settings & Export */}
          <div className="lg:col-span-6 flex flex-col gap-4 text-xs">
            {/* Aspect Ratio Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Format & Platform:</label>
              <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                <button
                  onClick={() => setAspectRatio('9:16')}
                  className={`p-2.5 rounded-lg flex flex-col items-center gap-1 transition ${
                    aspectRatio === '9:16'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="font-bold">9:16 Vertical</span>
                  <span className="text-[10px] opacity-75">TikTok & Reels</span>
                </button>

                <button
                  onClick={() => setAspectRatio('1:1')}
                  className={`p-2.5 rounded-lg flex flex-col items-center gap-1 transition ${
                    aspectRatio === '1:1'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  <span className="font-bold">1:1 Square</span>
                  <span className="text-[10px] opacity-75">Instagram & Pins</span>
                </button>

                <button
                  onClick={() => setAspectRatio('16:9')}
                  className={`p-2.5 rounded-lg flex flex-col items-center gap-1 transition ${
                    aspectRatio === '16:9'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                  }`}
                >
                  <Monitor className="w-4 h-4" />
                  <span className="font-bold">16:9 Wide</span>
                  <span className="text-[10px] opacity-75">YouTube</span>
                </button>
              </div>
            </div>

            {/* Animation Style */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Animation Style:</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[
                  { id: 'layer-reveal', label: 'Color by Color', hint: 'Most satisfying' },
                  { id: 'row-by-row', label: 'Row by Row', hint: 'Craft scan' },
                  { id: 'spiral', label: 'Center Out', hint: 'Bloom reveal' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id as TimelapseAnimationMode)}
                    className={`py-2 px-1.5 rounded-lg flex flex-col items-center transition ${
                      mode === item.id
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="font-bold">{item.label}</span>
                    <span className="text-[9px] opacity-75">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Video Duration / Speed Slider */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-300">Video Duration:</label>
                <span className="text-indigo-400 font-mono font-bold">{duration} seconds</span>
              </div>
              <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[3, 6, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setDuration(sec)}
                    className={`py-1.5 rounded-lg font-mono font-semibold transition ${
                      duration === sec
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            {/* Video Title Input */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-slate-300">Headline Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cute Mushroom Bead Pattern"
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Download Video Action Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-rose-950/40 border border-indigo-500/30 flex flex-col gap-3 mt-auto">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-white text-xs">Ready to share on social media</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Downloads high-bitrate WebM video formatted with seamless loop and crisp pixel craft simulation.
              </p>

              <button
                onClick={handleDownloadVideo}
                disabled={isRecording}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 transition active:scale-95 disabled:opacity-50"
              >
                {isRecording ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Video ({recordProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Download Timelapse Video (.webm)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
