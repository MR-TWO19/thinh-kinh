import { useEffect, useRef, useState } from 'react';
import { RELAY_URL, type RealGift, type RelayClientMsg, type RelayServerMsg, type RelayStatus } from '../events/relayProtocol';
import { GIFTS, SKILLS, casterName } from '../game/config';
import { loadCatalog, pickRealGifts, viGiftName } from '../game/realGifts';

const NAME_KEY = 'tk-tiktok-user';

const LABEL: Record<RelayStatus['state'], string> = {
  idle: 'Chưa kết nối',
  connecting: 'Đang kết nối…',
  connected: 'Đã kết nối',
  error: 'Lỗi',
  ended: 'Live đã kết thúc',
};

/** Ô kết nối TikTok LIVE: điều khiển relay Node qua WebSocket và hiện trạng thái. */
export function TikTokConnect() {
  const [relayUp, setRelayUp] = useState(false);
  const [status, setStatus] = useState<RelayStatus>({ state: 'idle', username: '' });
  const [name, setName] = useState(() => {
    try {
      return localStorage.getItem(NAME_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const wsRef = useRef<WebSocket | null>(null);
  const [catalog, setCatalog] = useState<RealGift[]>(() => loadCatalog());

  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const open = () => {
      const ws = new WebSocket(RELAY_URL);
      wsRef.current = ws;
      ws.onopen = () => setRelayUp(true);
      ws.onmessage = (m) => {
        try {
          const msg: RelayServerMsg = JSON.parse(String(m.data));
          if (msg.t === 'status') setStatus(msg.status);
          else if (msg.t === 'catalog') setCatalog(msg.gifts);
        } catch {
          /* bỏ qua */
        }
      };
      ws.onclose = () => {
        setRelayUp(false);
        if (alive) timer = setTimeout(open, 3000);
      };
    };
    open();
    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      wsRef.current?.close();
    };
  }, []);

  const send = (msg: RelayClientMsg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify(msg));
  };

  const connect = () => {
    const n = name.trim();
    if (!n) return;
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {
      /* bỏ qua */
    }
    send({ t: 'connect', username: n });
  };

  const busy = status.state === 'connecting' || status.state === 'connected';

  return (
    <div className="panel-group tiktok">
      <div className="panel-label">
        TikTok LIVE
        <span className={`tt-dot ${relayUp ? status.state : 'down'}`}>
          {relayUp ? LABEL[status.state] : 'Relay chưa chạy'}
        </span>
      </div>
      {!relayUp ? (
        <p className="panel-note">
          Mở terminal trong thư mục project và chạy <code>npm run relay</code>. Ô này tự nhận khi relay sẵn sàng.
        </p>
      ) : (
        <>
          <div className="row tt-row">
            <input
              className="tt-input"
              placeholder="tên kênh, ví dụ @tenkenh"
              value={name}
              disabled={busy}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && connect()}
            />
            {busy ? (
              <button className="btn danger" onClick={() => send({ t: 'disconnect' })}>
                Ngắt
              </button>
            ) : (
              <button className="btn" onClick={connect} disabled={!name.trim()}>
                Kết nối
              </button>
            )}
          </div>
          {status.state === 'connected' && (
            <p className="panel-note">
              Đang nghe <b>@{status.username}</b> · {status.events ?? 0} sự kiện. Tim, quà và người vào live sẽ điều khiển game.
            </p>
          )}
          {status.message && status.state !== 'connected' && <p className="panel-note tt-err">{status.message}</p>}
        </>
      )}
      <GiftMap catalog={catalog} />
    </div>
  );
}

/** quà TikTok thật đang gắn với từng chiêu (hiện trên sân khấu) */
function GiftMap({ catalog }: { catalog: RealGift[] }) {
  if (!catalog.length) {
    return <p className="panel-note">Kết nối vào live một lần để tải hình và tên quà thật của phòng.</p>;
  }
  const real = pickRealGifts(catalog);
  const rows = [...GIFTS].sort((a, b) => a.coins - b.coins);
  return (
    <ul className="gift-map">
      {rows.map((g) => {
        const r = real[g.skill];
        return (
          <li key={g.id}>
            {r?.image ? <img src={r.image} alt="" referrerPolicy="no-referrer" /> : <span className="gm-none">–</span>}
            <span className="gm-gift">{r ? `${viGiftName(r.name)} · ${r.coins} xu` : `≥ ${g.coins} xu (phòng không có quà khớp)`}</span>
            <span className="gm-skill">
              {casterName(SKILLS[g.skill].hero)}: {SKILLS[g.skill].short}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
