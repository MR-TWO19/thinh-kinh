/** Giao thức giữa relay Node (server/relay.ts) và trang web. Dùng chung cho cả hai phía. */

import type { EventEnvelope } from './types';

/**
 * relay chạy cùng máy với web, nên lấy theo địa chỉ đang mở trang (điện thoại mở qua IP máy tính vẫn nối được).
 * Trang https không được nối ws:// tới IP mạng, nhưng được nối tới 127.0.0.1, nên trang https dùng 127.0.0.1.
 */
const pageLoc = (globalThis as { location?: { hostname: string; protocol: string } }).location;
const relayHost = !pageLoc || pageLoc.protocol === 'https:' ? '127.0.0.1' : pageLoc.hostname;
export const RELAY_URL = `ws://${relayHost}:8787`;

export interface RelayUser {
  id: string;
  name: string;
}

/** một món quà thật trong bảng quà của phòng live */
export interface RealGift {
  id: string;
  name: string;
  coins: number;
  image?: string;
}

export type RelayEvent =
  | { type: 'join'; user: RelayUser }
  | { type: 'like'; user: RelayUser; count: number }
  | { type: 'chat'; user: RelayUser; text: string }
  | { type: 'gift'; user: RelayUser; tiktokGiftId: number; giftName: string; coins: number; count: number; image?: string };

export interface RelayStatus {
  state: 'idle' | 'connecting' | 'connected' | 'error' | 'ended';
  username: string;
  roomId?: string;
  message?: string;
  events?: number;
}

export type RelayServerMsg =
  | { t: 'status'; status: RelayStatus }
  | { t: 'event'; event: RelayEvent }
  | { t: 'catalog'; gifts: RealGift[] }
  /** sự kiện từ bảng điều khiển ở trình duyệt khác (relay chuyển tiếp tới mọi sân khấu) */
  | { t: 'sim'; env: EventEnvelope };
export type RelayClientMsg = { t: 'connect'; username: string } | { t: 'disconnect' } | { t: 'sim'; env: EventEnvelope };
