// Web Audio API synthesized tactile sound effects & mobile haptics (no external assets needed)

class AudioManager {
  private ctx: AudioContext | null = null;
  private isSoundEnabled: boolean = true;
  private lastPopTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pixelcraft_sound_enabled');
      this.isSoundEnabled = saved !== 'false';
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isEnabled(): boolean {
    return this.isSoundEnabled;
  }

  public setEnabled(enabled: boolean) {
    this.isSoundEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixelcraft_sound_enabled', enabled ? 'true' : 'false');
    }
  }

  public toggleSound(): boolean {
    const next = !this.isSoundEnabled;
    this.setEnabled(next);
    if (next) {
      this.playStitchSound(true);
    }
    return next;
  }

  /**
   * Plays a subtle, tactile wooden pop / stitch sound.
   * Throttled to 32ms so fast mouse/finger drags produce a smooth mechanical bubble-pop zipper effect.
   */
  public playStitchSound(isComplete: boolean = true) {
    if (!this.isSoundEnabled) return;
    const now = performance.now();
    if (now - this.lastPopTime < 32) return;
    this.lastPopTime = now;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const startTime = ctx.currentTime;
      const duration = 0.045; // 45ms crisp pop

      if (isComplete) {
        // High-pitched pleasant wood pop (420Hz -> 180Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, startTime);
        osc.frequency.exponentialRampToValueAtTime(180, startTime + duration);

        gain.gain.setValueAtTime(0.09, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      } else {
        // Subtle unmark pop (240Hz -> 140Hz)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(240, startTime);
        osc.frequency.exponentialRampToValueAtTime(140, startTime + duration);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // AudioContext policy safe catch
    }

    // Trigger subtle mobile haptic feedback if supported
    this.triggerHaptic();
  }

  /**
   * Plays a gentle 3-note celebration chime (C5 -> E5 -> G5) on pattern completion
   */
  public playCelebrationChime() {
    if (!this.isSoundEnabled) return;
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      const startTime = ctx.currentTime;

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteStart = startTime + idx * 0.12;
        const noteDuration = 0.35;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.12, noteStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + noteDuration);
      });
    } catch {
      // AudioContext policy safe catch
    }

    this.triggerHaptic(true);
  }

  public triggerHaptic(strong: boolean = false) {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(strong ? [30, 40, 60] : 10);
      } catch {
        // Ignore
      }
    }
  }
}

export const audioFeedback = new AudioManager();
