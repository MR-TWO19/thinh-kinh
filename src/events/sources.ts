import type { EventBus } from './bus';
import type { LiveUser } from './types';

/**
 * Giao diện chung cho một nguồn sự kiện.
 * Sau này nếu có cách tích hợp livestream ĐƯỢC PHÉP (API chính thức, công cụ tương tác
 * do nền tảng cấp, hoặc relay do bạn tự vận hành dựa trên chúng), chỉ cần viết một class
 * implements LiveEventSource, chuyển dữ liệu về LiveEvent rồi gọi bus.emit(event, 'live').
 * Game và giao diện không phải sửa gì.
 */
export interface LiveEventSource {
  readonly name: string;
  start(bus: EventBus): void;
  stop(): void;
}

/**
 * Nguồn giả lập: chỉ tạo khách THỬ NGHIỆM có tên ghi rõ là test,
 * mọi sự kiện được gắn source = 'simulator'.
 */
export class SimulatorSource implements LiveEventSource {
  readonly name = 'Bảng giả lập';
  private bus: EventBus | null = null;
  private counter = 0;
  private testUsers: LiveUser[] = [];

  start(bus: EventBus) {
    this.bus = bus;
  }

  stop() {
    this.bus = null;
  }

  private newTestUser(): LiveUser {
    this.counter += 1;
    const n = String(this.counter).padStart(3, '0');
    const user = { id: `test-${n}`, name: `Khách thử ${n}` };
    this.testUsers.push(user);
    return user;
  }

  private anyTestUser(): LiveUser {
    if (this.testUsers.length === 0) return this.joinViewer();
    return this.testUsers[Math.floor(Math.random() * this.testUsers.length)];
  }

  joinViewer(): LiveUser {
    const user = this.newTestUser();
    this.bus?.emit({ type: 'viewer_join', user }, 'simulator');
    return user;
  }

  like(count = 1) {
    this.bus?.emit({ type: 'like', user: this.anyTestUser(), count }, 'simulator');
  }

  /** bình luận thử; newUser = true: mỗi bình luận từ một khách thử khác (để thử bình chọn) */
  chat(text: string, newUser = false) {
    const user = newUser ? this.newTestUser() : this.anyTestUser();
    this.bus?.emit({ type: 'chat', user, text }, 'simulator');
  }

  gift(giftId: string, count = 1) {
    this.bus?.emit({ type: 'gift', user: this.anyTestUser(), giftId, count }, 'simulator');
  }

  bossAttack() {
    this.bus?.emit({ type: 'debug_boss_attack' }, 'simulator');
  }

  goToStage(index: number) {
    this.bus?.emit({ type: 'debug_goto_stage', index }, 'simulator');
  }

  restartStage() {
    this.bus?.emit({ type: 'debug_restart_stage' }, 'simulator');
  }
}
