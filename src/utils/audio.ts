/**
 * Web Audio API Sound Synthesizer for "تحدي الثلاثين"
 * Pure procedural sound generation without external audio files.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      const storedMute = localStorage.getItem('tahadi_sound_muted');
      if (storedMute !== null) {
        this.isMuted = JSON.parse(storedMute);
      }
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('tahadi_sound_muted', JSON.stringify(this.isMuted));
    } catch {
      // ignore
    }
    return this.isMuted;
  }

  // 1. Click button sound
  public playClick(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  }

  // 2. Correct answer fanfare
  public playCorrect(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.36);
    });
  }

  // 3. Wrong answer buzzer
  public playWrong(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  // 4. Timer tick
  public playTick(isUrgent: boolean = false): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = isUrgent ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isUrgent ? 880 : 520, ctx.currentTime);

    gain.gain.setValueAtTime(isUrgent ? 0.07 : 0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  }

  // 5. Time out buzzer
  public playTimeout(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    [196, 185, 174].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.12 + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.12);
      osc.stop(ctx.currentTime + idx * 0.12 + 0.22);
    });
  }

  // 6. Hint chime
  public playHint(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(784, ctx.currentTime); // G5
    osc.frequency.exponentialRampToValueAtTime(1174, ctx.currentTime + 0.2); // D6

    gain.gain.setValueAtTime(0.09, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }

  // 7. Victory fanfare
  public playVictory(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const chords = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.50, d: 0.4 },
      { f: 880.00, d: 0.2 },
      { f: 1046.50, d: 0.6 },
    ];

    let t = ctx.currentTime;
    chords.forEach(c => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.15, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + c.d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + c.d + 0.05);

      t += c.d;
    });
  }
  // 8. Wager activation (ascending suspense sound)
  public playWager(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const freqs = [220, 277.18, 329.63, 440, 554.37, 659.25]; // A3 to E5 suspense rise
    freqs.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime + idx * 0.07);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.07);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + idx * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.07);
      osc.stop(ctx.currentTime + idx * 0.07 + 0.2);
    });
  }

  // 9. Golden streak fanfare (+1 bonus spark)
  public playStreak(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const notes = [587.33, 739.99, 880, 1174.66, 1479.98]; // D5, F#5, A5, D6, F#6 sparkling arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.13, ctx.currentTime + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.06);
      osc.stop(ctx.currentTime + idx * 0.06 + 0.32);
    });
  }

  // 10. Consult friend pulse beat (soft rhythmic heartbeat/clock pulse)
  public playConsultFriend(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  }

  // 11. Reveal first letter magical chime
  public playRevealLetter(): void {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    [880, 1318.51, 1760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.05);

      gain.gain.setValueAtTime(0, ctx.currentTime + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + idx * 0.05 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.05);
      osc.stop(ctx.currentTime + idx * 0.05 + 0.26);
    });
  }
}

export const sounds = new SoundSystem();
