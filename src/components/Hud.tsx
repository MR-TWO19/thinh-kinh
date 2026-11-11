import { useState, useSyncExternalStore } from 'react';
import { sfx } from '../game/audio';
import { music } from '../game/music';
import type { GameEngine, UiSnapshot } from '../game/engine';
import { GIFTS, SKILLS, giftForSkill, type Caster, type SkillId } from '../game/config';

/** các chiêu (theo thứ tự giá quà) của một nhân vật */
function skillsOf(c: Caster): SkillId[] {
  return GIFTS.filter((g) => SKILLS[g.skill].hero === c)
    .sort((a, b) => a.coins - b.coins)
    .map((g) => g.skill);
}

/** chip "1 xu · Gậy" cho người xem biết tặng bao nhiêu ra chiêu gì */
function GiftChip({ skill, s }: { skill: SkillId; s: UiSnapshot }) {
  const real = s.realGifts[skill];
  // đã có bảng quà thật mà không có quà nào khớp mốc giá: ẩn đi, khỏi bảo người xem tặng thứ không có
  if (!real && Object.keys(s.realGifts).length > 0) return null;
  const coins = real?.coins ?? giftForSkill(skill).coins;
  return (
    <span className="gchip" title={real ? `${real.name} · ${real.coins} xu` : undefined}>
      {real?.image ? (
        <img className="gimg big" src={real.image} alt={real.name} referrerPolicy="no-referrer" />
      ) : (
        <b>{coins} xu</b>
      )}{' '}
      {SKILLS[skill].short}
    </span>
  );
}

const fmt = (n: number) => (n >= 10000 ? `${(n / 1000).toFixed(1)}K` : n.toLocaleString('vi-VN'));

export function Hud({ engine }: { engine: GameEngine }) {
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const [muted, setMuted] = useState(sfx.muted);
  const [musicOn, setMusicOn] = useState(music.enabled);

  return (
    <div className="hud">
      {s.lowHp && <div className="lowhp-vignette" />}
      <TopBar s={s} />
      {s.boss.visible && <BossBar s={s} />}

      <button
        className="mute-btn"
        onClick={() => {
          sfx.setMuted(!muted);
          setMuted(!muted);
        }}
        title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      <button
        className={`mute-btn music-btn ${musicOn ? '' : 'off'}`}
        onClick={() => {
          music.setEnabled(!musicOn);
          setMusicOn(!musicOn);
        }}
        title={musicOn ? 'Tắt nhạc nền' : 'Bật nhạc nền'}
      >
        🎵
      </button>

      <div className="left-col">
        <div className="join-stack">
          {s.joinToasts.slice(-2).map((t) => (
            <div key={t.id} className="join-toast">
              <span className="join-spark">✨</span>
              <span>
                <b>{t.name}</b> vừa gia nhập đoàn!
              </span>
            </div>
          ))}
        </div>
        <div className="companions">
          <div className="companions-title">
            Người đồng hành <span className="count">{s.companionCount}</span>
          </div>
          {s.companions.length === 0 && <div className="companion empty">Chưa có ai… vào live để đồng hành!</div>}
          {s.companions.slice(0, 6).map((c, i) => (
            <div key={c.id} className={`companion ${i === 0 ? 'fresh' : ''}`}>
              <span className="dot" style={{ background: `hsl(${hash(c.id) % 360} 80% 65%)` }} />
              <span className="cname">{c.name}</span>
              {c.isTest && <span className="test-tag">TEST</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="gift-stack">
        {s.giftToasts.map((g) => (
          <div key={g.id} className={`gift-toast tier-${g.gift.tier}`} style={{ ['--gc' as string]: g.gift.color }}>
            <div className="gift-icon">
              {g.image ? <img src={g.image} alt="" referrerPolicy="no-referrer" /> : g.gift.icon}
            </div>
            <div className="gift-body">
              <div className="gift-line">
                <b>{g.user}</b> tặng {g.label ?? g.gift.name} {g.count > 1 && <span className="gift-count">x{g.count}</span>}
              </div>
              <div className="gift-skill">
                {g.heroName}: {g.skillName}
              </div>
            </div>
          </div>
        ))}
      </div>

      {s.callout && (
        <div key={s.callout.id} className="callout" style={{ color: s.callout.color }}>
          {s.callout.text}
        </div>
      )}

      <PhaseBanner s={s} />
      {s.phase === 'quiz' && s.quiz && <QuizCard q={s.quiz} key={`quiz-${s.stageIndex}`} />}

      {s.lowHp && s.phase !== 'wiped' && (
        <div className="lowhp-warning">
          ⚠ ĐỘI SẮP HẾT MÁU · <span className="heart">❤</span> THẢ TIM ĐỂ HỒI MÁU!
        </div>
      )}

      {s.phase !== 'complete' && <ComboCard s={s} />}
      {s.phase !== 'complete' && <EnergyBar s={s} />}
      {s.phase !== 'complete' && <HeroCards s={s} />}
      {s.phase === 'complete' && <CompleteOverlay s={s} />}
    </div>
  );
}

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function TopBar({ s }: { s: UiSnapshot }) {
  const pct = Math.round(s.progress * 100);
  return (
    <div className="topbar">
      <div className="stage-chip">
        <span className="stage-num">
          KIẾP NẠN {s.stage.index}/{s.stageCount}
        </span>
        <span className="stage-name">{s.phase === 'final_walk' || s.phase === 'complete' ? 'Đường về Linh Sơn' : s.stage.name}</span>
      </div>
      <div className="journey">
        <span className="journey-icon">🚶</span>
        <div className="journey-track">
          <div className="journey-fill" style={{ width: `${pct}%` }} />
          <div className="journey-marker" style={{ left: `${pct}%` }}>
            🧘
          </div>
        </div>
        <span className="journey-icon">🛕</span>
        <span className="journey-pct">{pct}%</span>
      </div>
      <div className="journey-sub">
        Hành trình đến Chùa Như Lai · <span className="likes">❤ {fmt(s.totalLikes)}</span>
      </div>
    </div>
  );
}

function BossBar({ s }: { s: UiSnapshot }) {
  const ratio = s.boss.hp / s.boss.maxHp;
  return (
    <div className={`bossbar ${s.boss.enraged ? 'enraged' : ''}`}>
      <div className="boss-head">
        <span className="boss-name">{s.boss.icon} {s.boss.name}</span>
        <span className="boss-title">
          {s.sealT > 0 ? `ĐỊNH THÂN ${Math.ceil(s.sealT)}s` : s.boss.enraged ? 'NỔI GIẬN!' : s.boss.title}
        </span>
        <span className="boss-hp">
          {fmt(s.boss.hp)} / {fmt(s.boss.maxHp)}
        </span>
      </div>
      <div className="bar boss-track">
        <div className="bar-trail" style={{ width: `${ratio * 100}%` }} />
        <div
          className="bar-fill boss-fill"
          style={{ width: `${ratio * 100}%`, background: `linear-gradient(90deg, ${s.stage.palette.accent}, #ff4d6d)` }}
        />
      </div>
    </div>
  );
}

/**
 * Ô Hợp Kích: cho người xem biết tặng quà nào cho chủ live (2000 xu) để hợp kích ngay,
 * hoặc cả phòng cùng góp xu từ mọi món quà cho tới khi đủ mốc.
 */
function ComboCard({ s }: { s: UiSnapshot }) {
  const r = Math.min(1, s.comboMeter / s.comboGoal);
  const real = s.realGifts.team_combo;
  const icon = real?.image ? (
    <img className="combo-gift-img" src={real.image} alt={real.name} referrerPolicy="no-referrer" />
  ) : (
    <span className="combo-gift-emoji">{giftForSkill('team_combo').icon}</span>
  );
  return (
    <div className={`combo-card ${s.comboActive ? 'firing' : ''} ${r > 0.8 ? 'near' : ''}`}>
      <div className="combo-gift">
        {icon}
        <span className="combo-gift-price">{real?.coins ?? s.comboGoal} xu</span>
      </div>
      <div className="combo-body">
        <div className="combo-title">
          {s.comboActive ? '⚡ THẦY TRÒ ĐANG HỢP KÍCH!' : '⚡ HỢP KÍCH · hạ boss ngay'}
          {s.comboSaved > 0 && <span className="combo-saved">để dành x{s.comboSaved}</span>}
        </div>
        <div className="combo-way">
          <b>Cách 1:</b> tặng quà bên trái
        </div>
        <div className="combo-row">
          <span className="combo-way">
            <b>Cách 2:</b> tích đủ xu
          </span>
          <div className="bar combo-track">
            <div className="bar-fill combo-fill" style={{ width: `${(s.comboActive ? 1 : r) * 100}%` }} />
          </div>
          <span className="combo-num">
            {Math.floor(Math.min(s.comboMeter, s.comboGoal))}/{s.comboGoal}
          </span>
        </div>
      </div>
    </div>
  );
}

function EnergyBar({ s }: { s: UiSnapshot }) {
  const ratio = s.energy / s.energyMax;
  return (
    <div className={`energy ${s.casting ? 'casting' : ''} ${ratio > 0.8 ? 'near' : ''}`}>
      <div className="energy-head">
        <span className="energy-name">🙏 Đường Tăng</span>
        <span className="gchip heart-chip">
          <b>❤ Tim</b> {s.casting ? 'đang niệm chú…' : `Hồi máu ${Math.floor(s.energy)}/${s.energyMax}`}
        </span>
        {skillsOf('tang').map((k) => (
          <GiftChip key={k} skill={k} s={s} />
        ))}
      </div>
      <div className="bar energy-track">
        <div className="bar-fill energy-fill" style={{ width: `${(s.casting ? 1 : ratio) * 100}%` }} />
        {[25, 50, 75].map((m) => (
          <span key={m} className="tick" style={{ left: `${m}%` }} />
        ))}
      </div>
    </div>
  );
}

function HeroCards({ s }: { s: UiSnapshot }) {
  const order = ['sha', 'bajie', 'wukong'] as const;
  return (
    <div className="heroes">
      {order.map((id) => {
        const h = s.heroes.find((x) => x.id === id)!;
        const r = h.hp / h.maxHp;
        return (
          <div
            key={id}
            className={`hero-card ${h.ko ? 'ko' : ''} ${r < 0.3 && !h.ko ? 'danger' : ''}`}
            style={{ ['--hc' as string]: h.color }}
          >
            <div className="hero-top">
              <span className="hero-name">{h.name}</span>
              {s.shieldT > 0 && !h.ko && <span className="shield-badge">🛡 {Math.ceil(s.shieldT)}s</span>}
            </div>
            {h.ko ? (
              <div className="hero-role">GỤC NGÃ · chờ hồi sinh</div>
            ) : (
              <div className="hero-gifts">
                {skillsOf(id).map((k) => (
                  <GiftChip key={k} skill={k} s={s} />
                ))}
              </div>
            )}
            <div className="bar hero-track">
              <div className="bar-trail" style={{ width: `${r * 100}%` }} />
              <div className="bar-fill hero-fill" style={{ width: `${r * 100}%`, background: hpColor(r) }} />
            </div>
            <div className="hero-hp">
              {h.hp}/{h.maxHp}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function hpColor(r: number) {
  if (r < 0.3) return 'linear-gradient(90deg,#ff2d55,#ff6b6b)';
  if (r < 0.6) return 'linear-gradient(90deg,#ffb020,#ffd24a)';
  return 'linear-gradient(90deg,#2ed47a,#8affb5)';
}

const LETTERS = ['A', 'B', 'C'];

/** câu đố trước boss: người xem bình luận A / B / C */
function QuizCard({ q }: { q: NonNullable<UiSnapshot['quiz']> }) {
  const r = q.result;
  const max = Math.max(1, ...q.counts);
  return (
    <div className={`quiz-card ${r ? (r.ok ? 'ok' : 'fail') : ''}`}>
      <div className="quiz-head">
        <span className="quiz-tag">❓ CÂU ĐỐ NÉ YÊU QUÁI</span>
        {!r && <span className="quiz-timer">{Math.ceil(q.timeLeft)}s</span>}
      </div>
      <div className="quiz-q">{q.question}</div>
      <div className="quiz-opts">
        {q.options.map((opt, i) => {
          const cls = r ? (i === r.correct ? 'right' : i === r.chosen ? 'wrong' : 'dim') : '';
          return (
            <div key={i} className={`quiz-opt ${cls}`}>
              <div className="quiz-fill" style={{ width: `${(q.counts[i] / max) * 100}%` }} />
              <span className="quiz-letter">{LETTERS[i]}</span>
              <span className="quiz-text">{opt}</span>
              <span className="quiz-count">{q.counts[i]}</span>
            </div>
          );
        })}
      </div>
      {!r && <div className="quiz-time"><div style={{ width: `${(q.timeLeft / q.duration) * 100}%` }} /></div>}
      <div className="quiz-foot">
        {r
          ? r.ok
            ? `✅ Đáp án ${LETTERS[r.correct]} đúng! Thầy trò né được yêu quái, đi tiếp!`
            : r.chosen < 0
              ? `❌ Không ai trả lời! Đáp án đúng là ${LETTERS[r.correct]}. Phải đánh boss!`
              : `❌ Chọn ${LETTERS[r.chosen]} sai rồi! Đáp án đúng là ${LETTERS[r.correct]}. Phải đánh boss!`
          : `💬 Bình luận A, B hoặc C để chọn · ${q.total} người đã trả lời`}
      </div>
    </div>
  );
}

function PhaseBanner({ s }: { s: UiSnapshot }) {
  if (s.phase === 'intro')
    return (
      <div className="phase-banner intro" key={`intro-${s.stageIndex}`}>
        <div className="pb-small">KIẾP NẠN THỨ {s.stage.index}</div>
        <div className="pb-big">{s.stage.name}</div>
        <div className="pb-sub">{s.stage.subtitle}</div>
      </div>
    );
  if (s.phase === 'walking')
    return (
      <div className="phase-banner walk">
        <div className="pb-sub">{s.stageIndex === 0 ? 'Đoàn thỉnh kinh lên đường…' : `Tiến về ${s.stage.name}…`}</div>
      </div>
    );
  if (s.phase === 'victory')
    return (
      <div className="phase-banner victory">
        <div className="pb-big">ĐÃ HÀNG PHỤC {s.boss.name.toUpperCase()}</div>
        <div className="pb-sub">{s.stageIndex + 1 < s.stageCount ? 'Tiếp tục lên đường…' : 'Chùa Như Lai đã ở phía trước!'}</div>
      </div>
    );
  if (s.phase === 'final_walk')
    return (
      <div className="phase-banner walk">
        <div className="pb-sub">Kim quang rực rỡ… Linh Sơn đã hiện ra!</div>
      </div>
    );
  if (s.phase === 'wiped')
    return (
      <div className="phase-banner wiped">
        <div className="pb-big">ĐOÀN KIỆT SỨC!</div>
        <div className="pb-sub">❤ Thả tim để Đường Tăng hồi sinh các đệ tử · 🎁 Tặng quà để đệ tử đứng dậy</div>
      </div>
    );
  return null;
}

function CompleteOverlay({ s }: { s: UiSnapshot }) {
  return (
    <div className="complete">
      <div className="complete-card">
        <div className="complete-title">🛕 ĐẾN CHÙA NHƯ LAI</div>
        <div className="complete-sub">Thỉnh kinh viên mãn! Cảm tạ các vị đồng hành</div>
        <div className="complete-stats">
          <div>
            <b>{fmt(s.totalLikes)}</b>
            <span>tim</span>
          </div>
          <div>
            <b>{s.companionCount}</b>
            <span>người đồng hành</span>
          </div>
          <div>
            <b>{s.stageCount}</b>
            <span>kiếp nạn</span>
          </div>
        </div>
        {s.topSupporters.length > 0 && (
          <div className="top-list">
            <div className="top-title">Công đức lớn nhất</div>
            {s.topSupporters.map((t, i) => (
              <div key={t.name + i} className="top-row">
                <span>{['🥇', '🥈', '🥉'][i]}</span>
                <span className="top-name">{t.name}</span>
                <span className="top-score">{fmt(t.score)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
