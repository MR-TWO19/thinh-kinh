import type { EventBus } from './bus';
import { RELAY_URL, type RealGift, type RelayEvent, type RelayServerMsg } from './relayProtocol';
import type { LiveEventSource } from './sources';
import { giftForCoins } from '../game/config';

/**
 * Nguồn sự kiện TikTok LIVE: nghe relay Node (npm run relay) qua WebSocket,
 * đổi tim / quà / người vào live thành LiveEvent và phát vào game với source = 'live'.
 * Mỗi cửa sổ sân khấu tự giữ một kết nối, và chỉ phát trong chính cửa sổ đó.
 */
export class TikTokRelaySource implements LiveEventSource {
  readonly name = 'TikTok LIVE (relay)';
  private bus: EventBus | null = null;
  private ws: WebSocket | null = null;
  private retry: ReturnType<typeof setTimeout> | null = null;

  /** gọi khi relay gửi bảng quà thật của phòng */
  onCatalog: ((gifts: RealGift[]) => void) | null = null;

  constructor(private url = RELAY_URL) {}

  start(bus: EventBus) {
    this.bus = bus;
    this.open();
  }

  stop() {
    this.bus = null;
    if (this.retry) clearTimeout(this.retry);
    this.retry = null;
    this.ws?.close();
    this.ws = null;
  }

  private open() {
    if (!this.bus) return;
    const ws = new WebSocket(this.url);
    this.ws = ws;
    ws.onmessage = (m) => {
      let msg: RelayServerMsg;
      try {
        msg = JSON.parse(String(m.data));
      } catch {
        return;
      }
      if (msg.t === 'event') this.forward(msg.event);
      else if (msg.t === 'catalog') this.onCatalog?.(msg.gifts);
    };
    // relay chưa chạy hoặc bị tắt: thử lại sau vài giây, không làm phiền gì khác
    ws.onclose = () => {
      if (this.ws !== ws || !this.bus) return;
      this.retry = setTimeout(() => this.open(), 3000);
    };
  }

  private forward(ev: RelayEvent) {
    const bus = this.bus;
    if (!bus) return;
    const local = { broadcast: false };
    if (ev.type === 'join') bus.emit({ type: 'viewer_join', user: ev.user }, 'live', local);
    else if (ev.type === 'like') bus.emit({ type: 'like', user: ev.user, count: ev.count }, 'live', local);
    else {
      const gift = giftForCoins(ev.coins);
      bus.emit({ type: 'gift', user: ev.user, giftId: gift.id, count: ev.count, label: ev.giftName, coins: ev.coins, image: ev.image }, 'live', local);
    }
  }
}
