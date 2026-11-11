/**
 * Các sự kiện livestream mà game hiểu được.
 * Mọi nguồn sự kiện (bảng giả lập, hoặc sau này một adapter livestream được phép)
 * đều phải chuyển dữ liệu của mình về đúng các kiểu dưới đây rồi gọi bus.emit().
 */
export interface LiveUser {
  id: string;
  name: string;
}

export type LiveEvent =
  | { type: 'viewer_join'; user: LiveUser }
  | { type: 'like'; user: LiveUser; count: number }
  /** bình luận của người xem (dùng để bình chọn câu đố né yêu quái) */
  | { type: 'chat'; user: LiveUser; text: string }
  /** label: tên quà thật trên TikTok (nếu có) để hiển thị thay tên quà mẫu */
  | { type: 'gift'; user: LiveUser; giftId: string; count: number; label?: string; coins?: number; image?: string }
  // Sự kiện điều khiển dành cho người vận hành / chế độ thử nghiệm
  | { type: 'debug_boss_attack' }
  | { type: 'debug_restart_stage' }
  | { type: 'debug_goto_stage'; index: number };

/** 'simulator' = bảng điều khiển thử nghiệm, 'live' = nguồn livestream thật (khi có tích hợp được phép). */
export type EventSourceKind = 'simulator' | 'live';

export interface EventEnvelope {
  id: string;
  ts: number;
  source: EventSourceKind;
  event: LiveEvent;
}
