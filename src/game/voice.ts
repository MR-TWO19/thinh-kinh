import { music } from './music';
import { sfx } from './audio';

/**
 * Giọng đọc tiếng Việt bằng giọng có sẵn của hệ điều hành / trình duyệt (Web Speech API).
 * Tự chọn giọng tốt nhất đang có:
 *   Edge (Windows/Mac): Microsoft HoaiMy / NamMinh Online (Natural)
 *   Mac: Linh
 *   Windows: Microsoft An (cần cài gói giọng nói Tiếng Việt)
 * Không có giọng tiếng Việt nào thì im lặng, game vẫn chạy bình thường.
 *
 * Lưu ý khi live: giọng đọc phát thẳng ra loa máy, nên OBS / LIVE Studio cần thu "Desktop Audio".
 */

/** high: cắt mọi câu đang đọc · normal: xếp hàng · low: bỏ qua nếu hàng đợi đã dài · idle: chỉ đọc khi đang rảnh */
export type VoicePriority = 'high' | 'normal' | 'low' | 'idle';

const KEY_ON = 'tk-voice';
const KEY_CATS = 'tk-voice-cats';

/** các nhóm câu đọc, bật / tắt riêng trong bảng điều khiển */
export type VoiceCategory = 'thanks' | 'quiz' | 'game';
export const VOICE_CATEGORIES: { id: VoiceCategory; label: string; hint: string }[] = [
  { id: 'thanks', label: 'Cảm ơn khách tặng quà', hint: '“Cảm ơn … đã tặng …!”' },
  { id: 'quiz', label: 'Đọc câu đố', hint: 'câu hỏi, đáp án 1/2/3, còn 3 giây, kết quả' },
  { id: 'game', label: 'Thông báo trận', hint: 'boss xuất hiện, hàng phục, đoàn kiệt sức, về đích' },
];

function loadCats(): Record<VoiceCategory, boolean> {
  const cats = { thanks: true, quiz: true, game: true };
  try {
    Object.assign(cats, JSON.parse(read(KEY_CATS) ?? '{}'));
  } catch {
    /* bỏ qua */
  }
  return cats;
}
const KEY_NAME = 'tk-voice-name';

function rank(v: SpeechSynthesisVoice): number {
  const n = v.name;
  if (/HoaiMy|NamMinh/i.test(n)) return 0;
  if (/Natural|Online/i.test(n)) return 1;
  if (/Linh/i.test(n)) return 2;
  if (/\bAn\b/.test(n)) return 3;
  return 4;
}

const isVi = (v: SpeechSynthesisVoice) => /^vi([-_]|$)/i.test(v.lang);

const read = (k: string) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* bỏ qua */
  }
};

/** tên người xem đọc cho gọn: bỏ emoji, ký tự lạ, giới hạn độ dài */
export function speakableName(name: string): string {
  const clean = name
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 22);
  return clean || 'bạn';
}

class Voice {
  readonly supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  enabled = read(KEY_ON) !== '0';
  /** bật / tắt từng nhóm câu đọc */
  cats = loadCats();
  /** các giọng tiếng Việt trên máy, giọng tốt nhất đứng đầu */
  voices: SpeechSynthesisVoice[] = [];
  current: SpeechSynthesisVoice | null = null;

  private queue: { text: string; prio: VoicePriority; onDone?: () => void }[] = [];
  private activeDone: (() => void) | undefined;
  private speaking = false;
  /** câu đang đọc; sự kiện xong/lỗi của câu đã bị cắt ngang thì bỏ qua */
  private active: SpeechSynthesisUtterance | null = null;
  private listeners = new Set<() => void>();

  constructor() {
    if (!this.supported) return;
    this.load();
    speechSynthesis.addEventListener?.('voiceschanged', () => this.load());
    // chọn giọng / bật tắt ở cửa sổ bảng điều khiển riêng thì cửa sổ sân khấu cũng đổi theo
    window.addEventListener('storage', (e) => {
      if (e.key === KEY_NAME) this.load();
      if (e.key === KEY_ON) this.applyEnabled(e.newValue !== '0');
      if (e.key === KEY_CATS) {
        this.cats = loadCats();
        this.emit();
      }
    });
  }

  private load() {
    this.voices = speechSynthesis
      .getVoices()
      .filter(isVi)
      .sort((a, b) => rank(a) - rank(b));
    const wanted = read(KEY_NAME);
    this.current = this.voices.find((v) => v.name === wanted) ?? this.voices[0] ?? null;
    this.emit();
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };
  private emit() {
    this.listeners.forEach((fn) => fn());
  }

  setEnabled(on: boolean) {
    write(KEY_ON, on ? '1' : '0');
    this.applyEnabled(on);
  }
  private applyEnabled(on: boolean) {
    this.enabled = on;
    if (!on) this.stop();
    this.emit();
  }

  setCategory(cat: VoiceCategory, on: boolean) {
    this.cats = { ...this.cats, [cat]: on };
    write(KEY_CATS, JSON.stringify(this.cats));
    this.emit();
  }

  setVoice(name: string) {
    write(KEY_NAME, name);
    this.load();
  }

  stop() {
    const pending = [this.activeDone, ...this.queue.map((q) => q.onDone)];
    this.queue = [];
    this.activeDone = undefined;
    if (this.supported) speechSynthesis.cancel();
    this.speaking = false;
    this.active = null;
    music.voiceDuck(false);
    // câu bị cắt ngang cũng coi như đọc xong, để game không phải chờ mãi
    pending.forEach((fn) => fn?.());
  }

  /**
   * cat: nhóm câu đọc; bỏ trống = luôn đọc (như nút nghe thử).
   * onDone: gọi khi đọc xong (hoặc bị cắt ngang). Trả về false nếu câu không được đọc (khi đó onDone không được gọi).
   */
  say(text: string, prio: VoicePriority = 'normal', cat?: VoiceCategory, onDone?: () => void): boolean {
    if (!this.supported || !this.enabled || sfx.muted || !this.current || !text) return false;
    if (cat && !this.cats[cat]) return false;
    if (prio === 'idle' && (this.speaking || this.queue.length)) return false;
    if (prio === 'low' && this.queue.length >= 2) return false;
    if (prio === 'high') this.stop();
    this.queue.push({ text, prio, onDone });
    this.pump();
    return true;
  }

  private pump() {
    if (this.speaking) return;
    const next = this.queue.shift();
    if (!next) {
      music.voiceDuck(false);
      return;
    }
    const u = new SpeechSynthesisUtterance(next.text);
    if (this.current) u.voice = this.current;
    u.lang = this.current?.lang ?? 'vi-VN';
    u.rate = 1.05;
    u.volume = 1;
    const done = () => {
      if (this.active !== u) return;
      this.active = null;
      this.speaking = false;
      const cb = this.activeDone;
      this.activeDone = undefined;
      cb?.();
      this.pump();
    };
    u.onend = done;
    u.onerror = done;
    this.speaking = true;
    this.active = u;
    this.activeDone = next.onDone;
    music.voiceDuck(true);
    speechSynthesis.speak(u);
  }
}

export const voice = new Voice();
