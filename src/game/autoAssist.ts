/**
 * Trợ lực tự động: game tự ra chiêu / thả tim theo nhịp, để trận đấu không bị đứng khi phòng vắng quà.
 * Đây là hiệu ứng của chính game ("Phật Tổ trợ lực"), không gắn tên người xem nào và không tính vào
 * tổng tim / bảng đóng góp, nên không bị nhầm thành quà hay tim thật trên live.
 *
 * Lưu trong localStorage; đổi ở cửa sổ bảng điều khiển riêng thì cửa sổ sân khấu cũng đổi theo.
 */

export interface AutoSettings {
  /** tự tung chiêu ngẫu nhiên */
  skills: boolean;
  /** tự thả tim (nạp năng lượng cho sư phụ hồi máu) */
  hearts: boolean;
  /** tự hợp kích định kỳ */
  combo: boolean;
  /** khoảng cách giữa hai lần, giây */
  minSec: number;
  maxSec: number;
  /** hợp kích mỗi bao nhiêu phút */
  comboMin: number;
}

const KEY = 'tk-auto';
export const DEFAULT_AUTO: AutoSettings = { skills: true, hearts: true, combo: true, minSec: 10, maxSec: 20, comboMin: 10 };

function load(): AutoSettings {
  try {
    return { ...DEFAULT_AUTO, ...(JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<AutoSettings>) };
  } catch {
    return { ...DEFAULT_AUTO };
  }
}

class AutoAssist {
  settings = load();
  private listeners = new Set<() => void>();

  constructor() {
    if (typeof window === 'undefined') return;
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY) return;
      this.settings = load();
      this.emit();
    });
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

  set(patch: Partial<AutoSettings>) {
    const s = { ...this.settings, ...patch };
    s.minSec = Math.max(3, s.minSec);
    s.maxSec = Math.max(s.minSec, s.maxSec);
    s.comboMin = Math.max(1, s.comboMin);
    this.settings = s;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* bỏ qua */
    }
    this.emit();
  }

  /** số giây chờ ngẫu nhiên tới lần trợ lực kế tiếp */
  nextDelay() {
    const { minSec, maxSec } = this.settings;
    return minSec + Math.random() * (maxSec - minSec);
  }
}

export const autoAssist = new AutoAssist();
