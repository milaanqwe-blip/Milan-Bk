import { ElementType } from './types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  private playTone(
    freq: number,
    endFreq: number,
    duration: number,
    type: OscillatorType = 'triangle',
    gainVal = 0.08,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, endFreq), now + duration);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(gainVal, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  public playSlash() {
    this.playTone(320, 110, 0.14, 'sawtooth', 0.06);
  }

  public playBow() {
    this.playTone(540, 220, 0.11, 'triangle', 0.06);
  }

  public playElement(el: ElementType | 'necrotic' | 'physical') {
    switch (el) {
      case 'fire':
        this.playTone(260, 90, 0.2, 'sawtooth', 0.065);
        break;
      case 'water':
        this.playTone(580, 340, 0.18, 'sine', 0.07);
        break;
      case 'lightning':
        this.playTone(960, 240, 0.12, 'square', 0.045);
        break;
      case 'wind':
        this.playTone(420, 740, 0.18, 'sine', 0.055);
        break;
      case 'earth':
        this.playTone(145, 55, 0.22, 'triangle', 0.09);
        break;
      case 'necrotic':
        this.playTone(230, 145, 0.24, 'sawtooth', 0.055);
        this.playTone(460, 310, 0.2, 'sine', 0.04, 0.04);
        break;
      default:
        this.playSlash();
    }
  }

  public playHit(heavy = false) {
    this.playTone(heavy ? 130 : 190, 55, heavy ? 0.14 : 0.08, 'triangle', heavy ? 0.09 : 0.05);
  }

  public playCoin() {
    this.playTone(980, 1320, 0.09, 'sine', 0.05);
    this.playTone(1320, 1760, 0.12, 'sine', 0.05, 0.06);
  }

  public playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((n, idx) => {
      this.playTone(n, n * 1.02, 0.24, 'triangle', 0.07, idx * 0.08);
    });
  }

  public playQuestComplete() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, idx) => {
      this.playTone(n, n, 0.2, 'sine', 0.065, idx * 0.07);
    });
  }

  public playDangerAlert() {
    this.playTone(220, 180, 0.18, 'sawtooth', 0.05);
  }
}

export const sound = new SoundEngine();
