/**
 * Fully procedural audio — no asset files. A small Web Audio synth provides
 * comic-flavored SFX (page flips, cash-register dings, boost roars, cartoon
 * pops) plus a looping surf-rock-ish instrumental: walking bass, reverb-y
 * twang lead, and a noise-snare backbeat. Created lazily on first gesture.
 */

import { LS_KEYS } from '../constants';

type Osc = OscillatorType;

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private muted: boolean;
  private musicTimer: number | null = null;
  private step = 0;

  constructor() {
    this.muted = localStorage.getItem(LS_KEYS.mute) === '1';
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);

    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.32;
    this.musicGain.connect(this.master);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.9;
    this.sfxGain.connect(this.master);
    return this.ctx;
  }

  resume(): void {
    const c = this.ensure();
    if (c && c.state === 'suspended') void c.resume();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMuted(m: boolean): void {
    this.muted = m;
    localStorage.setItem(LS_KEYS.mute, m ? '1' : '0');
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // ---- primitives ----
  private tone(opts: { freq: number; freq2?: number; dur?: number; type?: Osc; peak?: number; when?: number; dest?: GainNode }): void {
    const c = this.ensure();
    if (!c || !this.sfxGain) return;
    const dest = opts.dest ?? this.sfxGain;
    const t0 = c.currentTime + (opts.when ?? 0);
    const dur = opts.dur ?? 0.12;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = opts.type ?? 'square';
    o.frequency.setValueAtTime(opts.freq, t0);
    if (opts.freq2 != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.freq2), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.peak ?? 0.4, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(dest);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }

  private noise(opts: { dur?: number; peak?: number; when?: number; hp?: number; lp?: number; sweepLp?: number; dest?: GainNode }): void {
    const c = this.ensure();
    if (!c || !this.sfxGain) return;
    const dest = opts.dest ?? this.sfxGain;
    const t0 = c.currentTime + (opts.when ?? 0);
    const dur = opts.dur ?? 0.2;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    let node: AudioNode = src;
    if (opts.hp) {
      const f = c.createBiquadFilter();
      f.type = 'highpass';
      f.frequency.value = opts.hp;
      node.connect(f);
      node = f;
    }
    const lpf = c.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.setValueAtTime(opts.lp ?? 8000, t0);
    if (opts.sweepLp) lpf.frequency.exponentialRampToValueAtTime(Math.max(80, opts.sweepLp), t0 + dur);
    node.connect(lpf);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.peak ?? 0.5, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    lpf.connect(g).connect(dest);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  // ---- named SFX ----
  /** Comic page flip — a quick filtered noise riffle. */
  collectComic(): void {
    this.noise({ dur: 0.12, peak: 0.35, hp: 1500, lp: 9000, sweepLp: 4000 });
    this.tone({ freq: 1200, freq2: 1700, dur: 0.08, type: 'square', peak: 0.18 });
  }

  /** Cash-register ding for rare / streak pickups. */
  ding(): void {
    this.tone({ freq: 1318.5, dur: 0.18, type: 'triangle', peak: 0.3 });
    this.tone({ freq: 1760, dur: 0.22, type: 'triangle', peak: 0.26, when: 0.05 });
    this.noise({ dur: 0.05, peak: 0.12, hp: 5000 });
  }

  boost(): void {
    this.tone({ freq: 160, freq2: 900, dur: 0.5, type: 'sawtooth', peak: 0.32 });
    this.noise({ dur: 0.5, peak: 0.3, hp: 300, lp: 6000, sweepLp: 1200 });
  }

  grailActivate(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((f, i) => this.tone({ freq: f, dur: 0.2, type: 'square', peak: 0.3, when: i * 0.06 }));
    this.noise({ dur: 0.4, peak: 0.2, hp: 3000, sweepLp: 12000, when: 0.3 });
  }

  crash(): void {
    this.tone({ freq: 500, freq2: 50, dur: 0.4, type: 'sawtooth', peak: 0.35 });
    this.noise({ dur: 0.4, peak: 0.5, hp: 150, lp: 5000, sweepLp: 300 });
  }

  pop(): void {
    this.tone({ freq: 800, freq2: 200, dur: 0.1, type: 'square', peak: 0.25 });
  }

  checkpoint(): void {
    this.tone({ freq: 660, dur: 0.1, type: 'square', peak: 0.3 });
    this.tone({ freq: 990, dur: 0.14, type: 'square', peak: 0.3, when: 0.1 });
  }

  uiBlip(): void {
    this.tone({ freq: 1200, freq2: 1700, dur: 0.05, type: 'square', peak: 0.18 });
  }

  fanfare(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => this.tone({ freq: f, dur: 0.22, type: 'square', peak: 0.3, when: i * 0.12 }));
  }

  gameOver(): void {
    const notes = [523.25, 440, 349.23, 261.63];
    notes.forEach((f, i) => this.tone({ freq: f, dur: 0.26, type: 'square', peak: 0.28, when: i * 0.2 }));
  }

  // ---- surf-rock loop ----
  // A 16-step sequencer in A minor-ish: walking bass + twangy lead + backbeat.
  private readonly bassSeq = [110, 110, 165, 110, 146.83, 146.83, 110, 82.41,
                              110, 110, 165, 196, 220, 196, 165, 146.83];
  private readonly leadSeq = [440, 0, 523.25, 0, 659.25, 587.33, 0, 440,
                              0, 523.25, 0, 659.25, 783.99, 0, 659.25, 0];

  startMusic(): void {
    const c = this.ensure();
    if (!c || this.musicTimer != null) return;
    const stepDur = 0.13; // ~115 BPM in 16ths
    const tick = () => {
      const i = this.step % 16;
      const bass = this.bassSeq[i];
      if (bass) this.tone({ freq: bass, dur: stepDur * 1.6, type: 'triangle', peak: 0.28, dest: this.musicGain ?? undefined });
      const lead = this.leadSeq[i];
      if (lead) this.tone({ freq: lead, dur: stepDur * 1.2, type: 'sawtooth', peak: 0.12, dest: this.musicGain ?? undefined });
      // Backbeat: kick on 0/8, snare on 4/12.
      if (i % 8 === 0) this.tone({ freq: 90, freq2: 45, dur: 0.14, type: 'sine', peak: 0.32, dest: this.musicGain ?? undefined });
      if (i % 8 === 4) this.noise({ dur: 0.12, peak: 0.18, hp: 1200, lp: 7000, dest: this.musicGain ?? undefined });
      this.step++;
    };
    this.musicTimer = window.setInterval(tick, stepDur * 1000);
  }

  stopMusic(): void {
    if (this.musicTimer != null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  dispose(): void {
    this.stopMusic();
    this.ctx?.close();
    this.ctx = null;
  }
}
