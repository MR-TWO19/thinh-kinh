/**
 * Toàn bộ số liệu cân bằng game nằm ở đây.
 * Thêm kiếp nạn mới = thêm một phần tử vào STAGES (và nếu muốn, một kiểu vẽ boss mới trong render.ts).
 */

export type HeroId = 'wukong' | 'bajie' | 'sha';
export type SkillId =
  | 'wk_staff'
  | 'wk_ultimate'
  | 'bj_quake'
  | 'bj_slam'
  | 'st_shield'
  | 'st_crescent'
  | 'tg_seal'
  | 'team_combo';
/** ai ra chiêu: một đệ tử, Đường Tăng, hoặc cả đội */
export type Caster = HeroId | 'tang' | 'team';

export interface HeroDef {
  id: HeroId;
  name: string;
  role: string;
  maxHp: number;
  color: string;
  /** vị trí đứng (toạ độ logic 720x1280) */
  x: number;
}

export const HEROES: HeroDef[] = [
  { id: 'wukong', name: 'Tôn Ngộ Không', role: 'Đơn công', maxHp: 300, color: '#ffb020', x: 395 },
  { id: 'bajie', name: 'Trư Bát Giới', role: 'Diện rộng', maxHp: 380, color: '#ff7aa8', x: 290 },
  { id: 'sha', name: 'Sa Tăng', role: 'Hộ vệ', maxHp: 340, color: '#4fb6ff', x: 190 },
];

export const TANG = {
  name: 'Đường Tăng',
  x: 95,
  energyMax: 100,
  energyPerLike: 2,
  /** % máu tối đa được hồi khi thanh năng lượng đầy */
  healRatio: 0.4,
  /** máu khi hồi sinh đệ tử bị hạ */
  reviveRatio: 0.5,
};

export interface GiftDef {
  id: string;
  name: string;
  icon: string;
  /** giá trị quy đổi để chia mức sức mạnh */
  coins: number;
  tier: 1 | 2 | 3 | 4 | 5;
  skill: SkillId;
  color: string;
}

/**
 * Bảng quà -> chiêu. Khi nối nguồn livestream được phép, chỉ cần ánh xạ mã quà thật về các id dưới đây
 * (hoặc ánh xạ theo giá trị: quà rẻ -> tier 1, quà đắt -> tier 4).
 */
export const GIFTS: GiftDef[] = [
  { id: 'lotus', name: 'Hoa Sen', icon: '🪷', coins: 1, tier: 1, skill: 'wk_staff', color: '#ffb020' },
  { id: 'bell', name: 'Chuông Đồng', icon: '🔔', coins: 5, tier: 2, skill: 'st_shield', color: '#4fb6ff' },
  { id: 'peach', name: 'Đào Tiên', icon: '🍑', coins: 10, tier: 3, skill: 'bj_quake', color: '#ff7aa8' },
  { id: 'cloud', name: 'Cân Đẩu Vân', icon: '☁️', coins: 99, tier: 4, skill: 'wk_ultimate', color: '#ffe066' },
  { id: 'beads', name: 'Tràng Hạt', icon: '📿', coins: 3, tier: 1, skill: 'st_crescent', color: '#7fd4ff' },
  { id: 'bun', name: 'Bánh Bao', icon: '🥟', coins: 20, tier: 3, skill: 'bj_slam', color: '#ff9ec4' },
  { id: 'scroll', name: 'Kinh Thư', icon: '📜', coins: 30, tier: 3, skill: 'tg_seal', color: '#ffd24a' },
  /** quà lớn nhất: cả 4 thầy trò hợp kích, hạ boss ngay lập tức */
  { id: 'lotus_throne', name: 'Liên Đài Phật Quang', icon: '🌟', coins: 2000, tier: 5, skill: 'team_combo', color: '#fff2a8' },
];

/**
 * Ánh xạ quà TikTok thật (theo giá xu) về quà trong game: chọn quà đắt nhất có giá <= giá quà thật.
 * Ví dụ: Hoa hồng 1 xu → Hoa Sen; quà 99 xu → Cân Đẩu Vân; quà từ 500 xu → Hợp Kích.
 */
export function giftForCoins(coins: number): GiftDef {
  const sorted = [...GIFTS].sort((a, b) => a.coins - b.coins);
  let best = sorted[0];
  for (const g of sorted) if (coins >= g.coins) best = g;
  return best;
}

export interface SkillDef {
  id: SkillId;
  hero: Caster;
  name: string;
  /** tên ngắn hiện trên thẻ nhân vật */
  short: string;
  /** câu nhân vật nhắc người xem khi phòng im; {qua} = tên + giá quà, ví dụ "Rose (1 xu)" */
  nudge: string;
  /** sát thương lên boss mỗi lần kích hoạt */
  damage: number;
}

/**
 * Mỗi nhân vật có 2 chiêu:
 * - Đường Tăng: Phật Quang Phổ Chiếu (hồi máu, nạp bằng tim) · Kim Cang Chú (định thân boss)
 * - Ngộ Không: Gậy Như Ý · Thân Ngoại Thân
 * - Bát Giới: Địa Chấn · Thiên Bồng Giáng Thế
 * - Sa Tăng: Kim Cang Hộ Thể · Nguyệt Nha Phi Trảm
 * Và chiêu đặc biệt team_combo: cả 4 thầy trò hợp kích.
 */
export const SKILLS: Record<SkillId, SkillDef> = {
  wk_staff: { id: 'wk_staff', hero: 'wukong', name: 'Gậy Như Ý', short: 'Gậy', damage: 45, nudge: 'Tặng {qua}, lão Tôn vung Gậy Như Ý!' },
  wk_ultimate: { id: 'wk_ultimate', hero: 'wukong', name: 'Thân Ngoại Thân · Đại Náo', short: 'Phân thân', damage: 650, nudge: 'Chỉ cần {qua}, lão Tôn hoá phân thân đại náo!' },
  bj_quake: { id: 'bj_quake', hero: 'bajie', name: 'Cửu Xỉ Đinh Ba · Địa Chấn', short: 'Địa chấn', damage: 160, nudge: 'Cho lão Trư {qua}, ta nện Địa Chấn!' },
  bj_slam: { id: 'bj_slam', hero: 'bajie', name: 'Thiên Bồng Giáng Thế', short: 'Giáng thế', damage: 300, nudge: 'Tặng {qua}, lão Trư từ trời giáng xuống đầu yêu quái!' },
  st_shield: { id: 'st_shield', hero: 'sha', name: 'Kim Cang Hộ Thể', short: 'Khiên', damage: 0, nudge: 'Tặng {qua}, Sa Tăng dựng khiên che cả đội!' },
  st_crescent: { id: 'st_crescent', hero: 'sha', name: 'Nguyệt Nha Phi Trảm', short: 'Trăng khuyết', damage: 70, nudge: 'Tặng {qua}, Sa Tăng phóng trăng khuyết!' },
  tg_seal: { id: 'tg_seal', hero: 'tang', name: 'Kim Cang Chú · Định Thân', short: 'Định thân', damage: 0, nudge: 'Tặng {qua}, bần tăng niệm chú trói yêu quái!' },
  team_combo: { id: 'team_combo', hero: 'team', name: 'Thầy Trò Hợp Kích · Tây Thiên Diệt Ma', short: 'Hợp kích', damage: 0, nudge: 'Tặng {qua} hoặc cả phòng góp đủ xu: thầy trò hợp kích!' },
};

/** Đường Tăng định thân boss: boss ngừng đánh và nhận thêm sát thương */
export const SEAL = {
  duration: 6,
  maxDuration: 18,
  /** hệ số sát thương boss phải nhận khi bị định thân */
  damageTaken: 1.5,
};

/** quà gắn với một chiêu */
export function giftForSkill(skill: SkillId): GiftDef {
  return GIFTS.find((g) => g.skill === skill)!;
}

/** số xu cả phòng cần góp để tự kích hoạt Hợp Kích (bằng giá quà Hợp Kích) */
export const COMBO_GOAL = GIFTS.find((g) => g.skill === 'team_combo')!.coins;

/** câu nhắc thả tim của Đường Tăng */
export const HEART_NUDGE = 'Thả tim để bần tăng hồi máu cho cả đội!';
export const WIPED_NUDGE = 'Các đồ đệ gục cả rồi! Thả tim hồi sinh giúp bần tăng!';

/** tên hiển thị của người ra chiêu */
export function casterName(c: Caster): string {
  if (c === 'tang') return TANG.name;
  if (c === 'team') return 'Cả đoàn';
  return HEROES.find((h) => h.id === c)!.name;
}

export const SHIELD = {
  /** giây khiên tồn tại mỗi lần kích hoạt */
  duration: 10,
  maxDuration: 30,
  /** phần sát thương bị chặn */
  reduction: 0.7,
};

export const AUTO_ATTACK = {
  /** đệ tử tự đánh nhẹ để trận đấu luôn sinh động; sát thương chính đến từ quà */
  interval: 2.6,
  damage: [3, 7] as [number, number],
};

export type BossKind =
  | 'bone_demon'
  | 'bull_king'
  | 'wind_weasel'
  | 'fire_child'
  | 'river_fish'
  | 'horned_king'
  | 'spider_queen'
  | 'yellow_brow'
  | 'six_ear'
  | 'golden_roc'
  | 'tiger_demon'
  | 'dragon_king'
  | 'bandit'
  | 'taoist';

export interface BossDef {
  kind: BossKind;
  name: string;
  title: string;
  /** đổi màu hình boss (độ hue-rotate) để các boss cùng dáng trông khác nhau */
  hue?: number;
  /** biểu tượng trên thanh máu */
  icon: string;
  /** tên chiêu đánh cả đội */
  aoeName: string;
  /** kiểu đạn đánh thường */
  projectile: 'bone' | 'fire' | 'orb';
  /** màu đạn kiểu 'orb' */
  projColor?: string;
  /** kiểu lâu la được triệu hồi */
  minionKind: 'skeleton' | 'imp' | 'blob' | 'spiderling';
  /** màu mảnh vụn khi boss / lâu la bị hạ */
  debris: [string, string];
  maxHp: number;
  /** giây giữa 2 đòn đánh (giảm dần khi nổi giận) */
  attackInterval: number;
  damage: [number, number];
  /** cứ N đòn thì tung chiêu đánh cả đội */
  aoeEvery: number;
  aoeDamage: number;
  /** cứ N đòn thì gọi lâu la */
  summonEvery: number;
  minionHp: number;
  minionDamage: number;
  maxMinions: number;
}

export type AmbientKind = 'embers' | 'snow' | 'sand' | 'bubbles' | 'petals' | 'sparkles';

export interface StageDef {
  id: string;
  index: number;
  name: string;
  subtitle: string;
  palette: {
    skyTop: string;
    skyBottom: string;
    mountainFar: string;
    mountainNear: string;
    ground: string;
    road: string;
    accent: string;
    /** màu trăng / mặt trời */
    moon: string;
  };
  /** hiệu ứng không khí */
  ambient?: { kind: AmbientKind; colors: string[] };
  boss: BossDef;
}

/** Danh sách 81 kiếp nạn nằm trong journey.ts */
export { STAGES } from './journey';

export const TIMING = {
  walk: 4.5, // giây đi bộ trước mỗi kiếp nạn
  intro: 2.6, // giây giới thiệu boss
  victory: 3.5, // giây ăn mừng
  finalWalk: 5, // giây đi bộ đến chùa
};

/** ngưỡng cảnh báo sắp hết máu (tổng máu đội) */
export const LOW_HP_RATIO = 0.3;
