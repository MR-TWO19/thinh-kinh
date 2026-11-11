import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { eventBus } from '../events/bus';
import { SimulatorSource } from '../events/sources';
import type { EventEnvelope } from '../events/types';
import { GIFTS, SKILLS, STAGES, casterName } from '../game/config';
import { GIFT_KEYS, useShortcuts } from './useShortcuts';
import { TikTokConnect } from './TikTokConnect';
import { voice, VOICE_CATEGORIES } from '../game/voice';

/** chọn giọng đọc tiếng Việt có trên máy */
function VoicePicker() {
  useSyncExternalStore(voice.subscribe, () => `${voice.enabled}|${voice.current?.name}|${voice.voices.length}|${JSON.stringify(voice.cats)}`);
  if (!voice.supported)
    return <p className="voice-note">Trình duyệt này không hỗ trợ giọng đọc.</p>;
  if (!voice.voices.length)
    return (
      <p className="voice-note">
        Máy chưa có giọng tiếng Việt. Windows: dùng Edge (có sẵn giọng HoaiMy, NamMinh) hoặc cài gói giọng nói Tiếng Việt trong Settings → Time &amp; Language. Mac: có sẵn giọng Linh.
      </p>
    );
  return (
    <>
      <div className="voice-pick">
        <select value={voice.current?.name ?? ''} onChange={(ev) => voice.setVoice(ev.target.value)}>
          {voice.voices.map((v) => (
            <option key={v.name} value={v.name}>
              {v.name}
            </option>
          ))}
        </select>
        <button className={`chip ${voice.enabled ? 'on' : ''}`} onClick={() => voice.setEnabled(!voice.enabled)}>
          {voice.enabled ? 'Bật' : 'Tắt'}
        </button>
        <button className="btn" onClick={() => voice.say('Xin chào! Thầy trò Đường Tăng lên đường thỉnh kinh!', 'high')}>
          Nghe thử
        </button>
      </div>
      <div className={`voice-cats ${voice.enabled ? '' : 'off'}`}>
        {VOICE_CATEGORIES.map((c) => (
          <label key={c.id} className="voice-cat">
            <input type="checkbox" checked={voice.cats[c.id]} onChange={(ev) => voice.setCategory(c.id, ev.target.checked)} />
            <span>
              <b>{c.label}</b>
              <small>{c.hint}</small>
            </span>
          </label>
        ))}
      </div>
      <p className="voice-note">Giọng đọc phát ra loa máy: khi live nhớ bật thu Desktop Audio trong OBS / LIVE Studio.</p>
    </>
  );
}


function describe(env: EventEnvelope): string {
  const e = env.event;
  switch (e.type) {
    case 'viewer_join':
      return `👋 ${e.user.name} vào live`;
    case 'like':
      return `❤ ${e.user.name} thả ${e.count} tim`;
    case 'chat':
      return `💬 ${e.user.name}: ${e.text}`;
    case 'gift': {
      const g = GIFTS.find((x) => x.id === e.giftId);
      return `🎁 ${e.user.name} tặng ${e.label ? `${e.label} → ` : ''}${g?.name ?? e.giftId} x${e.count}`;
    }
    case 'debug_boss_attack':
      return '💀 Boss tấn công (thử nghiệm)';
    case 'debug_restart_stage':
      return '🔄 Bắt đầu lại màn';
    case 'debug_goto_stage':
      return `⏭ Nhảy đến kiếp nạn ${e.index + 1}`;
  }
}

/**
 * Bảng điều khiển thử nghiệm. Mọi nút đều đi qua SimulatorSource -> eventBus,
 * đúng đường mà một nguồn livestream thật sẽ dùng.
 */
export function ControlPanel({ standalone = false }: { standalone?: boolean }) {
  const sim = useMemo(() => {
    const s = new SimulatorSource();
    s.start(eventBus);
    return s;
  }, []);
  const [log, setLog] = useState<EventEnvelope[]>([]);
  const [giftCount, setGiftCount] = useState(1);
  const [chatText, setChatText] = useState('');

  useEffect(() => {
    return eventBus.subscribe((env) => setLog((l) => [env, ...l].slice(0, 30)));
  }, []);

  useShortcuts(sim, giftCount);

  const openWindow = (view: string, w: number, h: number) =>
    window.open(`${location.pathname}?view=${view}`, `tk-${view}`, `width=${w},height=${h}`);

  return (
    <aside className={`panel ${standalone ? 'standalone' : ''}`}>
      <div className="panel-title">
        Bảng điều khiển thử nghiệm
        <span className="panel-badge">SIMULATOR</span>
      </div>
      <p className="panel-note">
        Chỉ dùng để thử. Mọi sự kiện được gắn nhãn <b>simulator</b> và người xem có tên “Khách thử”. Sự kiện thật từ TikTok được gắn nhãn <b>live</b>.
      </p>

      <TikTokConnect />

      <div className="panel-group">
        <div className="panel-label">🗣 Giọng đọc</div>
        <VoicePicker />
      </div>

      <div className="panel-group">
        <div className="panel-label">Người xem</div>
        <button className="btn" onClick={() => sim.joinViewer()}>
          👋 Giả lập người xem mới <kbd>J</kbd>
        </button>
      </div>

      <div className="panel-group">
        <div className="panel-label">Bình luận → câu đố né kiếp nạn</div>
        <div className="row quiz-votes">
          {['1', '2', '3'].map((l) => (
            <button key={l} className="btn" onClick={() => sim.chat(l, true)}>
              💬 {l}
            </button>
          ))}
          {['1', '2', '3'].map((l) => (
            <button key={`${l}5`} className="btn" onClick={() => [0, 1, 2, 3, 4].forEach(() => sim.chat(l, true))}>
              💬 {l} x5
            </button>
          ))}
        </div>
        <form
          className="chat-form"
          onSubmit={(ev) => {
            ev.preventDefault();
            if (chatText.trim()) sim.chat(chatText.trim(), true);
            setChatText('');
          }}
        >
          <input value={chatText} onChange={(ev) => setChatText(ev.target.value)} placeholder="Gõ bình luận thử, vd: câu 2" />
          <button className="btn" type="submit">
            Gửi
          </button>
        </form>
      </div>

      <div className="panel-group">
        <div className="panel-label">Tim → năng lượng Đường Tăng</div>
        <div className="row">
          <button className="btn heart" onClick={() => sim.like(1)}>
            ❤ Thả 1 tim <kbd>Q</kbd>
          </button>
          <button className="btn heart" onClick={() => sim.like(30)}>
            ❤❤❤ Nhiều tim (30) <kbd>M</kbd>
          </button>
        </div>
      </div>

      <div className="panel-group">
        <div className="panel-label">
          Quà → chiêu thầy trò
          <span className="count-pick">
            {[1, 5, 10].map((n) => (
              <button key={n} className={`chip ${giftCount === n ? 'on' : ''}`} onClick={() => setGiftCount(n)}>
                x{n}
              </button>
            ))}
          </span>
        </div>
        {GIFTS.map((g, i) => (
          <button key={g.id} className={`btn gift ${g.tier === 5 ? 'combo' : ''}`} style={{ ['--gc' as string]: g.color }} onClick={() => sim.gift(g.id, giftCount)}>
            <span className="gift-i">{g.icon}</span>
            <span className="gift-t">
              <b>
                {g.name} <small>({g.coins} xu · mức {g.tier})</small>
              </b>
              <small>
                {casterName(SKILLS[g.skill].hero)} · {SKILLS[g.skill].name}
              </small>
            </span>
            <kbd>{GIFT_KEYS[i]?.toUpperCase()}</kbd>
          </button>
        ))}
      </div>

      <div className="panel-group">
        <div className="panel-label">Điều khiển</div>
        <div className="row">
          <button className="btn danger" onClick={() => sim.bossAttack()}>
            💀 Boss tấn công <kbd>B</kbd>
          </button>
          <button className="btn" onClick={() => sim.restartStage()}>
            🔄 Bắt đầu lại màn <kbd>R</kbd>
          </button>
        </div>
              <div className="stage-jump">
          <span>⏭ Nhảy đến</span>
          <select
            value=""
            onChange={(ev) => {
              if (ev.target.value !== '') sim.goToStage(Number(ev.target.value));
              ev.target.blur();
            }}
          >
            <option value="">Chọn kiếp nạn…</option>
            {STAGES.map((st, i) => (
              <option key={st.id} value={i}>
                {st.index}. {st.name} · {st.boss.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!standalone && (
        <div className="panel-group">
          <div className="panel-label">Cửa sổ capture</div>
          <div className="row">
            <button className="btn ghost" onClick={() => openWindow('stage', 540, 960)}>
              🖥 Mở sân khấu riêng
            </button>
            <button className="btn ghost" onClick={() => openWindow('panel', 380, 900)}>
              🎛 Mở bảng riêng
            </button>
          </div>
        </div>
      )}

      <div className="panel-group log">
        <div className="panel-label">Nhật ký sự kiện</div>
        <ul>
          {log.map((env) => (
            <li key={env.id}>
              <span className={`src ${env.source}`}>{env.source}</span> {describe(env)}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
