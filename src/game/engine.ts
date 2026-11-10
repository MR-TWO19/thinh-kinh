import type { EventEnvelope, LiveUser } from '../events/types';
import { sfx } from './audio';
import { music, type Mood } from './music';
import type { RealGift } from '../events/relayProtocol';
import { giftPhrase, loadCatalog, pickRealGifts, saveCatalog, type SkillGifts } from './realGifts';
import {
  AUTO_ATTACK,
  GIFTS,
  HEROES,
  LOW_HP_RATIO,
  COMBO_GOAL,
  HEART_NUDGE,
  SEAL,
  SHIELD,
  WIPED_NUDGE,
  SKILLS,
  casterName,
  type Caster,
  STAGES,
  TANG,
  TIMING,
  type GiftDef,
  type HeroDef,
  type HeroId,
  type SkillId,
  type StageDef,
} from './config';

export const W = 720;
export const H = 1280;
export const GROUND_Y = 900;
export const BOSS_X = 580;
export const BOSS_Y = 770;

export type Phase = 'walking' | 'intro' | 'battle' | 'victory' | 'final_walk' | 'complete' | 'wiped';
export type AttackKind = 'auto' | 'staff' | 'quake' | 'shield' | 'ultimate' | 'crescent' | 'slam' | null;

export interface HeroState {
  def: HeroDef;
  hp: number;
  ko: boolean;
  attackT: number;
  attackDur: number;
  attackKind: AttackKind;
  hurtT: number;
  healT: number;
  autoTimer: number;
}

export interface BossState {
  hp: number;
  attackTimer: number;
  attackCount: number;
  hurtT: number;
  lungeT: number;
  castT: number;
  dieT: number;
  enterT: number;
  enraged: boolean;
}

export interface Minion {
  id: number;
  x: number;
  tx: number;
  y: number;
  hp: number;
  maxHp: number;
  attackTimer: number;
  hopT: number;
  hurtT: number;
  dieT: number;
  dead: boolean;
}

export interface Projectile {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  t: number;
  dur: number;
  kind: 'bone' | 'fire' | 'orb' | 'aoe' | 'minion' | 'crescent';
  onHit: () => void;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: 'spark' | 'heart' | 'glow' | 'bone' | 'petal' | 'smoke';
  gravity: number;
  rot: number;
  vr: number;
}

export interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  size: number;
  life: number;
  max: number;
}

export interface Ring {
  x: number;
  y: number;
  r0: number;
  r1: number;
  life: number;
  max: number;
  color: string;
  width: number;
  flat?: boolean;
}

export interface Slash {
  x: number;
  y: number;
  angle: number;
  life: number;
  max: number;
  color: string;
  size: number;
}

export interface Clone {
  x: number;
  y: number;
  t: number;
  max: number;
  flip: boolean;
}

export interface Toast {
  id: number;
  expires: number;
}
export interface JoinToast extends Toast {
  name: string;
}
export interface GiftToast extends Toast {
  user: string;
  gift: GiftDef;
  /** tên quà thật (TikTok) nếu có */
  label?: string;
  /** hình quà thật (TikTok) nếu có */
  image?: string;
  count: number;
  skillName: string;
  heroName: string;
}
export interface Callout extends Toast {
  text: string;
  color: string;
}

export interface Companion {
  id: string;
  name: string;
  isTest: boolean;
}

export interface UiSnapshot {
  phase: Phase;
  stageIndex: number;
  stageCount: number;
  stage: StageDef;
  progress: number;
  boss: { name: string; title: string; icon: string; hp: number; maxHp: number; enraged: boolean; visible: boolean };
  heroes: { id: HeroId; name: string; role: string; hp: number; maxHp: number; ko: boolean; color: string }[];
  energy: number;
  energyMax: number;
  casting: boolean;
  shieldT: number;
  sealT: number;
  comboActive: boolean;
  comboMeter: number;
  comboGoal: number;
  comboSaved: number;
  realGifts: SkillGifts;
  lowHp: boolean;
  companions: Companion[];
  companionCount: number;
  joinToasts: JoinToast[];
  giftToasts: GiftToast[];
  callout: Callout | null;
  totalLikes: number;
  topSupporters: { name: string; score: number }[];
  phaseT: number;
}

const SAVE_KEY = 'tk-stage';
function loadSavedStage(): number {
  try {
    const n = Number(localStorage.getItem(SAVE_KEY));
    return Number.isInteger(n) && n >= 0 && n < STAGES.length ? n : 0;
  } catch {
    return 0;
  }
}
function saveStage(i: number) {
  try {
    localStorage.setItem(SAVE_KEY, String(i));
  } catch {
    /* bỏ qua nếu trình duyệt chặn lưu trữ */
  }
}

/** thời điểm gậy khổng lồ nện xuống trong chiêu hợp kích (giây) */
export const COMBO_IMPACT = 4.1;

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export class GameEngine {
  time = 0;
  phase: Phase = 'walking';
  phaseT = 0;
  stageIndex = 0;
  worldX = 0;

  heroes: HeroState[] = [];
  tang = { castT: 0, castDur: 1.2, energy: 0, glowT: 0, chantT: 0 };
  boss!: BossState;
  minions: Minion[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  texts: FloatText[] = [];
  rings: Ring[] = [];
  slashes: Slash[] = [];
  clones: Clone[] = [];
  shieldT = 0;
  /** giây boss còn bị Đường Tăng định thân */
  sealT = 0;
  /** chiêu hợp kích: t = giây kể từ lúc bắt đầu, active = đang diễn, landed = đòn kết liễu đã nện xuống */
  combo = { active: false, t: 0, landed: false };
  /** xu cả phòng đã góp cho Hợp Kích */
  comboMeter = 0;
  /** bong bóng nhân vật nhắc người xem tặng quà */
  nudge: { speaker: Exclude<Caster, 'team'>; text: string; t: number; max: number; image?: string } | null = null;
  /** quà TikTok thật được chọn cho từng chiêu (từ bảng quà của phòng live) */
  realGifts: SkillGifts = pickRealGifts(loadCatalog());
  private lastGiftAt = 0;
  private nudgeTimer = 8;
  private nudgeIdx = 0;
  shake = 0;
  flash = { color: '#fff', a: 0 };

  companions: Companion[] = [];
  companionIds = new Set<string>();
  joinToasts: JoinToast[] = [];
  giftToasts: GiftToast[] = [];
  callout: Callout | null = null;
  totalLikes = 0;
  contributions = new Map<string, { name: string; score: number }>();

  private scheduled: { at: number; fn: () => void }[] = [];
  private pendingSkills: { skill: SkillId; count: number }[] = [];
  private toastSeq = 1;
  private minionSeq = 1;
  private alarmTimer = 0;

  private listeners = new Set<() => void>();
  private snapshot: UiSnapshot;
  private publishTimer = 0;

  constructor() {
    // đọc trước khi resetJourney ghi đè về 0
    const saved = loadSavedStage();
    this.resetJourney();
    // tiếp tục kiếp nạn đang dở từ lần chạy trước
    if (saved > 0) {
      this.stageIndex = saved;
      this.worldX = saved * 2000;
      this.setupStage();
    }
    this.snapshot = this.buildSnapshot();
  }

  get stage(): StageDef {
    return STAGES[this.stageIndex];
  }

  // ---------- vòng đời ----------

  resetJourney() {
    this.stageIndex = 0;
    this.worldX = 0;
    this.totalLikes = 0;
    this.comboMeter = 0;
    this.contributions.clear();
    this.setupStage();
    this.setPhase('walking');
  }

  private setupStage() {
    saveStage(this.stageIndex);
    this.heroes = HEROES.map((def) => ({
      def,
      hp: def.maxHp,
      ko: false,
      attackT: 0,
      attackDur: 0,
      attackKind: null,
      hurtT: 0,
      healT: 0,
      autoTimer: rand(0.5, AUTO_ATTACK.interval),
    }));
    this.boss = {
      hp: this.stage.boss.maxHp,
      attackTimer: 2.5,
      attackCount: 0,
      hurtT: 0,
      lungeT: 0,
      castT: 0,
      dieT: 0,
      enterT: 0,
      enraged: false,
    };
    this.tang.energy = 0;
    this.tang.castT = 0;
    this.minions = [];
    this.projectiles = [];
    this.scheduled = [];
    this.clones = [];
    this.shieldT = 0;
    this.sealT = 0;
    this.combo = { active: false, t: 0, landed: false };
  }

  restartStage() {
    if (this.phase === 'complete' || this.phase === 'final_walk') {
      this.resetJourney();
      return;
    }
    this.setupStage();
    this.pendingSkills = [];
    this.setPhase('intro');
  }

  private setPhase(p: Phase) {
    this.phase = p;
    this.phaseT = 0;
    if (p === 'intro') {
      this.boss.enterT = 0;
      sfx.gong();
    }
    if (p === 'battle') {
      this.boss.attackTimer = 2.2;
      // giải phóng các chiêu được tặng trong lúc đi đường
      const queued = this.pendingSkills.splice(0);
      queued.forEach((q, i) => this.later(0.4 + i * 0.6, () => this.performSkill(q.skill, q.count)));
    }
    if (p === 'victory') {
      sfx.victory();
      this.callout = null;
      // boss đã chết vì chiêu khác trước khi hợp kích kịp kết liễu: hoàn lại, để dành cho yêu quái sau
      if (this.combo.active && !this.combo.landed) {
        this.combo.active = false;
        this.clones = [];
        this.tang.chantT = 0;
        this.saveCombo(1);
      }
      // ăn mừng: đệ tử bị hạ đứng dậy, cả đội hồi tối thiểu 60% máu
      this.heroes.forEach((h) => {
        h.ko = false;
        h.hp = Math.max(h.hp, Math.round(h.def.maxHp * 0.6));
        h.healT = 0.8;
      });
      this.shieldT = 0;
      this.sealT = 0;
      this.minions.forEach((m) => this.killMinion(m));
      this.projectiles = [];
    }
    if (p === 'complete') {
      saveStage(0);
      sfx.gong();
      sfx.victory();
    }
    if (p === 'wiped') sfx.defeat();
    this.publish(true);
  }

  // ---------- sự kiện ----------

  handle(env: EventEnvelope) {
    const ev = env.event;
    switch (ev.type) {
      case 'viewer_join':
        this.onJoin(ev.user, env.source === 'simulator');
        break;
      case 'like':
        this.onLike(ev.user, ev.count, env.source === 'simulator');
        break;
      case 'gift':
        this.onGift(ev.user, ev.giftId, ev.count, env.source === 'simulator', ev.label, ev.coins, ev.image);
        break;
      case 'debug_boss_attack':
        if (this.phase === 'battle') this.bossAttack(true);
        break;
      case 'debug_restart_stage':
        this.restartStage();
        break;
      case 'debug_goto_stage':
        this.goToStage(ev.index);
        break;
    }
    this.publish(true);
  }

  private addCompanion(user: LiveUser, isTest: boolean): boolean {
    if (this.companionIds.has(user.id)) {
      // đưa lên đầu danh sách
      const idx = this.companions.findIndex((c) => c.id === user.id);
      if (idx > 0) this.companions.unshift(...this.companions.splice(idx, 1));
      return false;
    }
    this.companionIds.add(user.id);
    this.companions.unshift({ id: user.id, name: user.name, isTest });
    if (this.companions.length > 200) {
      const removed = this.companions.pop();
      if (removed) this.companionIds.delete(removed.id);
    }
    return true;
  }

  private contribute(user: LiveUser, score: number) {
    const c = this.contributions.get(user.id) ?? { name: user.name, score: 0 };
    c.score += score;
    this.contributions.set(user.id, c);
  }

  private onJoin(user: LiveUser, isTest: boolean) {
    const isNew = this.addCompanion(user, isTest);
    if (!isNew) return;
    this.joinToasts.push({ id: this.toastSeq++, name: user.name, expires: this.time + 3.8 });
    if (this.joinToasts.length > 3) this.joinToasts.shift();
    sfx.join();
  }

  private onLike(user: LiveUser, count: number, isTest: boolean) {
    this.addCompanion(user, isTest);
    this.totalLikes += count;
    this.contribute(user, count);
    const n = Math.min(count, 14);
    for (let i = 0; i < n; i++) {
      this.later(i * 0.06, () => this.spawnHeart());
    }
    sfx.like();
    if (this.phase === 'complete') return;
    this.tang.energy = Math.min(TANG.energyMax * 2, this.tang.energy + count * TANG.energyPerLike);
    this.tryCastHeal();
  }

  private onGift(user: LiveUser, giftId: string, count: number, isTest: boolean, label?: string, realCoins?: number, image?: string) {
    const gift = GIFTS.find((g) => g.id === giftId);
    if (!gift) return;
    this.addCompanion(user, isTest);
    const value = (realCoins ?? gift.coins) * count;
    this.contribute(user, value * 10);
    // mọi quà (trừ quà Hợp Kích, vốn đã tự hợp kích) đều góp vào thanh Hợp Kích chung của cả phòng
    // đầy rồi thì giữ nguyên ở mức đầy, không cộng dồn thêm
    if (gift.skill !== 'team_combo') this.comboMeter = Math.min(COMBO_GOAL, this.comboMeter + value);
    this.lastGiftAt = this.time;
    this.nudge = null;
    const skill = SKILLS[gift.skill];
    this.giftToasts.push({
      id: this.toastSeq++,
      user: user.name,
      gift,
      // quà giả lập cũng hiện bằng quà thật tương ứng (nếu đã biết bảng quà) cho giống lúc live
      label: label ?? this.realGifts[gift.skill]?.name,
      image: image ?? (label ? undefined : this.realGifts[gift.skill]?.image),
      count,
      skillName: skill.name,
      heroName: casterName(skill.hero),
      expires: this.time + 4.5,
    });
    if (this.giftToasts.length > 3) this.giftToasts.shift();
    sfx.gift(gift.tier);

    if (this.phase === 'battle' || this.phase === 'wiped') {
      this.performSkill(gift.skill, count);
    } else if (this.phase !== 'complete' && this.phase !== 'final_walk') {
      if (gift.skill === 'team_combo') this.saveCombo(count);
      else this.pendingSkills.push({ skill: gift.skill, count });
    }
  }

  // ---------- kỹ năng ----------

  private hero(id: HeroId) {
    return this.heroes.find((h) => h.def.id === id)!;
  }

  private reviveIfKo(h: HeroState) {
    if (!h.ko) return;
    h.ko = false;
    h.hp = Math.round(h.def.maxHp * TANG.reviveRatio);
    h.healT = 0.8;
    this.text(h.def.x, GROUND_Y - 175 - (h.def.x % 3) * 18, 'HỒI SINH', '#7dffb0', 24);
    this.burst(h.def.x, GROUND_Y - 70, '#7dffb0', 18, 'glow');
    if (this.phase === 'wiped') {
      this.setPhase('battle');
      this.boss.attackTimer = 3;
    }
  }

  private performSkill(skillId: SkillId, count: number) {
    if (this.phase !== 'battle' && this.phase !== 'wiped') return;
    const def = SKILLS[skillId];

    if (skillId === 'team_combo') {
      // đang diễn hợp kích thì để dành cho kiếp nạn sau; tặng nhiều thì mỗi quà hạ một boss
      if (this.combo.active) {
        this.saveCombo(count);
        return;
      }
      if (count > 1) this.saveCombo(count - 1, false);
      this.teamCombo();
      return;
    }

    if (skillId === 'tg_seal') {
      this.tangSeal(count);
      return;
    }

    if (def.hero === 'tang' || def.hero === 'team') return;
    const h = this.hero(def.hero);
    this.reviveIfKo(h);

    if (skillId === 'st_shield') {
      this.shieldT = Math.min(SHIELD.maxDuration, this.shieldT + SHIELD.duration * count);
      this.animate(h, 'shield', 0.9);
      this.later(0.35, () => {
        sfx.shield();
        this.ring(250, GROUND_Y - 70, 40, 330, '#7fd4ff', 1.0, 10);
        this.heroes.forEach((x) => {
          if (x.ko) return;
          const amt = Math.round(x.def.maxHp * 0.06);
          x.hp = Math.min(x.def.maxHp, x.hp + amt);
          this.text(x.def.x, GROUND_Y - 160, `+${amt}`, '#7fd4ff', 28);
        });
        this.showCallout(def.name.toUpperCase(), '#7fd4ff');
      });
      return;
    }

    const hits = Math.min(count, skillId === 'wk_ultimate' ? 2 : skillId === 'bj_slam' ? 3 : 6);
    const mult = count / hits;
    const gaps: Partial<Record<SkillId, number>> = { wk_ultimate: 2.0, bj_quake: 1.0, bj_slam: 1.3, st_crescent: 0.45 };
    for (let i = 0; i < hits; i++) {
      const gap = gaps[skillId] ?? 0.55;
      this.later(i * gap, () => this.doSkill(skillId, def.damage * mult, i === 0));
    }
  }

  private doSkill(skillId: SkillId, damage: number, announce: boolean) {
    if (this.phase !== 'battle' && this.phase !== 'wiped') return;
    const def = SKILLS[skillId];
    if (def.hero === 'tang' || def.hero === 'team') return;
    const h = this.hero(def.hero);
    this.reviveIfKo(h);
    if (announce) this.showCallout(def.name.toUpperCase(), h.def.color);

    if (skillId === 'st_crescent') {
      this.animate(h, 'crescent', 0.5);
      this.later(0.22, () => this.crescentWave(h, damage));
      return;
    }
    if (skillId === 'bj_slam') {
      this.animate(h, 'slam', 1.1);
      sfx.shield();
      this.later(0.72, () => this.slamImpact(damage, false));
      return;
    }

    if (skillId === 'wk_staff') {
      this.animate(h, 'staff', 0.6);
      this.later(0.3, () => {
        sfx.hit();
        this.slash(BOSS_X - 20, BOSS_Y, -0.6, '#ffd24a', 170);
        this.burst(BOSS_X - 20, BOSS_Y, '#ffd24a', 22, 'spark');
        this.shake = Math.max(this.shake, 8);
        this.damageBoss(damage, '#ffd24a', 40);
      });
    } else if (skillId === 'bj_quake') {
      this.animate(h, 'quake', 0.9);
      this.later(0.55, () => {
        sfx.heavy();
        this.shake = Math.max(this.shake, 18);
        this.flash = { color: '#ffb3d1', a: 0.35 };
        this.ring(h.def.x + 60, GROUND_Y, 20, 520, '#ff9ec4', 0.8, 14, true);
        this.ring(h.def.x + 60, GROUND_Y, 10, 380, '#fff', 0.6, 6, true);
        for (let i = 0; i < 26; i++) {
          this.particles.push({
            x: rand(260, 700),
            y: GROUND_Y + rand(-6, 6),
            vx: rand(-40, 40),
            vy: rand(-520, -220),
            life: 0,
            max: rand(0.6, 1.1),
            size: rand(6, 14),
            color: pick(['#8a5a3a', '#b07a52', '#ffd1e3']),
            kind: 'spark',
            gravity: 1200,
            rot: 0,
            vr: 0,
          });
        }
        this.minions.forEach((m) => this.killMinion(m));
        this.damageBoss(damage, '#ff9ec4', 52);
      });
    } else if (skillId === 'wk_ultimate') {
      this.animate(h, 'ultimate', 1.6);
      sfx.ultimate();
      this.flash = { color: '#ffe066', a: 0.5 };
      const clones = 6;
      for (let i = 0; i < clones; i++) {
        const ang = (i / clones) * Math.PI * 2;
        this.later(0.1 + i * 0.12, () => {
          this.clones.push({
            x: BOSS_X + Math.cos(ang) * 150,
            y: BOSS_Y + Math.sin(ang) * 110 + 40,
            t: 0,
            max: 1.3,
            flip: Math.cos(ang) > 0,
          });
          this.burst(BOSS_X + Math.cos(ang) * 150, BOSS_Y + Math.sin(ang) * 110, '#ffe066', 10, 'smoke');
        });
        this.later(0.5 + i * 0.12, () => {
          sfx.hit();
          this.slash(BOSS_X + rand(-40, 40), BOSS_Y + rand(-60, 60), rand(-1.5, 1.5), '#ffe066', 200);
          this.burst(BOSS_X, BOSS_Y, '#ffe066', 10, 'spark');
          this.shake = Math.max(this.shake, 10);
          this.damageBoss(damage / (clones + 2), '#ffe066', 36);
        });
      }
      this.later(0.5 + clones * 0.12 + 0.25, () => {
        sfx.heavy();
        this.flash = { color: '#fff6c2', a: 0.8 };
        this.shake = Math.max(this.shake, 26);
        this.ring(BOSS_X, BOSS_Y, 30, 460, '#ffe066', 0.9, 18);
        this.burst(BOSS_X, BOSS_Y, '#ffe066', 50, 'spark');
        this.minions.forEach((m) => this.killMinion(m));
        this.damageBoss((damage * 2) / (clones + 2), '#ffffff', 72);
      });
    }
  }

  /** Sa Tăng phóng trăng khuyết: xuyên qua lâu la rồi trúng boss */
  private crescentWave(h: HeroState, damage: number, comboHit = false) {
    sfx.hit();
    this.projectiles.push({
      x0: h.def.x + 40,
      y0: GROUND_Y - 90,
      x1: BOSS_X - 10,
      y1: BOSS_Y - 10,
      t: 0,
      dur: 0.38,
      kind: 'crescent',
      onHit: () => {
        sfx.heavy();
        this.slash(BOSS_X - 10, BOSS_Y - 10, 1.2, '#7fd4ff', 190);
        this.burst(BOSS_X - 10, BOSS_Y - 10, '#bfefff', 18, 'spark');
        this.shake = Math.max(this.shake, 9);
        this.minions.forEach((m) => {
          if (m.dead) return;
          m.hp -= damage;
          m.hurtT = 0.2;
          if (m.hp <= 0) this.killMinion(m);
        });
        if (comboHit) this.comboDamage(damage, '#7fd4ff', 40);
        else this.damageBoss(damage, '#7fd4ff', 38);
      },
    });
  }

  /** Bát Giới từ trên trời nện xuống đầu boss */
  private slamImpact(damage: number, comboHit: boolean) {
    sfx.heavy();
    this.shake = Math.max(this.shake, 24);
    this.flash = { color: '#ffb3d1', a: 0.45 };
    this.ring(BOSS_X - 60, GROUND_Y, 20, 480, '#ff9ec4', 0.8, 16, true);
    this.ring(BOSS_X - 60, GROUND_Y, 10, 300, '#ffffff', 0.6, 8, true);
    this.ring(BOSS_X - 40, BOSS_Y - 40, 20, 200, '#ffd1e3', 0.5, 10);
    for (let i = 0; i < 30; i++) {
      this.particles.push({
        x: BOSS_X - 60 + rand(-160, 160),
        y: GROUND_Y + rand(-6, 6),
        vx: rand(-120, 120),
        vy: rand(-620, -260),
        life: 0,
        max: rand(0.6, 1.1),
        size: rand(6, 14),
        color: pick(['#8a5a3a', '#b07a52', '#ffd1e3']),
        kind: 'spark',
        gravity: 1300,
        rot: 0,
        vr: 0,
      });
    }
    this.minions.forEach((m) => this.killMinion(m));
    if (comboHit) this.comboDamage(damage, '#ff9ec4', 56);
    else this.damageBoss(damage, '#ff9ec4', 56);
  }

  /** Đường Tăng niệm Kim Cang Chú: boss bị định thân, không đánh được và nhận thêm sát thương */
  private tangSeal(count: number) {
    this.tang.chantT = 1.4;
    this.showCallout(SKILLS.tg_seal.name.toUpperCase(), '#ffd24a');
    this.later(0.5, () => {
      if (this.phase !== 'battle' && this.phase !== 'wiped') return;
      sfx.gong();
      this.sealT = Math.min(SEAL.maxDuration, this.sealT + SEAL.duration * count);
      this.boss.castT = 0;
      this.flash = { color: '#fff1b0', a: 0.35 };
      this.ring(BOSS_X, GROUND_Y, 20, 260, '#ffd24a', 0.9, 10, true);
      this.ring(BOSS_X, BOSS_Y - 30, 200, 60, '#ffe98a', 0.6, 8);
      this.burst(BOSS_X, BOSS_Y - 40, '#ffe98a', 24, 'glow');
      this.text(BOSS_X - 20, BOSS_Y - 210, 'ĐỊNH!', '#ffe066', 54);
    });
  }

  /** để dành Hợp Kích cho boss kế tiếp (boss hiện tại đã chết hoặc đang diễn hợp kích) */
  private saveCombo(count: number, announce = true) {
    this.pendingSkills.push({ skill: 'team_combo', count });
    if (announce) {
      this.callout = { id: this.toastSeq++, text: 'HỢP KÍCH ĐỂ DÀNH CHO YÊU QUÁI SAU!', color: '#fff2a8', expires: this.time + 2.4 };
    }
  }

  /** số lần Hợp Kích đang để dành */
  savedCombos(): number {
    return this.pendingSkills.filter((q) => q.skill === 'team_combo').reduce((a, q) => a + q.count, 0);
  }

  /** sát thương trong lúc hợp kích: luôn chừa boss 1 máu cho đòn kết liễu */
  private comboDamage(amount: number, color: string, size: number) {
    const cap = Math.max(0, this.boss.hp - 1);
    if (cap <= 0) return;
    const dmg = Math.max(1, Math.round(Math.min(cap, amount)));
    this.damageBoss(dmg, color, size, true);
    this.text(BOSS_X + rand(-40, 40), BOSS_Y - 150 + rand(-20, 20), `-${dmg}`, color, size);
  }

  /**
   * CHIÊU ĐẶC BIỆT: cả 4 thầy trò hợp kích, hạ boss ngay.
   * 0.0s Đường Tăng định thân · 0.9s Sa Tăng 3 trăng khuyết · 1.8s Bát Giới giáng thế
   * 2.7s Ngộ Không phân thân · 3.6s gậy Như Ý khổng lồ từ trời rơi xuống, boss tan biến.
   */
  private teamCombo() {
    if (this.phase !== 'battle' && this.phase !== 'wiped') return;
    const alive = () => this.phase === 'battle' || this.phase === 'wiped';
    // cả đội đứng dậy, hồi đầy máu
    this.heroes.forEach((h) => {
      this.reviveIfKo(h);
      h.hp = h.def.maxHp;
      h.healT = 1;
    });
    if (this.phase === 'wiped') this.setPhase('battle');
    this.combo = { active: true, t: 0, landed: false };
    this.projectiles = [];
    this.sealT = Math.max(this.sealT, 6);
    this.boss.castT = 0;
    sfx.ultimate();
    sfx.gong();
    this.flash = { color: '#fff2a8', a: 0.7 };
    this.shake = Math.max(this.shake, 14);
    this.showCallout('THẦY TRÒ HỢP KÍCH!', '#fff2a8');

    // 1. Đường Tăng
    this.tang.chantT = 4.2;
    this.later(0.35, () => {
      if (!alive()) return;
      this.showCallout('ĐƯỜNG TĂNG · KIM CANG CHÚ', '#ffd24a');
      this.ring(BOSS_X, GROUND_Y, 20, 300, '#ffd24a', 1.0, 12, true);
      this.ring(TANG.x, GROUND_Y - 100, 20, 600, '#fff2a8', 1.2, 10);
      this.text(BOSS_X - 20, BOSS_Y - 210, 'ĐỊNH!', '#ffe066', 60);
      sfx.heal();
    });
    // 2. Sa Tăng
    const sha = this.hero('sha');
    this.later(0.9, () => alive() && this.showCallout('SA TĂNG · NGUYỆT NHA PHI TRẢM', '#7fd4ff'));
    for (let i = 0; i < 3; i++) {
      this.later(0.9 + i * 0.22, () => {
        if (!alive()) return;
        this.animate(sha, 'crescent', 0.3);
        this.crescentWave(sha, this.stage.boss.maxHp * 0.06, true);
      });
    }
    // 3. Bát Giới
    const bajie = this.hero('bajie');
    this.later(1.8, () => {
      if (!alive()) return;
      this.showCallout('BÁT GIỚI · THIÊN BỒNG GIÁNG THẾ', '#ff9ec4');
      this.animate(bajie, 'slam', 1.1);
    });
    this.later(1.8 + 0.72, () => alive() && this.slamImpact(this.stage.boss.maxHp * 0.15, true));
    // 4. Ngộ Không
    const wk = this.hero('wukong');
    this.later(2.7, () => {
      if (!alive()) return;
      this.showCallout('NGỘ KHÔNG · THÂN NGOẠI THÂN', '#ffe066');
      this.animate(wk, 'ultimate', 1.6);
      sfx.ultimate();
      this.flash = { color: '#ffe066', a: 0.4 };
    });
    const clones = 8;
    for (let i = 0; i < clones; i++) {
      const ang = (i / clones) * Math.PI * 2;
      this.later(2.75 + i * 0.06, () => {
        if (!alive()) return;
        this.clones.push({ x: BOSS_X + Math.cos(ang) * 160, y: BOSS_Y + Math.sin(ang) * 120 + 40, t: 0, max: 1.1, flip: Math.cos(ang) > 0 });
        this.burst(BOSS_X + Math.cos(ang) * 160, BOSS_Y + Math.sin(ang) * 120, '#ffe066', 8, 'smoke');
      });
      this.later(3.0 + i * 0.06, () => {
        if (!alive()) return;
        sfx.hit();
        this.slash(BOSS_X + rand(-50, 50), BOSS_Y + rand(-70, 60), rand(-1.5, 1.5), '#ffe066', 220);
        this.shake = Math.max(this.shake, 12);
        this.comboDamage(this.stage.boss.maxHp * 0.03, '#ffe066', 34);
      });
    }
    // 5. Kết liễu: gậy Như Ý khổng lồ
    this.later(3.6, () => alive() && this.showCallout('TÂY THIÊN DIỆT MA!', '#ffffff'));
    this.later(COMBO_IMPACT, () => {
      if (!alive()) return;
      sfx.heavy();
      sfx.victory();
      this.flash = { color: '#ffffff', a: 1 };
      this.shake = 44;
      for (let i = 0; i < 4; i++) this.ring(BOSS_X, BOSS_Y - 20, 30 + i * 20, 520 + i * 160, i % 2 ? '#ffffff' : '#ffe066', 0.9 + i * 0.2, 22 - i * 4);
      this.ring(BOSS_X, GROUND_Y, 30, 700, '#ffe066', 1.1, 18, true);
      this.burst(BOSS_X, BOSS_Y, '#ffe066', 80, 'spark');
      this.burst(BOSS_X, BOSS_Y, '#ffffff', 40, 'glow');
      this.text(BOSS_X - 150, BOSS_Y - 260, `-${Math.ceil(this.boss.hp)}`, '#fff2a8', 90);
      this.combo.landed = true;
      this.damageBoss(this.boss.hp, '#fff2a8', 1, true);
    });
    this.later(COMBO_IMPACT + 0.8, () => (this.combo.active = false));
  }

  private animate(h: HeroState, kind: AttackKind, dur: number) {
    h.attackKind = kind;
    h.attackT = dur;
    h.attackDur = dur;
  }

  private tryCastHeal() {
    if (this.tang.castT > 0 || this.tang.energy < TANG.energyMax) return;
    if (this.phase === 'complete' || this.phase === 'final_walk') return;
    this.tang.energy -= TANG.energyMax;
    this.tang.castT = this.tang.castDur;
    this.showCallout('ĐƯỜNG TĂNG · PHẬT QUANG PHỔ CHIẾU', '#9dffc4');
    this.later(this.tang.castDur * 0.7, () => {
      sfx.heal();
      this.flash = { color: '#d6ffe6', a: 0.35 };
      this.ring(TANG.x, GROUND_Y - 80, 20, 420, '#9dffc4', 1.1, 10);
      this.heroes.forEach((h) => {
        if (h.ko) {
          this.reviveIfKo(h);
        } else {
          const amt = Math.min(h.def.maxHp - h.hp, Math.round(h.def.maxHp * TANG.healRatio));
          h.hp += amt;
          h.healT = 0.8;
          this.text(h.def.x, GROUND_Y - 170, `+${amt}`, '#7dffb0', 34);
        }
        for (let i = 0; i < 12; i++) {
          this.particles.push({
            x: h.def.x + rand(-30, 30),
            y: GROUND_Y - rand(0, 40),
            vx: rand(-15, 15),
            vy: rand(-180, -80),
            life: 0,
            max: rand(0.8, 1.4),
            size: rand(4, 9),
            color: pick(['#9dffc4', '#fff6b0', '#ffffff']),
            kind: 'glow',
            gravity: -40,
            rot: 0,
            vr: 0,
          });
        }
      });
      if (this.phase === 'wiped') {
        this.setPhase('battle');
        this.boss.attackTimer = 3;
      }
    });
    // nếu còn dư năng lượng thì sẽ tự hồi tiếp sau khi niệm chú xong
    this.later(this.tang.castDur + 0.3, () => this.tryCastHeal());
  }

  // ---------- boss ----------

  private aliveHeroes() {
    return this.heroes.filter((h) => !h.ko);
  }

  private bossAttack(strong = false) {
    const def = this.stage.boss;
    const alive = this.aliveHeroes();
    if (alive.length === 0) return;
    this.boss.attackCount += 1;
    const n = this.boss.attackCount;

    if (n % def.summonEvery === 0 && this.minions.filter((m) => !m.dead).length < def.maxMinions) {
      this.summonMinions(2);
    }

    if (n % def.aoeEvery === 0 || strong) {
      this.boss.castT = 0.9;
      this.showCallout(`${def.aoeName}!`, this.stage.palette.accent);
      this.later(0.6, () => {
        sfx.bossAttack();
        this.flash = { color: def.projectile === 'fire' ? '#ff5a1f' : def.projColor ?? '#7a3cff', a: 0.3 };
        this.aliveHeroes().forEach((h, i) => {
          this.projectiles.push({
            x0: BOSS_X - 40,
            y0: BOSS_Y - 20,
            x1: h.def.x,
            y1: GROUND_Y - 70,
            t: -i * 0.05,
            dur: 0.45,
            kind: 'aoe',
            onHit: () => this.damageHero(h, def.aoeDamage * (strong ? 1.6 : 1) * (this.boss.enraged ? 1.2 : 1)),
          });
        });
      });
      return;
    }

    const target = pick(alive);
    this.boss.lungeT = 0.5;
    this.later(0.2, () => {
      sfx.bossAttack();
      this.projectiles.push({
        x0: BOSS_X - 60,
        y0: BOSS_Y,
        x1: target.def.x,
        y1: GROUND_Y - 70,
        t: 0,
        dur: 0.4,
        kind: def.projectile,
        onHit: () => this.damageHero(target, rand(def.damage[0], def.damage[1]) * (this.boss.enraged ? 1.25 : 1)),
      });
    });
  }

  private summonMinions(n: number) {
    const def = this.stage.boss;
    for (let i = 0; i < n; i++) {
      const slot = this.minions.filter((m) => !m.dead).length;
      if (slot >= def.maxMinions) break;
      this.minions.push({
        id: this.minionSeq++,
        x: BOSS_X,
        tx: 470 + slot * 32 - (slot % 2) * 10,
        y: GROUND_Y,
        hp: def.minionHp,
        maxHp: def.minionHp,
        attackTimer: rand(1.5, 2.5),
        hopT: 0,
        hurtT: 0,
        dieT: 0,
        dead: false,
      });
      this.burst(BOSS_X - 30, GROUND_Y - 30, this.stage.palette.accent, 10, 'smoke');
    }
    this.text(BOSS_X - 60, BOSS_Y - 190, 'Triệu hồi lâu la!', this.stage.palette.accent, 26);
  }

  private killMinion(m: Minion) {
    if (m.dead) return;
    m.dead = true;
    m.dieT = 0.6;
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: m.x,
        y: m.y - 30,
        vx: rand(-160, 160),
        vy: rand(-380, -120),
        life: 0,
        max: rand(0.6, 1),
        size: rand(5, 10),
        color: this.stage.boss.debris[0],
        kind: 'bone',
        gravity: 900,
        rot: rand(0, 6),
        vr: rand(-12, 12),
      });
    }
  }

  private damageBoss(amount: number, color: string, size: number, exact = false) {
    if (this.phase !== 'battle' && this.phase !== 'wiped') return;
    // boss bị định thân nhận thêm sát thương
    const mult = !exact && this.sealT > 0 ? SEAL.damageTaken : 1;
    const dmg = Math.max(1, Math.round(amount * mult));
    this.boss.hp = Math.max(0, this.boss.hp - dmg);
    this.boss.hurtT = 0.25;
    if (!exact) this.text(BOSS_X + rand(-40, 40), BOSS_Y - 150 + rand(-20, 20), `-${dmg}`, color, size);
    const def = this.stage.boss;
    if (!this.boss.enraged && this.boss.hp < def.maxHp * 0.5) {
      this.boss.enraged = true;
      this.text(BOSS_X - 40, BOSS_Y - 230, 'NỔI GIẬN!', '#ff5a7a', 40);
    }
    if (this.boss.hp <= 0) {
      this.boss.dieT = 0.001;
      this.flash = { color: '#ffffff', a: 0.9 };
      this.shake = 30;
      this.burst(BOSS_X, BOSS_Y, def.debris[0], 40, 'bone');
      this.burst(BOSS_X, BOSS_Y, def.debris[1], 40, 'glow');
      this.setPhase('victory');
    }
  }

  private damageHero(h: HeroState, raw: number) {
    if (h.ko || (this.phase !== 'battle' && this.phase !== 'wiped')) return;
    let dmg = raw;
    if (this.shieldT > 0) {
      dmg *= 1 - SHIELD.reduction;
      this.ring(h.def.x, GROUND_Y - 70, 30, 90, '#7fd4ff', 0.35, 5);
    }
    dmg = Math.max(1, Math.round(dmg));
    h.hp = Math.max(0, h.hp - dmg);
    h.hurtT = 0.35;
    this.shake = Math.max(this.shake, 6);
    this.text(h.def.x + rand(-20, 20), GROUND_Y - 170, `-${dmg}`, this.shieldT > 0 ? '#9fdcff' : '#ff4d6d', 32);
    this.burst(h.def.x, GROUND_Y - 70, '#ff6b8a', 8, 'spark');
    sfx.hurt();
    if (h.hp <= 0) {
      h.ko = true;
      h.attackT = 0;
      this.text(h.def.x, GROUND_Y - 210, 'GỤC NGÃ', '#ff8fa3', 30);
      if (this.aliveHeroes().length === 0) this.setPhase('wiped');
    }
  }

  // ---------- hiệu ứng ----------

  private later(delay: number, fn: () => void) {
    this.scheduled.push({ at: this.time + delay, fn });
  }

  private text(x: number, y: number, text: string, color: string, size: number) {
    this.texts.push({ x, y, text, color, size, life: 0, max: 1.2 });
  }

  private ring(x: number, y: number, r0: number, r1: number, color: string, max: number, width: number, flat = false) {
    this.rings.push({ x, y, r0, r1, color, life: 0, max, width, flat });
  }

  private slash(x: number, y: number, angle: number, color: string, size: number) {
    this.slashes.push({ x, y, angle, color, size, life: 0, max: 0.35 });
  }

  private burst(x: number, y: number, color: string, n: number, kind: Particle['kind']) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(120, 460);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 80,
        life: 0,
        max: rand(0.4, 0.9),
        size: kind === 'smoke' ? rand(14, 26) : rand(3, 8),
        color,
        kind,
        gravity: kind === 'bone' ? 900 : kind === 'smoke' ? -60 : 300,
        rot: rand(0, 6),
        vr: rand(-10, 10),
      });
    }
  }

  private spawnHeart() {
    this.particles.push({
      x: rand(560, 690),
      y: 1010,
      vx: rand(-60, 20),
      vy: rand(-260, -170),
      life: 0,
      max: rand(1.6, 2.4),
      size: rand(18, 30),
      color: pick(['#ff4d8d', '#ff7aa8', '#ff2d55', '#ffb3c8']),
      kind: 'heart',
      gravity: 0,
      rot: rand(-0.4, 0.4),
      vr: 0,
    });
  }

  private showCallout(text: string, color: string) {
    this.callout = { id: this.toastSeq++, text, color, expires: this.time + 1.6 };
  }

  // ---------- vòng lặp ----------

  tick(dtRaw: number) {
    const dt = Math.min(0.05, dtRaw);
    this.time += dt;
    this.phaseT += dt;

    // hàng đợi hành động hẹn giờ
    if (this.scheduled.length) {
      const due = this.scheduled.filter((s) => s.at <= this.time);
      if (due.length) {
        this.scheduled = this.scheduled.filter((s) => s.at > this.time);
        due.forEach((s) => s.fn());
      }
    }

    // các pha
    switch (this.phase) {
      case 'walking':
        this.worldX += 150 * dt;
        if (this.phaseT >= TIMING.walk) this.setPhase('intro');
        break;
      case 'intro':
        this.boss.enterT = Math.min(1, this.phaseT / (TIMING.intro * 0.7));
        if (this.phaseT >= TIMING.intro) this.setPhase('battle');
        break;
      case 'battle':
        this.updateBattle(dt);
        break;
      case 'victory':
        this.boss.dieT += dt;
        if (this.phaseT >= TIMING.victory) {
          if (this.stageIndex < STAGES.length - 1) {
            this.stageIndex += 1;
            const keepHp = this.heroes.map((h) => ({ hp: Math.max(h.hp, h.def.maxHp * 0.5) }));
            this.setupStage();
            this.heroes.forEach((h, i) => (h.hp = Math.round(Math.min(h.def.maxHp, keepHp[i].hp))));
            this.setPhase('walking');
          } else {
            this.setPhase('final_walk');
          }
        }
        break;
      case 'final_walk':
        this.worldX += 150 * dt;
        if (this.phaseT >= TIMING.finalWalk) this.setPhase('complete');
        break;
      case 'complete':
        if (Math.random() < dt * 8) {
          this.particles.push({
            x: rand(0, W),
            y: -20,
            vx: rand(-30, 30),
            vy: rand(60, 140),
            life: 0,
            max: 6,
            size: rand(8, 14),
            color: pick(['#ffd6e8', '#ffe066', '#ffffff']),
            kind: 'petal',
            gravity: 0,
            rot: rand(0, 6),
            vr: rand(-3, 3),
          });
        }
        break;
      case 'wiped':
        break;
    }

    // không khí riêng của từng kiếp nạn
    if (this.phase !== 'complete' && this.phase !== 'final_walk') this.spawnAmbient(dt);

    // nhân vật
    for (const h of this.heroes) {
      h.attackT = Math.max(0, h.attackT - dt);
      if (h.attackT === 0) h.attackKind = null;
      h.hurtT = Math.max(0, h.hurtT - dt);
      h.healT = Math.max(0, h.healT - dt);
    }
    this.tang.castT = Math.max(0, this.tang.castT - dt);
    this.tang.chantT = Math.max(0, this.tang.chantT - dt);
    if (this.combo.active) this.combo.t += dt;
    this.boss.hurtT = Math.max(0, this.boss.hurtT - dt);
    this.boss.lungeT = Math.max(0, this.boss.lungeT - dt);
    this.boss.castT = Math.max(0, this.boss.castT - dt);
    this.shieldT = Math.max(0, this.shieldT - dt);
    if (this.phase === 'battle' || this.phase === 'wiped') this.sealT = Math.max(0, this.sealT - dt);

    // lâu la
    for (const m of this.minions) {
      if (m.dead) {
        m.dieT -= dt;
        continue;
      }
      m.x += (m.tx - m.x) * Math.min(1, dt * 3);
      m.hopT += dt;
      m.hurtT = Math.max(0, m.hurtT - dt);
    }
    this.minions = this.minions.filter((m) => !m.dead || m.dieT > 0);

    // đạn
    for (const p of this.projectiles) {
      p.t += dt;
      if (p.t >= p.dur) p.onHit();
    }
    this.projectiles = this.projectiles.filter((p) => p.t < p.dur);
    if (this.projectiles.length && this.phase !== 'battle' && this.phase !== 'wiped') this.projectiles = [];

    // hạt
    for (const p of this.particles) {
      p.life += dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.kind === 'heart') p.vx += Math.sin(p.life * 5 + p.size) * 40 * dt;
    }
    this.particles = this.particles.filter((p) => p.life < p.max);
    if (this.particles.length > 600) this.particles.splice(0, this.particles.length - 600);
    for (const t of this.texts) {
      t.life += dt;
      t.y -= 60 * dt;
    }
    this.texts = this.texts.filter((t) => t.life < t.max);
    for (const r of this.rings) r.life += dt;
    this.rings = this.rings.filter((r) => r.life < r.max);
    for (const s of this.slashes) s.life += dt;
    this.slashes = this.slashes.filter((s) => s.life < s.max);
    for (const c of this.clones) c.t += dt;
    this.clones = this.clones.filter((c) => c.t < c.max);

    this.shake = Math.max(0, this.shake - dt * 60);
    this.flash.a = Math.max(0, this.flash.a - dt * 1.8);

    // toast
    this.joinToasts = this.joinToasts.filter((t) => t.expires > this.time);
    this.giftToasts = this.giftToasts.filter((t) => t.expires > this.time);
    if (this.callout && this.callout.expires <= this.time) this.callout = null;

    // đủ xu thì tự hợp kích
    if (this.phase === 'battle' && !this.combo.active && this.comboMeter >= COMBO_GOAL && this.boss.hp > 0) {
      // chỉ về 0 khi thanh đầy được đem ra dùng
      this.comboMeter = 0;
      this.teamCombo();
    }

    this.updateNudge(dt);
    music.setMood(this.mood());
    music.duck(this.combo.active);

    // cảnh báo máu thấp
    if (this.isLowHp() && this.phase === 'battle') {
      this.alarmTimer -= dt;
      if (this.alarmTimer <= 0) {
        sfx.alarm();
        this.alarmTimer = 2;
      }
    } else {
      this.alarmTimer = 0;
    }

    this.publishTimer -= dt;
    if (this.publishTimer <= 0) this.publish(false);
  }

  /** phòng im một lúc thì nhân vật lần lượt nhắc quà nào ra chiêu gì */
  private updateNudge(dt: number) {
    if (this.nudge) {
      this.nudge.t += dt;
      if (this.nudge.t >= this.nudge.max) this.nudge = null;
    }
    const active = (this.phase === 'battle' || this.phase === 'wiped') && !this.combo.active;
    if (!active) {
      this.nudge = null;
      return;
    }
    this.nudgeTimer -= dt;
    if (this.nudgeTimer > 0 || this.nudge) return;
    // vừa có quà thì để yên một lúc
    if (this.time - this.lastGiftAt < 12) {
      this.nudgeTimer = 2;
      return;
    }
    this.nudgeTimer = 7;
    if (this.phase === 'wiped') {
      this.nudge = { speaker: 'tang', text: WIPED_NUDGE, t: 0, max: 4.5 };
      return;
    }
    type Line = { speaker: Exclude<Caster, 'team'>; text: string; image?: string };
    const known = Object.keys(this.realGifts).length > 0;
    const lines: Line[] = [];
    for (const g of GIFTS) {
      const sk = SKILLS[g.skill];
      const speaker = sk.hero === 'team' ? 'tang' : sk.hero;
      const alive = speaker === 'tang' || !this.hero(speaker).ko;
      if (!alive || (known && !this.realGifts[g.skill])) continue;
      lines.push({
        speaker,
        text: sk.nudge.replace('{qua}', giftPhrase(g.skill, this.realGifts)),
        image: this.realGifts[g.skill]?.image,
      });
    }
    lines.push({ speaker: 'tang', text: HEART_NUDGE });
    const line = lines[this.nudgeIdx % lines.length];
    this.nudgeIdx += 1;
    this.nudge = { ...line, t: 0, max: 4.5 };
  }

  private updateBattle(dt: number) {
    const def = this.stage.boss;
    // đang hợp kích: mọi thứ khác đứng yên
    if (this.combo.active) return;
    // boss tấn công (bị định thân thì đứng im)
    if (this.sealT <= 0) this.boss.attackTimer -= dt;
    if (this.boss.attackTimer <= 0) {
      this.bossAttack();
      const interval = def.attackInterval * (this.boss.enraged ? 0.75 : 1);
      this.boss.attackTimer = interval + rand(-0.4, 0.4);
    }
    // lâu la tấn công
    for (const m of this.minions) {
      if (m.dead) continue;
      m.attackTimer -= dt;
      if (m.attackTimer <= 0) {
        m.attackTimer = rand(2, 2.8);
        const alive = this.aliveHeroes();
        if (alive.length) {
          const target = pick(alive);
          this.projectiles.push({
            x0: m.x,
            y0: m.y - 40,
            x1: target.def.x,
            y1: GROUND_Y - 60,
            t: 0,
            dur: 0.5,
            kind: 'minion',
            onHit: () => this.damageHero(target, def.minionDamage),
          });
        }
      }
    }
    // đệ tử tự đánh nhẹ
    for (const h of this.heroes) {
      if (h.ko || h.attackT > 0) continue;
      h.autoTimer -= dt;
      if (h.autoTimer <= 0) {
        h.autoTimer = AUTO_ATTACK.interval + rand(-0.5, 0.6);
        this.animate(h, 'auto', 0.4);
        const living = this.minions.filter((m) => !m.dead);
        this.later(0.2, () => {
          if (this.phase !== 'battle') return;
          const dmg = Math.round(rand(AUTO_ATTACK.damage[0], AUTO_ATTACK.damage[1]));
          const m = living.find((x) => !x.dead);
          if (m) {
            m.hp -= dmg * 3;
            m.hurtT = 0.2;
            this.text(m.x, m.y - 80, `-${dmg * 3}`, '#ffffff', 22);
            if (m.hp <= 0) this.killMinion(m);
          } else {
            this.damageBoss(dmg, '#ffffff', 24);
          }
        });
      }
    }
  }

  private spawnAmbient(dt: number) {
    const amb = this.stage.ambient;
    if (!amb) return;
    const rates: Record<string, number> = { embers: 14, snow: 18, sand: 22, bubbles: 8, petals: 6, sparkles: 10 };
    if (Math.random() > dt * (rates[amb.kind] ?? 10)) return;
    const color = pick(amb.colors);
    const base = { life: 0, rot: rand(0, 6), vr: rand(-2, 2), color };
    switch (amb.kind) {
      case 'embers':
        this.particles.push({ ...base, x: rand(0, W), y: rand(900, 1000), vx: rand(-20, 30), vy: rand(-120, -60), max: rand(2.5, 4.5), size: rand(2, 4.5), kind: 'glow', gravity: -10 });
        break;
      case 'snow':
        this.particles.push({ ...base, x: rand(-40, W), y: -10, vx: rand(5, 30), vy: rand(50, 110), max: 14, size: rand(2, 5), kind: 'spark', gravity: 0 });
        break;
      case 'sand':
        this.particles.push({ ...base, x: W + 10, y: rand(250, 980), vx: rand(-420, -240), vy: rand(-20, 20), max: 3, size: rand(1.5, 3.5), kind: 'spark', gravity: 0 });
        break;
      case 'bubbles':
        this.particles.push({ ...base, x: rand(0, W), y: 1000, vx: rand(-10, 10), vy: rand(-80, -40), max: 8, size: rand(3, 7), kind: 'glow', gravity: 0 });
        break;
      case 'petals':
        this.particles.push({ ...base, x: rand(0, W + 100), y: -10, vx: rand(-50, -10), vy: rand(50, 100), max: 14, size: rand(5, 9), kind: 'petal', gravity: 0, vr: rand(-3, 3) });
        break;
      case 'sparkles':
        this.particles.push({ ...base, x: rand(0, W), y: rand(150, 900), vx: 0, vy: rand(-20, -5), max: rand(1, 2), size: rand(3, 6), kind: 'glow', gravity: 0 });
        break;
    }
  }

  /** nhận bảng quà thật của phòng live (từ relay) */
  setCatalog(gifts: RealGift[]) {
    if (!gifts.length) return;
    saveCatalog(gifts);
    this.realGifts = pickRealGifts(gifts);
    this.publish(true);
  }

  /** nhảy thẳng tới một kiếp nạn (chỉ dùng để thử nghiệm) */
  goToStage(index: number) {
    if (index < 0 || index >= STAGES.length) return;
    this.stageIndex = index;
    this.worldX = index * 2000;
    this.pendingSkills = [];
    this.setupStage();
    this.setPhase('intro');
  }

  /** nhạc nền theo cảnh */
  private mood(): Mood {
    switch (this.phase) {
      case 'walking':
      case 'victory':
        return 'walk';
      case 'intro':
      case 'battle':
        return this.boss.enraged ? 'rage' : 'battle';
      case 'wiped':
        return 'wiped';
      case 'final_walk':
      case 'complete':
        return 'calm';
    }
  }

  isLowHp() {
    const max = this.heroes.reduce((s, h) => s + h.def.maxHp, 0);
    const cur = this.heroes.reduce((s, h) => s + h.hp, 0);
    return cur / max < LOW_HP_RATIO && this.phase !== 'complete';
  }

  progress(): number {
    const n = STAGES.length;
    if (this.phase === 'complete') return 1;
    if (this.phase === 'final_walk') return Math.min(1, (n + this.phaseT / TIMING.finalWalk) / (n + 1));
    const bossFrac = 1 - this.boss.hp / this.stage.boss.maxHp;
    let seg = 0;
    if (this.phase === 'walking') seg = (this.phaseT / TIMING.walk) * 0.2;
    else seg = 0.2 + bossFrac * 0.8;
    return (this.stageIndex + seg) / (n + 1);
  }

  // ---------- cầu nối với React ----------

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  getSnapshot = () => this.snapshot;

  private publish(force: boolean) {
    if (!force && this.publishTimer > 0) return;
    this.publishTimer = 1 / 15;
    this.snapshot = this.buildSnapshot();
    this.listeners.forEach((fn) => fn());
  }

  private buildSnapshot(): UiSnapshot {
    const def = this.stage.boss;
    const top = [...this.contributions.values()].sort((a, b) => b.score - a.score).slice(0, 3);
    return {
      phase: this.phase,
      phaseT: this.phaseT,
      stageIndex: this.stageIndex,
      stageCount: STAGES.length,
      stage: this.stage,
      progress: this.progress(),
      boss: {
        name: def.name,
        icon: def.icon,
        title: def.title,
        hp: Math.ceil(this.boss.hp),
        maxHp: def.maxHp,
        enraged: this.boss.enraged,
        visible: this.phase === 'intro' || this.phase === 'battle' || this.phase === 'wiped',
      },
      heroes: this.heroes.map((h) => ({
        id: h.def.id,
        name: h.def.name,
        role: h.def.role,
        hp: Math.ceil(h.hp),
        maxHp: h.def.maxHp,
        ko: h.ko,
        color: h.def.color,
      })),
      energy: Math.min(TANG.energyMax, this.tang.energy),
      energyMax: TANG.energyMax,
      casting: this.tang.castT > 0,
      shieldT: this.shieldT,
      sealT: this.sealT,
      comboActive: this.combo.active,
      comboMeter: this.comboMeter,
      comboSaved: this.savedCombos(),
      realGifts: this.realGifts,
      comboGoal: COMBO_GOAL,
      lowHp: this.isLowHp() && (this.phase === 'battle' || this.phase === 'wiped'),
      companions: this.companions.slice(0, 7),
      companionCount: this.companions.length,
      joinToasts: [...this.joinToasts],
      giftToasts: [...this.giftToasts],
      callout: this.callout,
      totalLikes: this.totalLikes,
      topSupporters: top,
    };
  }
}
