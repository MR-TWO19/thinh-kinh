import { useEffect } from 'react';
import type { SimulatorSource } from '../events/sources';
import { GIFTS } from '../game/config';

/**
 * Phím tắt quà theo thứ tự GIFTS:
 * A gậy · S khiên · D địa chấn · F phân thân · Z trăng khuyết · X giáng thế · C định thân · V HỢP KÍCH
 */
export const GIFT_KEYS = ['a', 's', 'd', 'f', 'z', 'x', 'c', 'v'];

/**
 * Phím tắt thử nghiệm: Q tim · A/S/D/F/Z/X/C chiêu · V hợp kích · M 30 tim · J người xem · B boss đánh · R chơi lại.
 * Dùng chung cho bảng điều khiển và chế độ chỉ-sân-khấu (?view=stage).
 */
export function useShortcuts(sim: SimulatorSource, giftCount: number) {
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.repeat || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.target instanceof HTMLInputElement || ev.target instanceof HTMLTextAreaElement || ev.target instanceof HTMLSelectElement) return;
      const k = ev.key.toLowerCase();
      const giftIdx = GIFT_KEYS.indexOf(k);
      if (k === 'q') sim.like(1);
      else if (giftIdx >= 0) sim.gift(GIFTS[giftIdx].id, giftCount);
      else if (k === 'm') sim.like(30);
      else if (k === 'j') sim.joinViewer();
      else if (k === 'b') sim.bossAttack();
      else if (k === 'r') sim.restartStage();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sim, giftCount]);
}
