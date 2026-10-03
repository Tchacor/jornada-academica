import { loadSave, writeSave } from './save';

/** Áudio procedural (WebAudio): sem arquivos externos, leve para web. */
class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: { stop: () => void } | null = null;
  private birdTimer: number | null = null;
  private mode: 'none' | 'campus' | 'safe' = 'none';

  private ensure(): AudioContext | null {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.connect(this.ctx.destination);
    this.applyVolume();
    return this.ctx;
  }

  /** Chamar em qualquer gesto do usuário (política de autoplay dos navegadores). */
  unlock(): void {
    this.ensure();
    if (this.mode !== 'none') this.setAmbience(this.mode);
  }

  get muted(): boolean {
    return loadSave().muted;
  }

  setMuted(m: boolean): void {
    writeSave({ muted: m });
    this.applyVolume();
  }

  setVolume(v: number): void {
    writeSave({ volume: Math.max(0, Math.min(1, v)) });
    this.applyVolume();
  }

  private applyVolume(): void {
    if (!this.master || !this.ctx) return;
    const s = loadSave();
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.volume, this.ctx.currentTime, 0.05);
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, when = 0, slideTo?: number): void {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t = ctx.currentTime + when;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  click(): void { this.tone(520, 0.08, 'triangle', 0.12); }
  step(): void { this.tone(110, 0.05, 'sine', 0.05); }
  jump(): void { this.tone(300, 0.18, 'sine', 0.1, 0, 560); }
  hit(): void { this.tone(150, 0.3, 'sawtooth', 0.08, 0, 70); }
  good(): void { this.tone(660, 0.18, 'sine', 0.12); this.tone(880, 0.3, 'sine', 0.1, 0.12); }
  complete(): void { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.4, 'triangle', 0.1, i * 0.14)); }
  heartbeat(): void { this.tone(70, 0.12, 'sine', 0.2); this.tone(60, 0.14, 'sine', 0.16, 0.16); }
  inhale(dur: number): void { this.tone(260, dur, 'sine', 0.05, 0, 400); }
  exhale(dur: number): void { this.tone(400, dur, 'sine', 0.05, 0, 240); }

  setAmbience(mode: 'campus' | 'safe'): void {
    this.mode = mode;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.stopAmbience(false);

    // vento: ruído filtrado
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = mode === 'safe' ? 500 : 380;
    const wind = ctx.createGain();
    wind.gain.value = mode === 'safe' ? 0.05 : 0.03;
    noise.connect(filter).connect(wind).connect(this.master);
    noise.start();

    const nodes: (OscillatorNode | AudioBufferSourceNode)[] = [noise];
    if (mode === 'safe') {
      // acorde suave e lento
      [196, 247, 294, 392].forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.value = 0.018;
        lfo.frequency.value = 0.07 + i * 0.03;
        lg.gain.value = 0.012;
        lfo.connect(lg).connect(g.gain);
        o.connect(g).connect(this.master!);
        o.start();
        lfo.start();
        nodes.push(o, lfo);
      });
    }
    this.ambience = {
      stop: () => nodes.forEach((n) => { try { n.stop(); } catch { /* já parado */ } }),
    };

    this.birdTimer = window.setInterval(() => {
      const f = 1800 + Math.random() * 1400;
      this.tone(f, 0.12, 'sine', 0.025, 0, f * 1.3);
      if (Math.random() < 0.6) this.tone(f * 1.1, 0.1, 'sine', 0.02, 0.16, f * 1.4);
    }, mode === 'safe' ? 3200 : 6500);
  }

  private stopAmbience(resetMode = true): void {
    this.ambience?.stop();
    this.ambience = null;
    if (this.birdTimer !== null) window.clearInterval(this.birdTimer);
    this.birdTimer = null;
    if (resetMode) this.mode = 'none';
  }

  stop(): void { this.stopAmbience(); }
}

export const audio = new AudioManager();
