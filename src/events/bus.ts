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

  constructor() {
    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (msg: MessageEvent<EventEnvelope>) => {
        if (msg.data && msg.data.event) this.dispatch(msg.data);
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
    if (opts.broadcast !== false) this.channel?.postMessage(env);
    return env;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private dispatch(env: EventEnvelope) {
    for (const fn of this.listeners) fn(env);
  }
}

export const eventBus = new EventBus();
