/**
 * Relay TikTok LIVE → trình duyệt.
 *
 * Dùng thư viện KHÔNG chính thức `tiktok-live-connector` để nghe tim / quà / người vào live
 * của một kênh đang live, rồi đẩy sang trang web qua WebSocket cổng 8787 (mở cho cả mạng WiFi trong nhà để điện thoại dùng được).
 * Chỉ dùng cho kênh của chính bạn. Đây không phải API chính thức của TikTok.
 *
 * Chạy:  npm run relay            (rồi nhập tên kênh trong bảng điều khiển)
 *        npm run relay -- tenkenh  (tự kết nối luôn)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { WebSocketServer, WebSocket } from 'ws';
import { ControlEvent, TikTokLiveConnection, WebcastEvent } from 'tiktok-live-connector';
import type { RealGift, RelayClientMsg, RelayEvent, RelayServerMsg, RelayStatus } from '../src/events/relayProtocol';

const PORT = Number(process.env.RELAY_PORT ?? 8787);
const wss = new WebSocketServer({ host: '0.0.0.0', port: PORT });

let conn: TikTokLiveConnection | null = null;
let status: RelayStatus = { state: 'idle', username: '' };
let eventCount = 0;
/** bảng quà thật của phòng đang kết nối */
let catalog: RealGift[] = [];

type RawImage = { url_list?: string[]; urlList?: string[] } | undefined;
const firstUrl = (img: RawImage) => img?.url_list?.[0] ?? img?.urlList?.[0];

/** chuẩn hoá danh sách quà trả về (tên trường có thể là snake_case hoặc camelCase) */
function normalizeCatalog(raw: unknown): RealGift[] {
  const list = Array.isArray(raw) ? raw : [];
  const out: RealGift[] = [];
  for (const g of list as Record<string, unknown>[]) {
    const coins = Number(g.diamond_count ?? g.diamondCount) || 0;
    const name = String(g.name ?? '').trim();
    if (!coins || !name) continue;
    if (g.is_displayed_on_panel === false || g.isDisplayedOnPanel === false) continue;
    out.push({ id: String(g.id), name, coins, image: firstUrl(g.image as RawImage) ?? firstUrl(g.icon as RawImage) });
  }
  return out.sort((a, b) => a.coins - b.coins);
}

/**
 * Lưu bảng quà (kèm hình) vào public/gift-catalog.json để mọi trình duyệt (kể cả OBS)
 * hiện hình quà thật ngay khi mở game, không cần tự kết nối live lần nào.
 */
function saveCatalogFile(gifts: RealGift[]) {
  try {
    const dir = new URL('../public/', import.meta.url);
    mkdirSync(dir, { recursive: true });
    writeFileSync(new URL('gift-catalog.json', dir), JSON.stringify(gifts, null, 1));
    console.log('[relay] đã lưu bảng quà vào public/gift-catalog.json');
  } catch (err) {
    console.warn('[relay] không lưu được bảng quà:', err instanceof Error ? err.message : err);
  }
}

function send(ws: WebSocket, msg: RelayServerMsg) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}
function broadcast(msg: RelayServerMsg) {
  for (const ws of wss.clients) send(ws, msg);
}
function setStatus(next: Partial<RelayStatus>) {
  status = { ...status, ...next, events: eventCount };
  broadcast({ t: 'status', status });
  console.log(`[relay] ${status.state}${status.username ? ' @' + status.username : ''}${status.message ? ' · ' + status.message : ''}`);
}
function emit(event: RelayEvent) {
  eventCount += 1;
  broadcast({ t: 'event', event });
  // thỉnh thoảng cập nhật bộ đếm cho bảng điều khiển
  if (eventCount % 10 === 0) broadcast({ t: 'status', status: { ...status, events: eventCount } });
}

type AnyUser = { uniqueId?: string; nickname?: string; userId?: string | number } | undefined;
function toUser(u: AnyUser) {
  const id = String(u?.uniqueId || u?.userId || 'unknown');
  return { id: `tt:${id}`, name: u?.nickname || u?.uniqueId || 'Người xem' };
}

async function disconnect() {
  const c = conn;
  conn = null;
  if (c) {
    c.removeAllListeners();
    try {
      await c.disconnect();
    } catch {
      /* bỏ qua */
    }
  }
}

async function connect(rawName: string) {
  const username = rawName.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@/, '').replace(/\/.*$/, '');
  if (!username) return setStatus({ state: 'error', message: 'Chưa nhập tên kênh' });
  await disconnect();
  setStatus({ state: 'connecting', username, message: undefined });

  const c = new TikTokLiveConnection(username, {
    processInitialData: false, // bỏ qua lịch sử cũ, chỉ nhận sự kiện mới
    enableExtendedGiftInfo: false,
    signApiKey: process.env.EULER_API_KEY || undefined,
  });
  conn = c;

  c.on(WebcastEvent.MEMBER, (d) => emit({ type: 'join', user: toUser(d.user) }));

  c.on(WebcastEvent.LIKE, (d) => {
    const count = Number(d.count) || 1;
    emit({ type: 'like', user: toUser(d.user), count });
  });

  c.on(WebcastEvent.CHAT, (d) => {
    const raw = d as { content?: string; comment?: string };
    const text = String(raw.content ?? raw.comment ?? '').trim();
    if (text) emit({ type: 'chat', user: toUser(d.user), text: text.slice(0, 200) });
  });

  c.on(WebcastEvent.GIFT, (d) => {
    const g = d.gift;
    // quà dạng chuỗi (combo, như Hoa hồng): chỉ xử lý khi chuỗi kết thúc, với số lượng cuối cùng
    if ((g?.type === 1 || g?.combo) && !d.repeatEnd) return;
    emit({
      type: 'gift',
      user: toUser(d.user),
      tiktokGiftId: Number(d.giftId) || 0,
      giftName: g?.name || `Quà #${d.giftId}`,
      coins: Number(g?.diamondCount) || 1,
      count: Math.max(1, Number(d.repeatCount) || 1),
      image: g?.image?.urlList?.[0],
    });
  });

  c.on(WebcastEvent.STREAM_END, () => {
    setStatus({ state: 'ended', message: 'Buổi live đã kết thúc' });
    void disconnect();
  });
  c.on(ControlEvent.DISCONNECTED, () => {
    if (conn === c) setStatus({ state: 'idle', message: 'Mất kết nối' });
  });
  c.on(ControlEvent.ERROR, (err: unknown) => {
    const e = err as { exception?: Error; info?: string };
    console.error('[relay] lỗi:', e?.exception?.message ?? e?.info ?? err);
  });

  try {
    const state = await c.connect();
    if (conn !== c) return;
    setStatus({ state: 'connected', roomId: String(state.roomId), message: undefined });
    // lấy bảng quà thật của phòng để game hiện đúng hình / tên quà
    try {
      const gifts = normalizeCatalog(await c.fetchAvailableGifts());
      if (conn === c && gifts.length) {
        catalog = gifts;
        broadcast({ t: 'catalog', gifts });
        console.log(`[relay] đã tải ${gifts.length} quà của phòng`);
        saveCatalogFile(gifts);
      }
    } catch (err) {
      console.warn('[relay] không tải được bảng quà:', err instanceof Error ? err.message : err);
    }
  } catch (err) {
    if (conn !== c) return;
    conn = null;
    const msg = err instanceof Error ? err.message : String(err);
    const offline = /offline|isn't online|not.*live/i.test(msg) || (err as { name?: string })?.name === 'UserOfflineError';
    setStatus({ state: 'error', message: offline ? 'Kênh này hiện không live' : msg.slice(0, 200) });
  }
}

wss.on('connection', (ws) => {
  send(ws, { t: 'status', status: { ...status, events: eventCount } });
  if (catalog.length) send(ws, { t: 'catalog', gifts: catalog });
  ws.on('message', (raw) => {
    let msg: RelayClientMsg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (msg.t === 'connect') void connect(msg.username);
    else if (msg.t === 'disconnect') void disconnect().then(() => setStatus({ state: 'idle', message: undefined }));
  });
});

wss.on('listening', () => {
  console.log(`[relay] đang chạy ở cổng ${PORT} (máy này: ws://127.0.0.1:${PORT})`);
  const initial = process.argv[2] || process.env.TIKTOK_USERNAME;
  if (initial) void connect(initial);
});

process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});
