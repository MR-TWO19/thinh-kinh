/**
 * Âm thanh tổng hợp bằng Web Audio (không dùng file âm thanh có bản quyền).
 * Trình duyệt chỉ cho phát âm thanh sau khi người dùng click/nhấn phím lần đầu.
 */
class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  muted = false;

  constructor() {
    try {
      this.muted = localStorage.getItem('tk-muted') === '1';
    } catch {
      /* ignore */
    }
    const unlock = () => {
      this.ensure();
      this.ctx?.resume();
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  setMuted(m: boolean) {
    this.muted = m;
    try {
      localStorage.setItem('tk-muted', m ? '1' : '0');
    } catch {
      /* ignore */
    }
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.5;
    this.master.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 0.6;
    this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return this.ctx;
  }

  /** cho nhạc nền dùng chung AudioContext và nút master (tắt tiếng là tắt cả nhạc) */
  graph(): { ctx: AudioContext; master: GainNode; noise: AudioBuffer } | null {
    const ctx = this.ensure();
    if (!ctx || !this.master || !this.noiseBuf) return null;
    return { ctx, master: this.master, noise: this.noiseBuf };
  }

  private ready(): AudioContext | null {
    if (this.muted) return null;
    const ctx = this.ensure();
    if (!ctx || ctx.state !== 'running') return null;
    return ctx;
  }

  private tone(freq: number, dur: number, opts: { type?: OscillatorType; vol?: number; delay?: number; slide?: number } = {}) {
    const ctx = this.ready();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * opts.slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(opts.vol ?? 0.3, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(dur: number, opts: { vol?: number; freq?: number; delay?: number; q?: number } = {}) {
    const ctx = this.ready();
    if (!ctx || !this.master || !this.noiseBuf) return;
    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = opts.freq ?? 1200;
    f.Q.value = opts.q ?? 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(opts.vol ?? 0.4, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
  }

  join() {
    this.tone(880, 0.18, { type: 'triangle', vol: 0.18 });
    this.tone(1320, 0.25, { type: 'triangle', vol: 0.15, delay: 0.08 });
  }
  like() {
    this.tone(1200 + Math.random() * 300, 0.08, { type: 'sine', vol: 0.06 });
  }
  hit() {
    this.noise(0.12, { vol: 0.35, freq: 1800 });
    this.tone(220, 0.12, { type: 'square', vol: 0.08, slide: 0.5 });
  }
  heavy() {
    this.noise(0.5, { vol: 0.6, freq: 300, q: 0.5 });
    this.tone(90, 0.5, { type: 'sawtooth', vol: 0.25, slide: 0.4 });
  }
  ultimate() {
    this.heavy();
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.3, { type: 'square', vol: 0.08, delay: i * 0.07 }));
  }
  shield() {
    this.tone(330, 0.6, { type: 'sine', vol: 0.2, slide: 2 });
    this.tone(495, 0.6, { type: 'sine', vol: 0.12, slide: 2, delay: 0.05 });
  }
  heal() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => this.tone(f, 0.5, { type: 'sine', vol: 0.14, delay: i * 0.09 }));
  }
  gift(tier: number) {
    const base = [660, 740, 880, 990, 1175][tier - 1] ?? 660;
    this.tone(base, 0.2, { type: 'triangle', vol: 0.2 });
    this.tone(base * 1.5, 0.3, { type: 'triangle', vol: 0.16, delay: 0.1 });
  }
  bossAttack() {
    this.tone(160, 0.35, { type: 'sawtooth', vol: 0.15, slide: 0.5 });
    this.noise(0.25, { vol: 0.2, freq: 600, delay: 0.05 });
  }
  hurt() {
    this.tone(300, 0.15, { type: 'square', vol: 0.1, slide: 0.6 });
  }
  alarm() {
    this.tone(880, 0.16, { type: 'square', vol: 0.1 });
    this.tone(660, 0.16, { type: 'square', vol: 0.1, delay: 0.2 });
  }
  victory() {
    [523, 659, 784, 1046, 784, 1046].forEach((f, i) =>
      this.tone(f, 0.35, { type: 'triangle', vol: 0.18, delay: i * 0.13 }),
    );
  }
  gong() {
    this.tone(110, 2.2, { type: 'sine', vol: 0.35, slide: 0.95 });
    this.tone(220, 1.6, { type: 'sine', vol: 0.12, slide: 0.97 });
    this.noise(0.4, { vol: 0.15, freq: 400 });
  }
  defeat() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.45, { type: 'triangle', vol: 0.16, delay: i * 0.18 }));
  }
}

export const sfx = new Sfx();
