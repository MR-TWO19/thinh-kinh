import type { RealGift } from '../events/relayProtocol';
import { GIFTS, giftForCoins, type SkillId } from './config';

/**
 * Quà TikTok ưu tiên cho từng chiêu (so tên, không phân biệt hoa thường).
 * Chỉ là gợi ý: nếu phòng không có quà này, hoặc giá của nó rơi vào mốc của chiêu khác,
 * game tự chọn món rẻ nhất trong khoảng giá của chiêu đó.
 * Muốn đổi quà hiển thị cho chiêu nào thì sửa tên ở đây.
 */
export const PREFERRED_GIFTS: Record<SkillId, string[]> = {
  wk_staff: ['Rose'],
  st_shield: ['Finger Heart'],
  bj_quake: ['Rosa'],
  bj_slam: ['Perfume'],
  tg_seal: ['Doughnut'],
  st_crescent: ['Single Strike'],
  wk_ultimate: ['Hand Heart', 'Hand Hearts', 'Confetti'],
  team_combo: ['Whale Diving'], // không có thì tự chọn quà rẻ nhất từ 2000 xu trở lên
};

export type SkillGifts = Partial<Record<SkillId, RealGift>>;

/**
 * Tên tiếng Việt cho quà TikTok (TikTok chỉ trả tên tiếng Anh).
 * Quà chưa có trong bảng thì giữ tên gốc. Muốn đổi cách gọi thì sửa ở đây.
 */
export const GIFT_NAMES_VI: Record<string, string> = {
  rose: 'Hoa Hồng',
  'finger heart': 'Tim Ngón Tay',
  rosa: 'Bó Hồng',
  perfume: 'Nước Hoa',
  doughnut: 'Bánh Donut',
  'single strike': 'Cú Đấm',
  takoyaki: 'Bánh Bạch Tuộc',
  family: 'Gia Đình',
  'hand heart': 'Tim Bằng Tay',
  'hand hearts': 'Tim Bằng Tay',
  confetti: 'Pháo Giấy',
  corgi: 'Chó Corgi',
  'money gun': 'Súng Bắn Tiền',
  galaxy: 'Thiên Hà',
  'maple fireworks': 'Pháo Hoa Lá Phong',
  'whale diving': 'Cá Voi Lặn',
  'meteor shower': 'Mưa Sao Băng',
  'heart me': 'Thả Tim',
  'tiktok universe': 'Vũ Trụ TikTok',
  lion: 'Sư Tử',
  planet: 'Hành Tinh',
  'sports car': 'Siêu Xe',
  airplane: 'Máy Bay',
  'disco ball': 'Quả Cầu Disco',
  'money rain': 'Mưa Tiền',
  swan: 'Thiên Nga',
  sunglasses: 'Kính Râm',
  'i love you': 'Anh Yêu Em',
  panda: 'Gấu Trúc',
  mermaid: 'Nàng Tiên Cá',
};

/** tên quà để hiển thị / đọc: tiếng Việt nếu có, không thì tên gốc */
export function viGiftName(name: string): string {
  return GIFT_NAMES_VI[name.trim().toLowerCase()] ?? name;
}

/** chọn cho mỗi chiêu một món quà thật có giá rơi đúng vào mốc của chiêu đó */
export function pickRealGifts(catalog: RealGift[]): SkillGifts {
  const out: SkillGifts = {};
  for (const g of GIFTS) {
    const inRange = catalog.filter((x) => giftForCoins(x.coins).skill === g.skill).sort((a, b) => a.coins - b.coins);
    if (!inRange.length) continue;
    const prefs = PREFERRED_GIFTS[g.skill].map((n) => n.toLowerCase());
    const preferred = prefs.map((p) => inRange.find((x) => x.name.toLowerCase() === p)).find(Boolean);
    out[g.skill] = preferred ?? inRange[0];
  }
  return out;
}

/**
 * Bảng quà TikTok khu vực Việt Nam (tên, giá, hình) lấy từ streamtoearn.io/gifts?region=VN,
 * dùng khi chưa kết nối live lần nào để thẻ chiêu có sẵn hình quà thật.
 * Kết nối live thì bảng quà thật của phòng (relay gửi về) sẽ thay thế bảng này.
 */
export const BUILTIN_CATALOG: RealGift[] = [
  { id: 'b-rose', name: 'Rose', coins: 1, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eba3a9bb85c33e017f3648eaf88d7189~tplv-obj.webp' },
  { id: 'b-finger-heart', name: 'Finger Heart', coins: 5, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/a4c4dc437fd3a6632aba149769491f49.png~tplv-obj.webp' },
  { id: 'b-rosa', name: 'Rosa', coins: 10, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/eb77ead5c3abb6da6034d3cf6cfeb438~tplv-obj.webp' },
  { id: 'b-perfume', name: 'Perfume', coins: 20, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/20b8f61246c7b6032777bb81bf4ee055~tplv-obj.webp' },
  { id: 'b-doughnut', name: 'Doughnut', coins: 30, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/4e7ad6bdf0a1d860c538f38026d4e812~tplv-obj.webp' },
  { id: 'b-single-strike', name: 'Single Strike', coins: 70, image: 'https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b2aed3cd741688ea0d8a86363604bcbb.png~tplv-obj.webp' },
  { id: 'b-takoyaki', name: 'Takoyaki', coins: 88, image: 'https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/b0d9f32b9d4c04afbb0267dcb5b576fa.png~tplv-obj.webp' },
  { id: 'b-family', name: 'Family', coins: 90, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/8821932e2d3fe78e9af0bcf785ca1759.png~tplv-obj.webp' },
  { id: 'b-hand-heart', name: 'Hand Heart', coins: 100, image: 'https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/374dfe46d5b09ce1db19be06202d34f5.png~tplv-obj.webp' },
  { id: 'b-confetti', name: 'Confetti', coins: 100, image: 'https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/472bf660b0804bb37f616d173edb8a9d.png~tplv-obj.webp' },
  { id: 'b-corgi', name: 'Corgi', coins: 299, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/148eef0884fdb12058d1c6897d1e02b9~tplv-obj.webp' },
  { id: 'b-money-gun', name: 'Money Gun', coins: 500, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/e0589e95a2b41970f0f30f6202f5fce6~tplv-obj.webp' },
  { id: 'b-galaxy', name: 'Galaxy', coins: 1000, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/79a02148079526539f7599150da9fd28.png~tplv-obj.webp' },
  { id: 'b-maple-fireworks', name: 'Maple Fireworks', coins: 2000, image: 'https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/resource/5071aed8ef2722bb1c0eeb91d342c91a.png~tplv-obj.webp' },
  { id: 'b-whale-diving', name: 'Whale Diving', coins: 2150, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/46fa70966d8e931497f5289060f9a794~tplv-obj.webp' },
  { id: 'b-meteor-shower', name: 'Meteor Shower', coins: 3000, image: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/71883933511237f7eaa1bf8cd12ed575~tplv-obj.webp' },
];

const KEY = 'tk-gift-catalog';
/** bảng quà đã lưu (từ live thật); chưa có thì dùng bảng quà phổ biến */
export function loadCatalog(): RealGift[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    if (Array.isArray(v) && v.length) return v;
  } catch {
    /* bỏ qua */
  }
  return BUILTIN_CATALOG;
}
/** trình duyệt này đã lưu bảng quà lấy từ live thật chưa */
export function hasRealCatalog(): boolean {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) && v.some((g) => g.image);
  } catch {
    return false;
  }
}
export function saveCatalog(gifts: RealGift[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(gifts));
  } catch {
    /* bỏ qua */
  }
}

/** "Rose (1 xu)" nếu biết quà thật, không thì "1 xu" */
export function giftPhrase(skill: SkillId, real: SkillGifts): string {
  const r = real[skill];
  if (r) return viGiftName(r.name);
  return `${GIFTS.find((g) => g.skill === skill)!.coins} xu`;
}
