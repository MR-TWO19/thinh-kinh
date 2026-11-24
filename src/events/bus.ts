import type { EventEnvelope, EventSourceKind, LiveEvent } from './types';

type Listener = (env: EventEnvelope) => void;

const CHANNEL_NAME = 'thinh-kinh-live-events';

/**
 * Hệ thống sự kiện dùng chung.
 * - Bảng giả lập và mọi adapter khác chỉ được đi qua emit().
 * - Game chỉ lắng nghe qua subscribe().
 * - BroadcastChannel cho phép mở bảng điều khiển ở một cửa sổ riêng (?view=panel)
 *   trong khi cửa sổ sân khấu (?view=stage) được capture bằng OBS / LIVE Studio.
 */
export class EventBus {
  private listeners = new Set<Listener>();
  private channel: BroadcastChannel | null = null;
  private seq = 0;
  /** gửi sự kiện qua relay tới sân khấu ở trình duyệt khác (BroadcastChannel chỉ tới được cửa sổ cùng địa chỉ) */
  private remote: ((env: EventEnvelope) => void) | null = null;
  /** id đã xử lý: một sự kiện có thể tới cả qua BroadcastChannel lẫn relay */
  private seen = new Set<string>();

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (msg: MessageEvent<EventEnvelope>) => {
        if (msg.data && msg.data.event) this.receive(msg.data);
      };
    }
  }

  /**
   * broadcast = false: chỉ phát trong cửa sổ hiện tại. Nguồn live chạy riêng trong từng cửa sổ sân khấu
   * nên không được phát lại sang cửa sổ khác (tránh nhân đôi quà).
   */
  emit(event: LiveEvent, source: EventSourceKind, opts: { broadcast?: boolean } = {}): EventEnvelope {
    const env: EventEnvelope = {
      id: `${Date.now().toString(36)}-${(this.seq++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      ts: Date.now(),
      source,
      event,
    };
    this.dispatch(env);
    if (opts.broadcast !== false) {
      this.channel?.postMessage(env);
      this.remote?.(env);
    }
    return env;
  }

  setRemote(fn: ((env: EventEnvelope) => void) | null) {
    this.remote = fn;
  }

  /** sự kiện từ cửa sổ / trình duyệt khác */
  receive(env: EventEnvelope) {
    if (this.seen.has(env.id)) return;
    this.dispatch(env);
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private dispatch(env: EventEnvelope) {
    this.seen.add(env.id);
    if (this.seen.size > 500) this.seen.delete(this.seen.values().next().value as string);
    for (const fn of this.listeners) fn(env);
  }
}

export const eventBus = new EventBus();
