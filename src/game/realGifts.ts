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
  st_crescent: [],
  st_shield: ['Finger Heart'],
  bj_quake: ['Rosa'],
  bj_slam: ['Perfume'],
  tg_seal: ['Doughnut'],
  wk_ultimate: ['Hand Hearts', 'Confetti'],
  team_combo: [], // tự chọn quà rẻ nhất từ 2000 xu trở lên
};

export type SkillGifts = Partial<Record<SkillId, RealGift>>;

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

const KEY = 'tk-gift-catalog';
export function loadCatalog(): RealGift[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
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
  if (r) return r.name;
  return `${GIFTS.find((g) => g.skill === skill)!.coins} xu`;
}
