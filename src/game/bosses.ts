/**
 * Hình vẽ boss cho kiếp nạn 3–10 (tự vẽ bằng Canvas, không dùng hình có bản quyền).
 * Phần lớn boss dùng chung khung "dáng người" (drawHumanoid) và chỉ đổi đầu / màu / vũ khí.
 */
import type { BossKind } from './config';
import type { GameEngine, Minion } from './engine';
import { circle, drawWukong, ellipse, flame, rrect, type Ctx } from './render';

type HeadFn = (ctx: Ctx, t: number, enraged: boolean, cast: number) => void;
type Weapon = 'trident' | 'spear' | 'hammer' | 'gourd' | 'cymbals' | 'saber' | 'whisk' | 'claws';

interface HumanLook {
  robe: string;
  robeDark: string;
  trim: string;
  skin: string;
  scale: number;
  weapon: Weapon;
  aura: [string, string];
  head: HeadFn;
  /** chân đứng trên bánh xe lửa (Hồng Hài Nhi) */
  fireWheels?: boolean;
}

function glowEyes(ctx: Ctx, pts: [number, number, number, number][], color: string) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = color;
  for (const [x, y, rx, ry] of pts) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function brows(ctx: Ctx, color: string, w = 4) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-26, -16);
  ctx.lineTo(-6, -9);
  ctx.moveTo(20, -16);
  ctx.lineTo(2, -9);
  ctx.stroke();
}

function fangs(ctx: Ctx, y: number) {
  ctx.fillStyle = '#fffbe8';
  for (const x of [-12, 4]) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 4, y + 10);
    ctx.lineTo(x + 8, y);
    ctx.closePath();
    ctx.fill();
  }
}

// ---------- đầu ----------

const weaselHead: HeadFn = (ctx, t, enraged) => {
  ctx.fillStyle = '#b07a22';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 10, -26);
    ctx.lineTo(sx * 26, -50);
    ctx.lineTo(sx * 30, -18);
    ctx.closePath();
    ctx.fill();
  }
  ellipse(ctx, 0, 0, 31, 33, '#c8902a');
  ellipse(ctx, -6, 10, 22, 20, '#f0cf8a');
  ellipse(ctx, -26, 10, 20, 12, '#e0b060');
  circle(ctx, -44, 7, 5, '#2a1a0a');
  glowEyes(ctx, [[-14, -8, 6, 3.5], [8, -8, 6, 3.5]], enraged ? '#ff3b1f' : '#ff9a1f');
  brows(ctx, '#5a3a0a');
  ctx.strokeStyle = 'rgba(40,20,0,0.8)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-34, 12 + i * 4);
    ctx.lineTo(-58, 6 + i * 7 + Math.sin(t * 6 + i) * 2);
    ctx.stroke();
  }
};

const childHead: HeadFn = (ctx, _t, enraged) => {
  // búi tóc
  for (const sx of [-1, 1]) {
    circle(ctx, sx * 20, -30, 12, '#1a0f0a');
    rrect(ctx, sx * 20 - 9, -24, 18, 5, 2, '#e8303a');
  }
  circle(ctx, 0, 0, 29, '#ffd2b0');
  ctx.fillStyle = '#1a0f0a';
  ctx.beginPath();
  ctx.arc(0, 0, 30, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  circle(ctx, -18, 10, 6, 'rgba(255,90,90,0.45)');
  circle(ctx, 14, 10, 6, 'rgba(255,90,90,0.45)');
  circle(ctx, -12, -2, 5.5, '#1a0f0a');
  circle(ctx, 8, -2, 5.5, '#1a0f0a');
  glowEyes(ctx, [[-12, -2, 2, 2], [8, -2, 2, 2]], enraged ? '#ff3b1f' : '#ff8a3d');
  brows(ctx, '#1a0f0a', 3.5);
  ctx.strokeStyle = '#8a2a1a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-10, 16);
  ctx.quadraticCurveTo(-2, 20, 8, 13);
  ctx.stroke();
  circle(ctx, -2, -16, 3, '#e8303a');
};

const fishHead: HeadFn = (ctx, t, enraged) => {
  // vây tai
  ctx.fillStyle = '#ffd06a';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 26, -4);
    ctx.quadraticCurveTo(sx * 58, -26 + Math.sin(t * 5) * 6, sx * 52, 18);
    ctx.closePath();
    ctx.fill();
  }
  ellipse(ctx, 0, 0, 34, 32, '#ff9a2a');
  ctx.strokeStyle = 'rgba(200,90,10,0.6)';
  ctx.lineWidth = 2;
  for (let r = 0; r < 2; r++)
    for (let c = 0; c < 4; c++) {
      ctx.beginPath();
      ctx.arc(-18 + c * 12, 14 + r * 8, 6, Math.PI, 0);
      ctx.stroke();
    }
  circle(ctx, -14, -8, 10, '#fff');
  circle(ctx, 12, -8, 10, '#fff');
  circle(ctx, -16, -8, 5, enraged ? '#c01a1a' : '#1a1a2a');
  circle(ctx, 10, -8, 5, enraged ? '#c01a1a' : '#1a1a2a');
  ellipse(ctx, -30, 12, 7, 6, '#c0501a');
  ctx.strokeStyle = '#ffd06a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-30, 16);
  ctx.quadraticCurveTo(-46, 30, -40, 42 + Math.sin(t * 4) * 3);
  ctx.moveTo(-26, 18);
  ctx.quadraticCurveTo(-30, 34, -22, 44 + Math.cos(t * 4) * 3);
  ctx.stroke();
  // vương miện
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.moveTo(-14, -28);
  ctx.lineTo(-10, -44);
  ctx.lineTo(-3, -32);
  ctx.lineTo(4, -46);
  ctx.lineTo(10, -32);
  ctx.lineTo(16, -42);
  ctx.lineTo(18, -26);
  ctx.closePath();
  ctx.fill();
};

const hornedHead: HeadFn = (ctx, _t, enraged) => {
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.moveTo(-8, -28);
  ctx.quadraticCurveTo(0, -70, 10, -80);
  ctx.quadraticCurveTo(8, -56, 10, -28);
  ctx.closePath();
  ctx.fill();
  ellipse(ctx, 0, 0, 32, 36, '#3f9a7e');
  rrect(ctx, -32, -26, 64, 9, 4, '#ffd24a');
  circle(ctx, 0, -22, 4, '#e8303a');
  glowEyes(ctx, [[-13, -4, 7, 4.5], [11, -4, 7, 4.5]], enraged ? '#ff2d2d' : '#ffe066');
  brows(ctx, '#1a3a2a', 5);
  ellipse(ctx, -2, 12, 9, 6, '#2f7a62');
  ctx.fillStyle = '#1a2a22';
  ctx.beginPath();
  ctx.arc(-2, 22, 13, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.fill();
  fangs(ctx, 22);
  // râu
  ctx.fillStyle = '#1a2a22';
  ctx.beginPath();
  ctx.moveTo(-16, 30);
  ctx.quadraticCurveTo(-2, 62, 12, 30);
  ctx.closePath();
  ctx.fill();
};

const browHead: HeadFn = (ctx, t, enraged) => {
  circle(ctx, 0, 0, 31, '#d9a066');
  ellipse(ctx, 8, -18, 10, 6, 'rgba(255,255,255,0.3)');
  // mày vàng dài rủ xuống
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 4, -12);
    ctx.quadraticCurveTo(sx * 30, -24, sx * 40, 10 + Math.sin(t * 3 + sx) * 4);
    ctx.quadraticCurveTo(sx * 44, 30, sx * 36, 46 + Math.sin(t * 3 + sx) * 5);
    ctx.stroke();
  }
  glowEyes(ctx, [[-12, -2, 6, 3.5], [10, -2, 6, 3.5]], enraged ? '#ff2d2d' : '#ff8a3d');
  ellipse(ctx, -2, 10, 7, 5, '#b07a44');
  ctx.fillStyle = '#5a2a14';
  ctx.beginPath();
  ctx.arc(-2, 20, 12, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.fill();
  fangs(ctx, 20);
  // chấm giả Phật
  circle(ctx, 0, -20, 3.5, '#e8303a');
};


const tigerHead: HeadFn = (ctx, _t, enraged) => {
  for (const sx of [-1, 1]) {
    circle(ctx, sx * 24, -26, 11, '#e07a1a');
    circle(ctx, sx * 24, -26, 5, '#ffd9b0');
  }
  ellipse(ctx, 0, 0, 34, 33, '#f08a24');
  ellipse(ctx, -10, 14, 22, 16, '#fff3e0');
  // vằn + chữ Vương
  ctx.strokeStyle = '#2a1408';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, -24);
  ctx.lineTo(8, -24);
  ctx.moveTo(-8, -18);
  ctx.lineTo(8, -18);
  ctx.moveTo(-8, -12);
  ctx.lineTo(8, -12);
  ctx.moveTo(0, -24);
  ctx.lineTo(0, -12);
  for (const sx of [-1, 1]) {
    ctx.moveTo(sx * 32, -6);
    ctx.lineTo(sx * 20, -2);
    ctx.moveTo(sx * 33, 4);
    ctx.lineTo(sx * 22, 6);
  }
  ctx.stroke();
  glowEyes(ctx, [[-14, -4, 6, 4], [8, -4, 6, 4]], enraged ? '#ff2d2d' : '#ffe066');
  ellipse(ctx, -12, 8, 7, 5, '#3a1a0a');
  ctx.fillStyle = '#5a1a0a';
  ctx.beginPath();
  ctx.arc(-10, 20, 11, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.fill();
  fangs(ctx, 20);
};

const dragonHead: HeadFn = (ctx, t, enraged) => {
  // sừng
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 10, -26);
    ctx.lineTo(sx * 22 + 6, -62);
    ctx.moveTo(sx * 16 + 2, -44);
    ctx.lineTo(sx * 34 + 6, -50);
    ctx.stroke();
  }
  // bờm
  ctx.fillStyle = '#e8f6ff';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(16, -24 + i * 12);
    ctx.lineTo(46 + Math.sin(t * 4 + i) * 6, -18 + i * 12);
    ctx.lineTo(18, -14 + i * 12);
    ctx.fill();
  }
  ellipse(ctx, 0, 0, 30, 30, '#2a9a7a');
  ellipse(ctx, -30, 10, 26, 15, '#36b08c');
  ellipse(ctx, -26, 18, 22, 8, '#e8f6c8');
  circle(ctx, -48, 4, 3.5, '#0e3a2a');
  glowEyes(ctx, [[-10, -8, 7, 5]], enraged ? '#ff2d2d' : '#ffe066');
  brows(ctx, '#0e3a2a', 4);
  // râu rồng
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-44, 8);
  ctx.bezierCurveTo(-70, 0, -64, 34 + Math.sin(t * 3) * 6, -86, 30);
  ctx.moveTo(-40, 14);
  ctx.bezierCurveTo(-56, 30, -44, 50, -64, 60 + Math.cos(t * 3) * 6);
  ctx.stroke();
};

const banditHead: HeadFn = (ctx, _t, enraged) => {
  circle(ctx, 0, 0, 30, '#e0aa7a');
  // khăn đầu
  ctx.fillStyle = '#b0201a';
  ctx.beginPath();
  ctx.arc(0, -4, 31, Math.PI * 1.02, Math.PI * 1.98);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(26, -14);
  ctx.quadraticCurveTo(46, -10, 50, 10);
  ctx.lineTo(40, 6);
  ctx.closePath();
  ctx.fill();
  circle(ctx, -12, -2, 4, '#1a0a05');
  circle(ctx, 8, -2, 4, '#1a0a05');
  if (enraged) glowEyes(ctx, [[-12, -2, 2, 2], [8, -2, 2, 2]], '#ff2d2d');
  brows(ctx, '#1a0a05', 5);
  // sẹo
  ctx.strokeStyle = '#a0503a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(10, -10);
  ctx.lineTo(20, 8);
  ctx.stroke();
  // râu quai nón
  ctx.fillStyle = '#1a0a05';
  ctx.beginPath();
  ctx.moveTo(-28, 4);
  ctx.quadraticCurveTo(-26, 44, 0, 46);
  ctx.quadraticCurveTo(26, 44, 28, 4);
  ctx.quadraticCurveTo(14, 26, 0, 24);
  ctx.quadraticCurveTo(-14, 26, -28, 4);
  ctx.fill();
  ctx.fillStyle = '#7a2a1a';
  ctx.beginPath();
  ctx.ellipse(-2, 18, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
};

const taoistHead: HeadFn = (ctx, t, enraged) => {
  // búi tóc + trâm
  circle(ctx, 0, -32, 12, '#d8d8e0');
  rrect(ctx, -20, -36, 40, 5, 2, '#ffd24a');
  circle(ctx, 0, 0, 29, '#f0d4b4');
  ctx.fillStyle = '#d8d8e0';
  ctx.beginPath();
  ctx.arc(0, -2, 30, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  // mắt híp
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -2);
  ctx.lineTo(-6, 0);
  ctx.moveTo(2, 0);
  ctx.lineTo(14, -2);
  ctx.stroke();
  glowEyes(ctx, [[-12, -1, 3, 1.6], [8, -1, 3, 1.6]], enraged ? '#ff2d2d' : '#9dffc4');
  // chòm râu dài
  ctx.fillStyle = '#eeeef4';
  ctx.beginPath();
  ctx.moveTo(-16, 14);
  ctx.quadraticCurveTo(-12, 62 + Math.sin(t * 2) * 4, 0, 74 + Math.sin(t * 2) * 5);
  ctx.quadraticCurveTo(10, 60, 14, 14);
  ctx.quadraticCurveTo(0, 22, -16, 14);
  ctx.fill();
  ctx.strokeStyle = '#eeeef4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-8, 10);
  ctx.quadraticCurveTo(-30, 12, -36, 30);
  ctx.moveTo(4, 10);
  ctx.quadraticCurveTo(24, 12, 30, 30);
  ctx.stroke();
};

// ---------- vũ khí ----------

function drawWeapon(ctx: Ctx, w: Weapon, t: number, cast: number) {
  switch (w) {
    case 'trident':
      rrect(ctx, -20, -4, 170, 8, 4, '#7a5a3a');
      ctx.fillStyle = '#d6d9e2';
      rrect(ctx, 144, -22, 8, 44, 3, '#d6d9e2');
      for (const y of [-20, 0, 20]) {
        ctx.beginPath();
        ctx.moveTo(150, y - 4);
        ctx.lineTo(186, y);
        ctx.lineTo(150, y + 4);
        ctx.closePath();
        ctx.fill();
      }
      break;
    case 'spear':
      rrect(ctx, -20, -4, 170, 8, 4, '#8a2a1a');
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.moveTo(150, -10);
      ctx.lineTo(196, 0);
      ctx.lineTo(150, 10);
      ctx.closePath();
      ctx.fill();
      rrect(ctx, 140, -9, 12, 18, 3, '#e8303a');
      ctx.save();
      ctx.translate(196, 0);
      ctx.rotate(Math.PI / 2);
      flame(ctx, 0, 10, 12, 34 + cast * 30, t, 3, 'rgba(255,90,20,0.85)', 'rgba(255,230,120,0.95)');
      ctx.restore();
      break;
    case 'hammer':
      rrect(ctx, -10, -5, 110, 10, 4, '#6a4a2a');
      rrect(ctx, 92, -26, 44, 52, 14, '#c07a3a');
      ctx.strokeStyle = '#8a4a1a';
      ctx.lineWidth = 3;
      for (const x of [104, 116, 128]) {
        ctx.beginPath();
        ctx.moveTo(x, -24);
        ctx.lineTo(x, 24);
        ctx.stroke();
      }
      break;
    case 'gourd': {
      ctx.save();
      ctx.rotate(-1.2);
      ctx.translate(30, 0);
      circle(ctx, 0, 16, 26, '#8a3ad9');
      circle(ctx, 0, -18, 17, '#8a3ad9');
      rrect(ctx, -24, -2, 48, 6, 3, '#ffd24a');
      rrect(ctx, -6, -42, 12, 10, 3, '#ffd24a');
      ellipse(ctx, 8, 8, 6, 12, 'rgba(255,255,255,0.3)');
      if (cast > 0.05) {
        ctx.strokeStyle = `rgba(199,125,255,${cast})`;
        ctx.lineWidth = 4;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(0, -52, 14 + i * 16 + ((t * 60) % 16), Math.PI * 1.1, Math.PI * 1.9);
          ctx.stroke();
        }
      }
      ctx.restore();
      break;
    }
    case 'saber':
      rrect(ctx, -10, -4, 50, 8, 3, '#4a2a14');
      rrect(ctx, 36, -10, 8, 20, 3, '#ffd24a');
      ctx.fillStyle = '#e6e8f0';
      ctx.beginPath();
      ctx.moveTo(44, -6);
      ctx.quadraticCurveTo(110, -16, 150, -34);
      ctx.quadraticCurveTo(120, 4, 44, 6);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, -4);
      ctx.quadraticCurveTo(110, -12, 146, -30);
      ctx.stroke();
      break;
    case 'whisk':
      rrect(ctx, -10, -4, 70, 8, 4, '#8a5a2a');
      rrect(ctx, 56, -7, 10, 14, 3, '#ffd24a');
      ctx.strokeStyle = '#f4f4fa';
      ctx.lineWidth = 2.2;
      for (let i = -5; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(64, i * 1.2);
        ctx.quadraticCurveTo(100, i * 4 + Math.sin(t * 5 + i) * 6, 128 + Math.abs(i) * -2, i * 6 + Math.sin(t * 5 + i) * 10);
        ctx.stroke();
      }
      break;
    case 'claws':
      ctx.strokeStyle = '#fff3e0';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(6, i * 8);
        ctx.quadraticCurveTo(30, i * 10 - 6, 44 + cast * 10, i * 14 - 2);
        ctx.stroke();
      }
      break;
    case 'cymbals': {
      const open = 20 + (1 - cast) * 30;
      for (const s of [-1, 1]) {
        ctx.save();
        ctx.translate(40, s * open);
        ctx.shadowColor = '#ffd24a';
        ctx.shadowBlur = 12 + cast * 20;
        ellipse(ctx, 0, 0, 12, 34, '#ffd24a');
        ellipse(ctx, 0, 0, 5, 12, '#b88a1a');
        ctx.restore();
      }
      break;
    }
  }
}

// ---------- khung dáng người ----------

const LOOKS: Partial<Record<BossKind, HumanLook>> = {
  wind_weasel: {
    robe: '#8a5a1a',
    robeDark: '#5a3a10',
    trim: '#ffd27a',
    skin: '#c8902a',
    scale: 1,
    weapon: 'trident',
    aura: ['rgba(255,210,120,0.45)', 'rgba(255,190,80,0)'],
    head: weaselHead,
  },
  fire_child: {
    robe: '#e8303a',
    robeDark: '#a01a22',
    trim: '#ffd24a',
    skin: '#ffd2b0',
    scale: 0.85,
    weapon: 'spear',
    aura: ['rgba(255,80,40,0.5)', 'rgba(255,40,0,0)'],
    head: childHead,
    fireWheels: true,
  },
  river_fish: {
    robe: '#1a5a8a',
    robeDark: '#0e3a5e',
    trim: '#ffb347',
    skin: '#ff9a2a',
    scale: 1.05,
    weapon: 'hammer',
    aura: ['rgba(127,212,255,0.45)', 'rgba(60,160,255,0)'],
    head: fishHead,
  },
  horned_king: {
    robe: '#2a5a3a',
    robeDark: '#183a24',
    trim: '#ffd24a',
    skin: '#3f9a7e',
    scale: 1.1,
    weapon: 'gourd',
    aura: ['rgba(182,255,122,0.4)', 'rgba(120,220,80,0)'],
    head: hornedHead,
  },
  yellow_brow: {
    robe: '#e0a020',
    robeDark: '#9a6a10',
    trim: '#e8303a',
    skin: '#d9a066',
    scale: 1.1,
    weapon: 'cymbals',
    aura: ['rgba(255,220,90,0.5)', 'rgba(255,200,40,0)'],
    head: browHead,
  },
  tiger_demon: {
    robe: '#5a2a14',
    robeDark: '#3a1a0a',
    trim: '#ffb347',
    skin: '#f08a24',
    scale: 1.1,
    weapon: 'claws',
    aura: ['rgba(255,150,60,0.45)', 'rgba(255,120,30,0)'],
    head: tigerHead,
  },
  dragon_king: {
    robe: '#1a4a6a',
    robeDark: '#0e2e44',
    trim: '#ffd24a',
    skin: '#2a9a7a',
    scale: 1.1,
    weapon: 'trident',
    aura: ['rgba(90,209,255,0.45)', 'rgba(40,160,255,0)'],
    head: dragonHead,
  },
  bandit: {
    robe: '#3a3a44',
    robeDark: '#22222a',
    trim: '#b0201a',
    skin: '#e0aa7a',
    scale: 1,
    weapon: 'saber',
    aura: ['rgba(220,60,40,0.35)', 'rgba(160,20,10,0)'],
    head: banditHead,
  },
  taoist: {
    robe: '#2a5a5a',
    robeDark: '#183838',
    trim: '#e6e8f0',
    skin: '#f0d4b4',
    scale: 1,
    weapon: 'whisk',
    aura: ['rgba(157,255,196,0.4)', 'rgba(90,220,150,0)'],
    head: taoistHead,
  },
};

function drawHumanoid(ctx: Ctx, e: GameEngine, cast: number, L: HumanLook) {
  const b = e.boss;
  const t = e.time;
  ctx.translate(0, -Math.sin(t * 1.8) * 12 + 4);
  if (L.fireWheels) ctx.translate(0, -24 + Math.sin(t * 3) * 6);

  const ar = 200 + Math.sin(t * 3.5) * 10 + cast * 60;
  const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, ar);
  aura.addColorStop(0, b.enraged ? 'rgba(255,50,60,0.5)' : L.aura[0]);
  aura.addColorStop(1, L.aura[1]);
  ctx.fillStyle = aura;
  ctx.fillRect(-ar, -ar, ar * 2, ar * 2);

  ctx.translate(0, 130);
  ctx.scale(L.scale, L.scale);
  ctx.translate(0, -130);
  if (b.hurtT > 0) ctx.filter = 'brightness(2.2)';

  if (L.fireWheels) {
    for (const x of [-22, 22]) {
      ctx.save();
      ctx.translate(x, 134);
      ctx.rotate(t * 8);
      ctx.strokeStyle = '#ffd24a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, 18, 0, Math.PI * 2);
      ctx.moveTo(-18, 0);
      ctx.lineTo(18, 0);
      ctx.moveTo(0, -18);
      ctx.lineTo(0, 18);
      ctx.stroke();
      ctx.restore();
      flame(ctx, x, 150, 20, 40, t, x, 'rgba(255,90,20,0.8)', 'rgba(255,220,90,0.9)');
    }
  }

  // chân
  rrect(ctx, -30, 50, 24, 80, 10, L.robeDark);
  rrect(ctx, 8, 50, 24, 80, 10, L.robeDark);
  rrect(ctx, -38, 120, 36, 14, 6, '#1a100c');
  rrect(ctx, 2, 120, 36, 14, 6, '#1a100c');

  // tay sau
  ellipse(ctx, 50, -26, 14, 30, L.robeDark, 0.3);
  if (L.weapon === 'cymbals') {
    ctx.save();
    ctx.translate(-10, -30);
    ctx.rotate(-0.3);
    drawWeapon(ctx, 'cymbals', t, cast);
    ctx.restore();
  }

  // áo bào
  ctx.fillStyle = L.robe;
  ctx.beginPath();
  ctx.moveTo(-44, -72);
  ctx.lineTo(44, -72);
  ctx.lineTo(64, 70);
  ctx.quadraticCurveTo(0, 84, -64, 70);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = L.trim;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-62, 64);
  ctx.quadraticCurveTo(0, 78, 62, 64);
  ctx.moveTo(-30, -72);
  ctx.lineTo(0, -36);
  ctx.lineTo(30, -72);
  ctx.stroke();
  rrect(ctx, -52, 8, 104, 12, 5, L.trim);
  circle(ctx, 0, 14, 9, L.robeDark);

  // vũ khí + tay trước
  if (L.weapon !== 'cymbals') {
    const swing = b.lungeT > 0 ? Math.sin((1 - b.lungeT / 0.5) * Math.PI) * 1.1 : 0;
    const ang = (L.weapon === 'gourd' ? 0 : -0.5) - cast * 1.4 + swing + Math.sin(t * 2) * 0.05;
    ctx.save();
    ctx.translate(-68, -20 - cast * 46);
    ctx.rotate(L.weapon === 'gourd' ? -swing * 0.5 : ang);
    drawWeapon(ctx, L.weapon, t, cast);
    ctx.restore();
  }
  ctx.strokeStyle = L.robe;
  ctx.lineWidth = 20;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-40, -56);
  ctx.lineTo(-68, -20 - cast * 46);
  ctx.stroke();
  circle(ctx, -68, -20 - cast * 46, 10, L.skin);
  if (L.weapon === 'cymbals') {
    ctx.save();
    ctx.translate(-68, -20 - cast * 46);
    ctx.rotate(0.2);
    ctx.scale(-1, 1);
    drawWeapon(ctx, 'cymbals', t, cast);
    ctx.restore();
  }

  // vai
  for (const sx of [-1, 1]) {
    ctx.fillStyle = L.trim;
    ctx.beginPath();
    ctx.arc(sx * 42, -64, 18, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  ctx.save();
  ctx.translate(-4, -106);
  L.head(ctx, t, b.enraged, cast);
  ctx.restore();
}

// ---------- Nhện Tinh ----------

function drawSpider(ctx: Ctx, e: GameEngine, cast: number) {
  const b = e.boss;
  const t = e.time;
  ctx.translate(0, -Math.sin(t * 1.8) * 12);

  // mạng nhện phía sau
  ctx.save();
  ctx.translate(30, -120);
  ctx.strokeStyle = 'rgba(255,240,255,0.35)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 240, Math.sin(a) * 240);
    ctx.stroke();
  }
  for (let r = 40; r <= 240; r += 40) {
    ctx.beginPath();
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const rr = r + Math.sin(t * 2 + i) * 3;
      if (i === 0) ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
      else ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.stroke();
  }
  ctx.restore();
  // sợi tơ treo
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, -800);
  ctx.lineTo(30, -40);
  ctx.stroke();

  const ar = 190 + cast * 60;
  const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, ar);
  aura.addColorStop(0, b.enraged ? 'rgba(255,40,90,0.5)' : 'rgba(255,120,220,0.4)');
  aura.addColorStop(1, 'rgba(200,60,180,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(-ar, -ar, ar * 2, ar * 2);
  if (b.hurtT > 0) ctx.filter = 'brightness(2.2)';

  // 8 chân
  ctx.strokeStyle = '#2a1430';
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    for (const sx of [-1, 1]) {
      const wig = Math.sin(t * 6 + i * 1.3 + (sx > 0 ? 1 : 0)) * 0.15 + cast * 0.25 * sx;
      const a0 = (sx < 0 ? Math.PI : 0) + sx * (-0.6 + i * 0.35) + wig;
      const kx = Math.cos(a0) * 90;
      const ky = -40 + Math.sin(a0) * 40 - 50;
      ctx.lineWidth = 9;
      ctx.beginPath();
      ctx.moveTo(sx * 10, 10);
      ctx.lineTo(kx, ky);
      ctx.lineTo(kx + sx * 40, 130);
      ctx.stroke();
      circle(ctx, kx, ky, 6, '#ff9ee0');
    }
  }
  // bụng
  ellipse(ctx, 50, 20, 74, 64, '#3a1a4a');
  ctx.fillStyle = '#ff5ab0';
  ctx.beginPath();
  ctx.moveTo(50, -10);
  ctx.lineTo(66, 20);
  ctx.lineTo(50, 50);
  ctx.lineTo(34, 20);
  ctx.closePath();
  ctx.fill();
  for (let i = 0; i < 5; i++) circle(ctx, 20 + i * 15, -18 + (i % 2) * 6, 4, '#ff9ee0');
  // đầu ngực
  ellipse(ctx, -36, -10, 48, 40, '#4a2a5a');
  // mắt
  const ec = b.enraged ? '#ff2d55' : '#ff7ad0';
  glowEyes(
    ctx,
    [
      [-58, -22, 8, 8],
      [-36, -24, 8, 8],
      [-66, -6, 4, 4],
      [-48, -8, 4, 4],
      [-28, -8, 4, 4],
      [-46, -36, 3.5, 3.5],
    ],
    ec,
  );
  // nanh
  ctx.fillStyle = '#f4f0ff';
  for (const x of [-62, -46]) {
    ctx.beginPath();
    ctx.moveTo(x, 18);
    ctx.lineTo(x + 5, 36 + cast * 8);
    ctx.lineTo(x + 10, 18);
    ctx.closePath();
    ctx.fill();
  }
}

// ---------- Kim Sí Đại Bằng ----------

function drawRoc(ctx: Ctx, e: GameEngine, cast: number) {
  const b = e.boss;
  const t = e.time;
  const flap = Math.sin(t * 5) * 0.35 - cast * 0.5;

  const ar = 260 + cast * 80;
  const aura = ctx.createRadialGradient(0, -20, 20, 0, -20, ar);
  aura.addColorStop(0, b.enraged ? 'rgba(255,60,30,0.5)' : 'rgba(255,210,80,0.45)');
  aura.addColorStop(1, 'rgba(255,170,0,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(-ar, -ar - 20, ar * 2, ar * 2);
  if (b.hurtT > 0) ctx.filter = 'brightness(2.2)';

  // cánh
  for (const sx of [-1, 1]) {
    ctx.save();
    ctx.translate(sx * 26, -60);
    ctx.rotate(sx * flap);
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle = ['#6a3a06', '#c07a10', '#ffd24a'][layer];
      ctx.strokeStyle = '#3a2004';
      ctx.lineWidth = 3;
      const len = 220 - layer * 50;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      for (let i = 0; i <= 6; i++) {
        const px = sx * (len * (i / 6));
        const py = -70 + (i / 6) * 30 + (i % 2) * 22 + layer * 18;
        ctx.lineTo(px, py);
      }
      ctx.lineTo(sx * len * 0.9, 40 + layer * 10);
      ctx.quadraticCurveTo(sx * 60, 50, 0, 30);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  }
  // đuôi
  ctx.fillStyle = '#b8780e';
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.translate(10, 60);
    ctx.rotate(i * 0.18 + 0.2);
    ellipse(ctx, 0, 50, 12, 52, i % 2 ? '#e0a020' : '#b8780e');
    ctx.restore();
  }
  // thân giáp
  ellipse(ctx, 0, 0, 52, 74, '#c88a1a');
  ellipse(ctx, -6, 6, 34, 52, '#ffe9a8');
  ctx.strokeStyle = '#c88a1a';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(-6, -24 + i * 14, 18, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
  }
  // móng
  ctx.strokeStyle = '#3a2a10';
  ctx.lineWidth = 6;
  for (const x of [-20, 16]) {
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.lineTo(x, 104);
    ctx.moveTo(x, 104);
    ctx.lineTo(x - 14, 118);
    ctx.moveTo(x, 104);
    ctx.lineTo(x + 2, 122);
    ctx.moveTo(x, 104);
    ctx.lineTo(x + 14, 116);
    ctx.stroke();
  }
  // đầu
  ctx.save();
  ctx.translate(-14, -96);
  ctx.fillStyle = '#ff7a1a';
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate(-0.4 + i * 0.25);
    ellipse(ctx, 22, -34, 7, 26, i % 2 ? '#ff7a1a' : '#ffcc33');
    ctx.restore();
  }
  ellipse(ctx, 0, 0, 30, 32, '#fff3d0');
  ctx.fillStyle = '#ffb000';
  ctx.beginPath();
  ctx.moveTo(-22, -4);
  ctx.quadraticCurveTo(-66, -4, -58, 22);
  ctx.quadraticCurveTo(-50, 10, -20, 14);
  ctx.closePath();
  ctx.fill();
  glowEyes(ctx, [[-10, -8, 6, 5]], b.enraged ? '#ff1a1a' : '#e8303a');
  ctx.strokeStyle = '#3a2a10';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-24, -20);
  ctx.lineTo(2, -12);
  ctx.stroke();
  ctx.restore();
}

// ---------- Lục Nhĩ Mi Hầu ----------

function drawSixEar(ctx: Ctx, e: GameEngine, cast: number) {
  const b = e.boss;
  const t = e.time;
  ctx.translate(0, -Math.sin(t * 1.8) * 12 + 4);
  const ar = 200 + cast * 60;
  const aura = ctx.createRadialGradient(0, -40, 20, 0, -40, ar);
  aura.addColorStop(0, b.enraged ? 'rgba(255,40,90,0.5)' : 'rgba(110,80,255,0.45)');
  aura.addColorStop(1, 'rgba(60,20,160,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(-ar, -ar - 40, ar * 2, ar * 2);

  ctx.translate(0, 130);
  ctx.scale(-1.5, 1.5);
  ctx.filter = b.hurtT > 0 ? 'brightness(2.2)' : 'hue-rotate(200deg) saturate(0.8) brightness(0.85)';
  const p = b.lungeT > 0 ? 1 - b.lungeT / 0.5 : cast > 0 ? 0.4 + cast * 0.3 : -1;
  drawWukong(ctx, { swing: 0, bob: 0, p, kind: p >= 0 ? (cast > 0 ? 'ultimate' : 'staff') : null, t });
  // sáu tai
  for (const [x, y] of [
    [-27, -108],
    [-24, -140],
    [30, -108],
    [27, -140],
  ])
    circle(ctx, x, y, 6.5, '#f4d3a6');
  ctx.filter = 'none';
  // mắt đỏ phát sáng
  glowEyes(ctx, [[-1, -124, 3, 3], [14, -124, 3, 3]], '#ff2d55');
}

// ---------- lâu la ----------

export function drawBlobMinion(ctx: Ctx, m: Minion, t: number, color: string) {
  const hop = -Math.abs(Math.sin(m.hopT * 6)) * 10;
  ctx.save();
  ellipse(ctx, m.x, m.y + 3, 18, 5, 'rgba(0,0,0,0.3)');
  ctx.translate(m.x, m.y + hop);
  if (m.dead) {
    ctx.globalAlpha = Math.max(0, m.dieT / 0.6);
    ctx.scale(1 + (1 - m.dieT / 0.6), 1 - (1 - m.dieT / 0.6) * 0.6);
  }
  if (m.hurtT > 0) ctx.filter = 'brightness(2)';
  const squash = 1 + Math.sin(m.hopT * 12) * 0.06;
  ctx.save();
  ctx.scale(1 / squash, squash);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-20, 0);
  ctx.quadraticCurveTo(-24, -40, 0, -46);
  ctx.quadraticCurveTo(24, -40, 20, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, -2, 20, 6, 0, 0, Math.PI);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#2a1a1a';
  ctx.beginPath();
  ctx.moveTo(-12, -38);
  ctx.lineTo(-16, -54);
  ctx.lineTo(-5, -43);
  ctx.moveTo(12, -38);
  ctx.lineTo(16, -54);
  ctx.lineTo(5, -43);
  ctx.fill();
  circle(ctx, -7, -26, 5, '#fff');
  circle(ctx, 6, -26, 5, '#fff');
  circle(ctx, -8, -26, 2.4, '#1a0a0a');
  circle(ctx, 5, -26, 2.4, '#1a0a0a');
  ctx.strokeStyle = '#1a0a0a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -15, 5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
  void t;
  if (!m.dead) {
    rrect(ctx, m.x - 16, m.y - 84 + hop, 32, 5, 2, 'rgba(0,0,0,0.5)');
    rrect(ctx, m.x - 16, m.y - 84 + hop, 32 * Math.max(0, m.hp / m.maxHp), 5, 2, color);
  }
}

export function drawSpiderling(ctx: Ctx, m: Minion, t: number) {
  const hop = -Math.abs(Math.sin(m.hopT * 6)) * 6;
  ctx.save();
  ellipse(ctx, m.x, m.y + 3, 18, 5, 'rgba(0,0,0,0.3)');
  ctx.translate(m.x, m.y + hop);
  if (m.dead) {
    ctx.globalAlpha = Math.max(0, m.dieT / 0.6);
    ctx.rotate((1 - m.dieT / 0.6) * 3);
  }
  if (m.hurtT > 0) ctx.filter = 'brightness(2)';
  ctx.strokeStyle = '#2a1430';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++)
    for (const sx of [-1, 1]) {
      const w = Math.sin(t * 14 + i + sx) * 3;
      ctx.beginPath();
      ctx.moveTo(0, -14);
      ctx.lineTo(sx * (14 + i * 3), -26 + i * 4 + w);
      ctx.lineTo(sx * (20 + i * 4), 0);
      ctx.stroke();
    }
  ellipse(ctx, 6, -18, 15, 13, '#3a1a4a');
  ellipse(ctx, -10, -16, 10, 9, '#4a2a5a');
  circle(ctx, -14, -18, 2.8, '#ff7ad0');
  circle(ctx, -7, -19, 2.8, '#ff7ad0');
  ctx.restore();
  if (!m.dead) {
    rrect(ctx, m.x - 16, m.y - 64 + hop, 32, 5, 2, 'rgba(0,0,0,0.5)');
    rrect(ctx, m.x - 16, m.y - 64 + hop, 32 * Math.max(0, m.hp / m.maxHp), 5, 2, '#ff9ee0');
  }
}

/** Vẽ thân boss mới. Trả về false nếu kind không thuộc file này. */
export function drawExtraBoss(ctx: Ctx, e: GameEngine, cast: number): boolean {
  const kind = e.stage.boss.kind;
  if (kind === 'spider_queen') drawSpider(ctx, e, cast);
  else if (kind === 'golden_roc') drawRoc(ctx, e, cast);
  else if (kind === 'six_ear') drawSixEar(ctx, e, cast);
  else {
    const look = LOOKS[kind];
    if (!look) return false;
    drawHumanoid(ctx, e, cast, look);
  }
  return true;
}
