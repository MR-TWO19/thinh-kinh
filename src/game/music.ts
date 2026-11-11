import { sfx } from './audio';

/**
 * Nhạc nền tự tổng hợp bằng Web Audio. Không dùng file nhạc, nên không có vấn đề bản quyền.
 * Âm giai ngũ cung (Rê – Mi – Fa# – La – Si), gồm đàn tranh gảy, sáo, trống taiko và mõ.
 * Mỗi cảnh một kiểu nhạc:
 *   walk   đi đường: êm, có sáo
 *   battle đánh boss: trống dồn
 *   rage   boss nổi giận: nhanh và dày hơn
 *   wiped  cả đội gục: chậm, buồn
 *   calm   tới chùa Như Lai: chuông chùa
 */
export type Mood = 'walk' | 'battle' | 'rage' | 'wiped' | 'calm' | 'off';

const PENTA = [0, 2, 4, 7, 9];
const BASE = 146.83; // Rê 3
/** bậc trong âm giai ngũ cung → tần số (bậc 5 = Rê 4, bậc 10 = Rê 5) */
function deg(d: number) {
  const o = Math.floor(d / 5);
  const i = ((d % 5) + 5) % 5;
  return BASE * Math.pow(2, o + PENTA[i] / 12);
}

type Ctx = { ctx: AudioContext; out: GainNode; noise: AudioBuffer };

// ---------------- nhạc cụ ----------------

function pluck(c: Ctx, freq: number, t: number, vol: number, dur = 1.2) {
  const { ctx, out } = c;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(4200, t);
  lp.frequency.exponentialRampToValueAtTime(700, t + dur * 0.6);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  lp.connect(g).connect(out);
  for (const [mul, type, k] of [
    [1, 'triangle', 1],
    [2, 'sine', 0.35],
    [3.01, 'sine', 0.12],
  ] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    // đàn tranh: nốt hơi trượt lên lúc gảy
    o.frequency.setValueAtTime(freq * mul * 0.985, t);
    o.frequency.exponentialRampToValueAtTime(freq * mul, t + 0.04);
    const og = ctx.createGain();
    og.gain.value = k;
    o.connect(og).connect(lp);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

function flute(c: Ctx, freq: number, t: number, dur: number, vol: number) {
  const { ctx, out } = c;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, t);
  // rung (vibrato) vào sau một chút như người thổi sáo
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 5.2;
  const lg = ctx.createGain();
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(freq * 0.012, t + Math.min(0.35, dur * 0.5));
  lfo.connect(lg).connect(o.frequency);
  const g = ctx.createGain();
  const rel = Math.min(0.18, dur * 0.3);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.07);
  g.gain.setValueAtTime(vol, t + dur - rel);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  const o2 = ctx.createOscillator();
  o2.type = 'triangle';
  o2.frequency.value = freq * 2;
  const g2 = ctx.createGain();
  g2.gain.value = 0.08;
  o2.connect(g2).connect(g);
  o.connect(g).connect(out);
  // tiếng hơi thổi
  const n = ctx.createBufferSource();
  n.buffer = c.noise;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = freq * 2;
  bp.Q.value = 2;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vol * 0.25, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  n.connect(bp).connect(ng).connect(out);
  for (const x of [o, o2, lfo]) {
    x.start(t);
    x.stop(t + dur + 0.05);
  }
  n.start(t);
  n.stop(t + 0.3);
}

function drone(c: Ctx, freq: number, t: number, dur: number, vol: number) {
  const { ctx, out } = c;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  g.connect(out);
  for (const f of [freq, freq * 1.5, freq * 1.003]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.05);
  }
}

function taiko(c: Ctx, t: number, vol: number, pitch = 1) {
  const { ctx, out } = c;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(120 * pitch, t);
  o.frequency.exponentialRampToValueAtTime(48 * pitch, t + 0.28);
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.6);
  const n = ctx.createBufferSource();
  n.buffer = c.noise;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 900;
  const ng = ctx.createGain();
  ng.gain.setValueAtTime(vol * 0.5, t);
  ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  n.connect(lp).connect(ng).connect(out);
  n.start(t);
  n.stop(t + 0.1);
}

function wood(c: Ctx, t: number, vol: number, high = false) {
  const { ctx, out } = c;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = high ? 1650 : 1100;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.08);
}

function cymbal(c: Ctx, t: number, vol: number) {
  const { ctx, out } = c;
  const n = ctx.createBufferSource();
  n.buffer = c.noise;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
  n.connect(hp).connect(g).connect(out);
  n.start(t);
  n.stop(t + 0.6);
}

function bell(c: Ctx, freq: number, t: number, vol: number) {
  const { ctx, out } = c;
  for (const [mul, k, d] of [
    [1, 1, 3],
    [2.76, 0.35, 1.6],
    [5.4, 0.15, 0.8],
  ]) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * mul;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol * k, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(t + d + 0.05);
  }
}

// ---------------- bản nhạc ----------------

interface Song {
  bpm: number;
  /** số nốt móc đơn trong một vòng lặp */
  steps: number;
  play(c: Ctx, step: number, t: number, beat: number): void;
}

/** giai điệu sáo: [bước, bậc, độ dài (bước)] */
type Line = [number, number, number][];

const WALK_MELODY: Line = [
  [0, 10, 3], [3, 11, 1], [4, 12, 4],
  [8, 13, 2], [10, 12, 2], [12, 11, 4],
  [16, 10, 2], [18, 8, 2], [20, 10, 4],
  [24, 9, 6],
  [32, 12, 3], [35, 13, 1], [36, 15, 4],
  [40, 14, 2], [42, 13, 2], [44, 12, 4],
  [48, 11, 2], [50, 12, 2], [52, 10, 2], [54, 8, 2],
  [56, 10, 8],
];
const WALK_ROOTS = [0, 4, 3, 2, 0, 4, 3, 0];
const ARP = [5, 7, 8, 10, 8, 7, 5, 7];

const SONGS: Record<Exclude<Mood, 'off'>, Song> = {
  walk: {
    bpm: 78,
    steps: 64,
    play(c, s, t, beat) {
      const bar = Math.floor(s / 8);
      const pos = s % 8;
      const root = WALK_ROOTS[bar];
      if (pos === 0) {
        pluck(c, deg(root), t, 0.11, 2.4);
        drone(c, deg(root - 5), t, beat * 4.2, 0.035);
      }
      pluck(c, deg(root + ARP[pos]), t, pos % 2 ? 0.035 : 0.05, 0.9);
      for (const [st, d, len] of WALK_MELODY) if (st === s) flute(c, deg(d), t, len * beat * 0.5 * 0.95, 0.06);
      if (pos === 0 || pos === 4) wood(c, t, 0.05);
      if (pos === 0 && bar % 2 === 0) taiko(c, t, 0.12, 0.9);
    },
  },
  battle: {
    bpm: 138,
    steps: 32,
    play(c, s, t) {
      const bar = Math.floor(s / 8);
      const pos = s % 8;
      const root = [0, 0, 3, 4][bar];
      if (pos === 0 || pos === 3 || pos === 6) pluck(c, deg(root - 5), t, 0.13, 0.5);
      pluck(c, deg(root + ARP[pos] + 5), t, pos % 2 ? 0.03 : 0.045, 0.35);
      const fill = bar === 3 && pos >= 4;
      if (pos === 0 || pos === 3 || pos === 6 || fill) taiko(c, t, fill ? 0.2 : 0.26, fill ? 1.25 : 1);
      if (pos === 4 && !fill) taiko(c, t, 0.1, 1.5);
      if (pos % 2 === 1) wood(c, t, 0.035, true);
      if (s === 0 || s === 16) cymbal(c, t, 0.05);
    },
  },
  rage: {
    bpm: 152,
    steps: 32,
    play(c, s, t, beat) {
      const bar = Math.floor(s / 8);
      const pos = s % 8;
      const root = [0, 4, 3, 2][bar];
      pluck(c, deg(root - 5), t, pos % 2 ? 0.07 : 0.13, 0.35);
      pluck(c, deg(root + ARP[(pos * 3) % 8] + 5), t, 0.045, 0.3);
      taiko(c, t, pos % 2 ? 0.12 : 0.27, pos === 0 ? 0.85 : 1 + (pos % 3) * 0.15);
      wood(c, t, 0.04, true);
      if (pos === 0) cymbal(c, t, 0.07);
      // tiếng sáo gắt dồn dập
      const LEAD: Line = [[0, 10, 2], [3, 12, 1], [4, 13, 2], [6, 12, 2]];
      for (const [st, d, len] of LEAD) if (st === pos && bar % 2 === 1) flute(c, deg(d + root), t, len * beat * 0.5 * 0.9, 0.05);
    },
  },
  wiped: {
    bpm: 58,
    steps: 32,
    play(c, s, t, beat) {
      const bar = Math.floor(s / 8);
      const pos = s % 8;
      const root = [4, 3, 2, 0][bar];
      if (pos === 0) {
        drone(c, deg(root - 5), t, beat * 4.2, 0.04);
        pluck(c, deg(root + 5), t, 0.07, 2.5);
      }
      if (pos === 4) pluck(c, deg(root + 7), t, 0.04, 2);
      if (pos === 2 && bar % 2 === 0) flute(c, deg(root + 8), t, beat * 2.5, 0.04);
      if (pos === 0) taiko(c, t, 0.08, 0.7);
    },
  },
  calm: {
    bpm: 66,
    steps: 32,
    play(c, s, t, beat) {
      const bar = Math.floor(s / 8);
      const pos = s % 8;
      if (pos === 0) {
        bell(c, deg([5, 7, 8, 10][bar]), t, 0.08);
        drone(c, deg(-5), t, beat * 4.2, 0.03);
      }
      pluck(c, deg(ARP[pos] + 5), t, 0.03, 1.2);
      const LINE: Line = [[0, 12, 6], [8, 13, 6], [16, 15, 7], [24, 12, 8]];
      for (const [st, d, len] of LINE) if (st === s) flute(c, deg(d), t, len * beat * 0.5 * 0.95, 0.045);
    },
  },
};

// ---------------- bộ phát ----------------

const KEY = 'tk-music';
const VOL = 0.55;

class Music {
  enabled = true;
  private mood: Mood = 'off';
  private bus: GainNode | null = null;
  private graph: Ctx | null = null;
  private step = 0;
  private nextAt = 0;
  private timer: ReturnType<typeof setInterval> | null = null;
  private ducked = false;
  private voiceDucked = false;

  constructor() {
    try {
      this.enabled = localStorage.getItem(KEY) !== '0';
    } catch {
      /* bỏ qua */
    }
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    try {
      localStorage.setItem(KEY, on ? '1' : '0');
    } catch {
      /* bỏ qua */
    }
    this.applyVolume(0.3);
  }

  /** hạ nhỏ nhạc khi có hiệu ứng lớn (hợp kích) */
  duck(on: boolean) {
    if (on === this.ducked) return;
    this.ducked = on;
    this.applyVolume(0.25);
  }

  /** hạ nhạc khi giọng đọc đang nói */
  voiceDuck(on: boolean) {
    if (on === this.voiceDucked) return;
    this.voiceDucked = on;
    this.applyVolume(0.25);
  }

  setMood(m: Mood) {
    if (m === this.mood) return;
    this.mood = m;
    this.step = 0;
    if (this.graph) this.nextAt = Math.max(this.graph.ctx.currentTime + 0.05, this.nextAt);
    this.start();
  }

  private applyVolume(ramp: number) {
    if (!this.bus || !this.graph) return;
    const v = this.enabled ? (this.ducked ? VOL * 0.25 : this.voiceDucked ? VOL * 0.35 : VOL) : 0;
    const now = this.graph.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(now);
    this.bus.gain.setTargetAtTime(v, now, ramp / 3);
  }

  private start() {
    if (this.timer) return;
    // bước lặp 100 ms, lên lịch trước 0,6 s để nhạc không bị vấp khi trình duyệt bận
    this.timer = setInterval(() => this.pump(), 100);
  }

  private pump() {
    if (!this.graph) {
      const g = sfx.graph();
      if (!g) return;
      this.bus = g.ctx.createGain();
      this.bus.gain.value = 0;
      this.bus.connect(g.master);
      this.graph = { ctx: g.ctx, out: this.bus, noise: g.noise };
      this.applyVolume(1.5);
    }
    const { ctx } = this.graph;
    // chưa được phép phát âm thanh, nhạc đang tắt hoặc tắt tiếng: không lên lịch nốt nào
    if (ctx.state !== 'running' || !this.enabled || sfx.muted || this.mood === 'off') {
      this.nextAt = ctx.currentTime + 0.05;
      return;
    }
    const song = SONGS[this.mood];
    const beat = 60 / song.bpm;
    const stepDur = beat / 2;
    if (this.nextAt < ctx.currentTime) this.nextAt = ctx.currentTime + 0.05;
    while (this.nextAt < ctx.currentTime + 0.6) {
      song.play(this.graph, this.step % song.steps, this.nextAt, beat);
      this.step += 1;
      this.nextAt += stepDur;
    }
  }
}

export const music = new Music();
