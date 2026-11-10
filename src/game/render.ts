import { drawBlobMinion, drawExtraBoss, drawSpiderling } from './bosses';
import { HEROES, TANG } from './config';
import { BOSS_X, BOSS_Y, COMBO_IMPACT, GROUND_Y, H, W, type GameEngine, type HeroState, type Minion } from './engine';

export type Ctx = CanvasRenderingContext2D;

const FONT = "'Be Vietnam Pro', system-ui, sans-serif";
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export function circle(ctx: Ctx, x: number, y: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function ellipse(ctx: Ctx, x: number, y: number, rx: number, ry: number, fill: string, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}

export function rrect(ctx: Ctx, x: number, y: number, w: number, h: number, r: number, fill: string) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function heartPath(ctx: Ctx, s: number) {
  ctx.beginPath();
  ctx.moveTo(0, s * 0.35);
  ctx.bezierCurveTo(-s * 0.9, -s * 0.25, -s * 0.45, -s * 0.95, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.45, -s * 0.95, s * 0.9, -s * 0.25, 0, s * 0.35);
  ctx.closePath();
}

// ---------------- nền ----------------

function ridge(x: number, seed: number) {
  return (
    Math.sin(x * 0.006 + seed) * 0.5 +
    Math.sin(x * 0.013 + seed * 2.1) * 0.3 +
    Math.sin(x * 0.031 + seed * 3.7) * 0.2
  );
}

function drawMountains(ctx: Ctx, offset: number, baseY: number, amp: number, color: string, seed: number) {
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let x = -10; x <= W + 10; x += 12) {
    const y = baseY - (ridge(x + offset, seed) * 0.5 + 0.5) * amp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawCloud(ctx: Ctx, x: number, y: number, s: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, 26, Math.PI, 0);
  ctx.arc(36, -6, 32, Math.PI, 0);
  ctx.arc(76, 2, 22, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  // xoáy tường vân
  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(36, -6, 14, Math.PI * 0.2, Math.PI * 1.6);
  ctx.stroke();
  ctx.restore();
}

function drawPine(ctx: Ctx, x: number, y: number, s: number, color: string) {
  ctx.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(x, y - (60 + i * 26) * s);
    ctx.lineTo(x - (34 - i * 8) * s, y - i * 26 * s);
    ctx.lineTo(x + (34 - i * 8) * s, y - i * 26 * s);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillRect(x - 3 * s, y - 4 * s, 6 * s, 14 * s);
}

function drawBackground(ctx: Ctx, e: GameEngine, golden: number) {
  const p = e.stage.palette;
  const t = e.time;
  const wx = e.worldX;

  const sky = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
  sky.addColorStop(0, p.skyTop);
  sky.addColorStop(1, p.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  if (golden > 0) {
    const g = ctx.createLinearGradient(0, 0, 0, GROUND_Y);
    g.addColorStop(0, `rgba(255, 196, 92, ${golden})`);
    g.addColorStop(1, `rgba(255, 244, 200, ${golden})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // sao
  ctx.fillStyle = `rgba(255,255,255,${0.7 * (1 - golden)})`;
  for (let i = 0; i < 40; i++) {
    const sx = (i * 137.5) % W;
    const sy = (i * 71.3) % 520;
    const tw = 0.5 + 0.5 * Math.sin(t * 2 + i);
    ctx.globalAlpha = tw * (1 - golden);
    ctx.fillRect(sx, sy, 2, 2);
  }
  ctx.globalAlpha = 1;

  // trăng
  const moonX = 160;
  const moonY = 330;
  const glow = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 160);
  glow.addColorStop(0, 'rgba(255,240,220,0.55)');
  glow.addColorStop(1, 'rgba(255,240,220,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 150, 360, 360);
  circle(ctx, moonX, moonY, 52, golden > 0.5 ? '#fff6d6' : p.moon);

  // mây
  for (let i = 0; i < 5; i++) {
    const cx = ((i * 230 - wx * 0.05 - t * 8) % (W + 300) + W + 300) % (W + 300) - 150;
    drawCloud(ctx, cx, 420 + (i % 3) * 70, 0.9 + (i % 2) * 0.4, `rgba(255,215,235,${0.32 + golden * 0.3})`);
  }

  drawMountains(ctx, wx * 0.12, 800, 300, p.mountainFar, 1.3);
  drawMountains(ctx, wx * 0.3, 880, 210, p.mountainNear, 4.1);

  // thông
  for (let i = 0; i < 9; i++) {
    const px = ((i * 113 - wx * 0.5) % (W + 160) + W + 160) % (W + 160) - 80;
    drawPine(ctx, px, 885, 0.7 + (i % 3) * 0.2, 'rgba(25,14,35,0.75)');
  }

  // mặt đất
  const gg = ctx.createLinearGradient(0, 870, 0, H);
  gg.addColorStop(0, p.ground);
  gg.addColorStop(1, '#140b18');
  ctx.fillStyle = gg;
  ctx.fillRect(0, 870, W, H - 870);

  // đường
  ctx.fillStyle = p.road;
  ctx.beginPath();
  ctx.moveTo(0, 880);
  ctx.lineTo(W, 880);
  ctx.lineTo(W, 950);
  ctx.lineTo(0, 950);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(0, 944, W, 6);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(0, 880, W, 3);
  for (let i = 0; i < 14; i++) {
    const sx = ((i * 67 - wx) % (W + 60) + W + 60) % (W + 60) - 30;
    ellipse(ctx, sx, 905 + (i % 3) * 14, 9 + (i % 2) * 5, 4, 'rgba(60,35,30,0.35)');
  }
  // cỏ
  ctx.strokeStyle = 'rgba(120,160,90,0.5)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 20; i++) {
    const gx = ((i * 41 - wx * 1.2) % (W + 40) + W + 40) % (W + 40) - 20;
    ctx.beginPath();
    ctx.moveTo(gx, 958);
    ctx.lineTo(gx - 4, 944);
    ctx.moveTo(gx + 4, 958);
    ctx.lineTo(gx + 6, 946);
    ctx.stroke();
  }
}

// ---------------- chùa Như Lai ----------------

function drawRoof(ctx: Ctx, cx: number, y: number, w: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2 - 22, y + 4);
  ctx.quadraticCurveTo(cx - w / 2, y + 10, cx - w / 2 + 12, y - 18);
  ctx.lineTo(cx + w / 2 - 12, y - 18);
  ctx.quadraticCurveTo(cx + w / 2, y + 10, cx + w / 2 + 22, y + 4);
  ctx.lineTo(cx + w / 2 - 6, y + 10);
  ctx.lineTo(cx - w / 2 + 6, y + 10);
  ctx.closePath();
  ctx.fill();
}

function drawTemple(ctx: Ctx, cx: number, baseY: number, t: number) {
  // hào quang
  const rays = 18;
  ctx.save();
  ctx.translate(cx, baseY - 260);
  ctx.rotate(t * 0.08);
  for (let i = 0; i < rays; i++) {
    ctx.rotate((Math.PI * 2) / rays);
    ctx.fillStyle = i % 2 ? 'rgba(255,236,150,0.18)' : 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-40, -700);
    ctx.lineTo(40, -700);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  const halo = ctx.createRadialGradient(cx, baseY - 260, 10, cx, baseY - 260, 260);
  halo.addColorStop(0, 'rgba(255,250,210,0.9)');
  halo.addColorStop(1, 'rgba(255,220,120,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(cx - 280, baseY - 540, 560, 560);

  // bậc thềm
  rrect(ctx, cx - 170, baseY - 24, 340, 24, 4, '#c9a46b');
  rrect(ctx, cx - 145, baseY - 44, 290, 22, 4, '#dcb97f');
  // tầng 1
  rrect(ctx, cx - 120, baseY - 150, 240, 108, 4, '#9b2a22');
  for (let i = 0; i < 5; i++) rrect(ctx, cx - 112 + i * 54, baseY - 150, 12, 108, 3, '#c0392b');
  rrect(ctx, cx - 30, baseY - 120, 60, 78, 30, '#3a1410');
  drawRoof(ctx, cx, baseY - 158, 270, '#e8b931');
  // tầng 2
  rrect(ctx, cx - 85, baseY - 238, 170, 70, 4, '#9b2a22');
  rrect(ctx, cx - 18, baseY - 222, 36, 40, 18, '#ffe9a8');
  drawRoof(ctx, cx, baseY - 246, 200, '#e8b931');
  // tầng 3
  rrect(ctx, cx - 55, baseY - 312, 110, 56, 4, '#9b2a22');
  drawRoof(ctx, cx, baseY - 320, 140, '#e8b931');
  // chóp
  ctx.fillStyle = '#e8b931';
  ctx.beginPath();
  ctx.moveTo(cx, baseY - 400);
  ctx.lineTo(cx - 14, baseY - 336);
  ctx.lineTo(cx + 14, baseY - 336);
  ctx.closePath();
  ctx.fill();
  ctx.save();
  ctx.shadowColor = '#fff6c2';
  ctx.shadowBlur = 30;
  circle(ctx, cx, baseY - 408, 12, '#fffbe0');
  ctx.restore();
  // biển hiệu
  rrect(ctx, cx - 64, baseY - 146, 128, 26, 4, '#3a1410');
  ctx.fillStyle = '#ffe066';
  ctx.font = `900 18px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText('LÔI ÂM TỰ', cx, baseY - 127);
}

// ---------------- nhân vật ----------------

function legs(ctx: Ctx, swing: number, pants: string, shoe: string, spread = 11, len = 42) {
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * spread, -len);
    ctx.rotate(swing * side);
    rrect(ctx, -7, 0, 14, len - 4, 6, pants);
    ellipse(ctx, 4, len - 4, 11, 6, shoe);
    ctx.restore();
  }
}

function eye(ctx: Ctx, x: number, y: number, r: number) {
  circle(ctx, x, y, r, '#1b1020');
  circle(ctx, x + r * 0.35, y - r * 0.35, r * 0.35, '#fff');
}

interface Pose {
  swing: number;
  bob: number;
  p: number; // tiến độ đòn đánh 0..1 (hoặc -1 nếu không đánh)
  kind: HeroState['attackKind'];
  t: number;
}

export function drawWukong(ctx: Ctx, pose: Pose) {
  const { swing, p, kind, t } = pose;
  // đuôi
  ctx.strokeStyle = '#a8652a';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-18, -50);
  ctx.bezierCurveTo(-50, -48 + Math.sin(t * 4) * 4, -56, -90, -38, -96);
  ctx.quadraticCurveTo(-26, -100, -32, -88);
  ctx.stroke();

  legs(ctx, swing, '#b33a2a', '#3a2418');
  // váy da hổ
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.moveTo(-24, -58);
  ctx.lineTo(24, -58);
  ctx.lineTo(30, -34);
  ctx.lineTo(-30, -34);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a1a10';
  ctx.lineWidth = 3;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 10 - 3, -56);
    ctx.lineTo(i * 11 + 2, -42);
    ctx.stroke();
  }
  // thân
  rrect(ctx, -21, -100, 42, 46, 12, '#f2b632');
  rrect(ctx, -22, -64, 44, 8, 4, '#c0392b');
  ctx.fillStyle = '#e04a3a';
  ctx.beginPath();
  ctx.moveTo(-20, -100);
  ctx.lineTo(20, -100);
  ctx.lineTo(0, -82);
  ctx.closePath();
  ctx.fill();

  // gậy Như Ý
  let ang = -1.15 + Math.sin(t * 2) * 0.05;
  if (kind === 'staff' || kind === 'auto') ang = -2.4 + easeOut(Math.min(1, p * 1.6)) * 3.1;
  if (kind === 'ultimate') ang = -1.57 + Math.sin(p * Math.PI * 6) * 1.2;
  ctx.save();
  ctx.translate(20, -78);
  ctx.rotate(ang);
  const len = kind === 'ultimate' ? 220 : kind === 'staff' ? 190 : 150;
  rrect(ctx, -50, -5, len, 10, 5, '#c0392b');
  rrect(ctx, -54, -7, 16, 14, 4, '#ffd24a');
  rrect(ctx, len - 62, -7, 16, 14, 4, '#ffd24a');
  ctx.restore();
  // tay
  circle(ctx, 20, -78, 7, '#f4d3a6');

  // đầu
  circle(ctx, 2, -126, 28, '#a8652a');
  circle(ctx, -25, -124, 8, '#f4d3a6');
  circle(ctx, 28, -124, 7, '#f4d3a6');
  ctx.fillStyle = '#f4d3a6';
  ctx.beginPath();
  ctx.ellipse(6, -119, 20, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  eye(ctx, -1, -124, 4.5);
  eye(ctx, 14, -124, 4.5);
  ctx.strokeStyle = '#5a3215';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-7, -133);
  ctx.lineTo(4, -131);
  ctx.moveTo(10, -131);
  ctx.lineTo(21, -133);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(7, -112, 6, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.stroke();
  circle(ctx, -6, -114, 4, 'rgba(255,120,120,0.45)');
  circle(ctx, 21, -114, 4, 'rgba(255,120,120,0.45)');
  // kim cô
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(2, -126, 28, Math.PI * 1.08, Math.PI * 1.92);
  ctx.stroke();
  circle(ctx, 2, -153, 4, '#ffd24a');
  // chỏm lông
  ctx.fillStyle = '#a8652a';
  ctx.beginPath();
  ctx.moveTo(-6, -152);
  ctx.quadraticCurveTo(2, -172, 10, -152);
  ctx.fill();
}

function drawBajie(ctx: Ctx, pose: Pose) {
  const { swing, p, kind, t } = pose;
  legs(ctx, swing, '#2d3561', '#14141e', 14, 34);
  // bồ cào
  let ang = -1.0 + Math.sin(t * 2) * 0.04;
  if (kind === 'quake') ang = p < 0.55 ? -2.6 : -2.6 + easeOut((p - 0.55) / 0.45) * 3.3;
  if (kind === 'auto') ang = -1.9 + p * 2.2;
  if (kind === 'slam') ang = p < 0.5 ? -2.8 : p < 0.66 ? -2.8 + ((p - 0.5) / 0.16) * 3.4 : 0.6 - ((p - 0.66) / 0.34) * 1.6;
  ctx.save();
  ctx.translate(30, -68);
  ctx.rotate(ang);
  rrect(ctx, -40, -4, 160, 8, 4, '#7a4a24');
  rrect(ctx, 112, -26, 12, 52, 3, '#c9c9d6');
  for (let i = 0; i < 9; i++) rrect(ctx, 122, -24 + i * 5.6, 14, 3, 1, '#e8e8f0');
  ctx.restore();
  // thân
  ellipse(ctx, 0, -66, 40, 36, '#33407a');
  ellipse(ctx, 8, -62, 23, 25, '#ffc2cf');
  circle(ctx, 10, -58, 2.5, '#d77a90');
  rrect(ctx, -40, -46, 80, 8, 4, '#e0a43a');
  circle(ctx, 30, -68, 8, '#ffb3c6');
  // đầu
  ctx.fillStyle = '#ff9bb5';
  ctx.beginPath();
  ctx.moveTo(-26, -138);
  ctx.lineTo(-40, -164);
  ctx.lineTo(-8, -150);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(22, -142);
  ctx.lineTo(34, -168);
  ctx.lineTo(4, -152);
  ctx.closePath();
  ctx.fill();
  circle(ctx, 2, -120, 31, '#ffb3c6');
  ellipse(ctx, 26, -112, 14, 11, '#ff8fae');
  circle(ctx, 22, -112, 3, '#9b3a55');
  circle(ctx, 31, -112, 3, '#9b3a55');
  eye(ctx, -2, -128, 4);
  eye(ctx, 14, -130, 4);
  ctx.strokeStyle = '#9b3a55';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(12, -100, 8, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  circle(ctx, -12, -112, 5, 'rgba(255,90,130,0.35)');
}

function drawSha(ctx: Ctx, pose: Pose, shieldUp: boolean) {
  const { swing, p, kind, t } = pose;
  legs(ctx, swing, '#4a3b2a', '#20160e');
  // nguyệt nha sạn
  let ang = -1.45 + Math.sin(t * 2) * 0.04;
  if (kind === 'shield') ang = -1.57 - Math.sin(p * Math.PI) * 0.2;
  if (kind === 'auto') ang = -2.0 + p * 2.0;
  if (kind === 'crescent') ang = p < 0.4 ? -1.45 - (p / 0.4) * 1.3 : -2.75 + easeOut((p - 0.4) / 0.6) * 3.2;
  ctx.save();
  ctx.translate(22, -74);
  ctx.rotate(ang);
  rrect(ctx, -50, -4, 170, 8, 4, '#8a8f9e');
  // lưỡi trăng khuyết
  ctx.strokeStyle = '#e6eaf2';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(126, 0, 16, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  rrect(ctx, -62, -9, 16, 18, 4, '#e6eaf2');
  ctx.restore();
  // thân
  rrect(ctx, -22, -104, 44, 64, 12, '#6d7b8f');
  rrect(ctx, -23, -62, 46, 7, 3, '#7a4a24');
  circle(ctx, 22, -74, 7, '#8fb3c9');
  // chuỗi hạt
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * 0.1 + (i / 8) * Math.PI * 0.8;
    circle(ctx, Math.cos(a) * 20, -100 + Math.sin(a) * 16, 5, i % 2 ? '#7a2a1a' : '#a33a24');
  }
  // đầu
  circle(ctx, 2, -128, 25, '#8fb3c9');
  ctx.fillStyle = '#d9532b';
  ctx.beginPath();
  ctx.arc(2, -128, 27, Math.PI * 0.75, Math.PI * 1.15);
  ctx.arc(2, -128, 22, Math.PI * 1.15, Math.PI * 0.75, true);
  ctx.fill();
  // râu đỏ
  ctx.beginPath();
  ctx.moveTo(-16, -116);
  ctx.quadraticCurveTo(4, -84, 24, -116);
  ctx.quadraticCurveTo(4, -104, -16, -116);
  ctx.fill();
  ellipse(ctx, 8, -146, 8, 4, 'rgba(255,255,255,0.35)');
  eye(ctx, -2, -130, 5);
  eye(ctx, 14, -130, 5);
  ctx.strokeStyle = '#2a3a48';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-9, -140);
  ctx.lineTo(4, -137);
  ctx.moveTo(10, -137);
  ctx.lineTo(22, -140);
  ctx.stroke();
  if (shieldUp) {
    ctx.save();
    ctx.shadowColor = '#7fd4ff';
    ctx.shadowBlur = 20;
    circle(ctx, 2, -128, 4, '#bff0ff');
    ctx.restore();
  }
}

function drawTang(ctx: Ctx, e: GameEngine, swing: number) {
  const t = e.time;
  const casting = e.tang.castT > 0 || e.tang.chantT > 0;
  const energyRatio = Math.min(1, e.tang.energy / TANG.energyMax);
  if (casting || energyRatio > 0.8) {
    const k = casting ? 1 : (energyRatio - 0.8) * 5;
    const r = 60 + Math.sin(t * 6) * 6;
    const halo = ctx.createRadialGradient(0, -120, 5, 0, -120, r * 1.6);
    halo.addColorStop(0, `rgba(255,248,200,${0.8 * k})`);
    halo.addColorStop(1, 'rgba(255,220,120,0)');
    ctx.fillStyle = halo;
    ctx.fillRect(-r * 2, -120 - r * 2, r * 4, r * 4);
  }
  if (e.tang.chantT > 0) {
    // vòng kinh văn xoay quanh Đường Tăng khi niệm chú
    ctx.save();
    ctx.translate(0, -110);
    ctx.rotate(t * 1.5);
    ctx.strokeStyle = 'rgba(255,214,74,0.85)';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(0, 0, 78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffe98a';
    ctx.font = `900 18px ${FONT}`;
    ctx.textAlign = 'center';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.fillText('✦', Math.cos(a) * 78, Math.sin(a) * 78 + 6);
    }
    ctx.restore();
  }
  if (casting) {
    const g = ctx.createLinearGradient(0, -900, 0, 0);
    g.addColorStop(0, 'rgba(255,250,210,0)');
    g.addColorStop(1, 'rgba(255,250,210,0.5)');
    ctx.fillStyle = g;
    ctx.fillRect(-46, -900, 92, 900);
  }
  // chân
  legs(ctx, swing * 0.6, '#c9c0b0', '#3a2a1a', 9, 22);
  // tích trượng
  ctx.fillStyle = '#d9a52b';
  rrect(ctx, 26, -190, 5, 190, 2, '#d9a52b');
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(28.5, -200, 13, 0, Math.PI * 2);
  ctx.stroke();
  for (const dx of [-10, 10]) {
    ctx.beginPath();
    ctx.arc(28.5 + dx, -192, 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  // áo cà sa
  ctx.fillStyle = '#d63b2f';
  ctx.beginPath();
  ctx.moveTo(-18, -104);
  ctx.lineTo(18, -104);
  ctx.lineTo(30, -16);
  ctx.lineTo(-30, -16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-30 + i * 2, -16 - i * 22);
    ctx.lineTo(30 - i * 2, -16 - i * 22);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd24a';
  ctx.beginPath();
  ctx.moveTo(-18, -104);
  ctx.lineTo(-8, -104);
  ctx.lineTo(26, -30);
  ctx.lineTo(18, -24);
  ctx.closePath();
  ctx.fill();
  // tay chắp
  circle(ctx, casting ? 2 : 26, casting ? -88 : -84, 7, '#f5d6b5');
  // đầu
  circle(ctx, 0, -128, 23, '#f5d6b5');
  circle(ctx, -22, -126, 6, '#f5d6b5');
  ctx.strokeStyle = '#6b4a30';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(-6, -128, 4, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.moveTo(14, -128);
  ctx.arc(10, -128, 4, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(3, -117, 5, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  circle(ctx, 2, -140, 2.5, '#d63b2f');
  // mũ Tỳ Lư
  ctx.fillStyle = '#ffd24a';
  for (let i = 0; i < 5; i++) {
    const x = -20 + i * 10;
    ctx.beginPath();
    ctx.moveTo(x - 6, -146);
    ctx.quadraticCurveTo(x, -170 + Math.abs(i - 2) * 4, x + 6, -146);
    ctx.closePath();
    ctx.fill();
  }
  rrect(ctx, -24, -150, 48, 7, 3, '#e8b931');
}

function heroPose(e: GameEngine, h: HeroState, i: number): { dx: number; dy: number; pose: Pose } {
  const walking = e.phase === 'walking' || e.phase === 'final_walk';
  const t = e.time;
  const swing = walking ? Math.sin(t * 10 + i * 1.3) * 0.45 : 0;
  const bob = walking ? -Math.abs(Math.sin(t * 10 + i * 1.3)) * 6 : Math.sin(t * 2.4 + i) * 2;
  const p = h.attackT > 0 ? 1 - h.attackT / h.attackDur : -1;
  let dx = 0;
  let dy = bob;
  if (p >= 0) {
    const s = Math.sin(p * Math.PI);
    switch (h.attackKind) {
      case 'auto':
        dx = s * 40;
        break;
      case 'staff':
        dx = s * (BOSS_X - 170 - h.def.x);
        dy -= s * 70;
        break;
      case 'quake':
        dx = s * 110;
        dy -= Math.sin(Math.min(1, p / 0.6) * Math.PI) * 180;
        break;
      case 'ultimate':
        dy -= Math.sin(Math.min(1, p * 2) * Math.PI * 0.5) * 230 * (1 - Math.max(0, p - 0.8) * 5);
        dx = Math.sin(Math.min(1, p * 2) * Math.PI * 0.5) * 60 * (1 - Math.max(0, p - 0.8) * 5);
        break;
      case 'shield':
        dy -= s * 12;
        break;
      case 'crescent':
        dx = s * 30;
        dy -= s * 10;
        break;
      case 'slam': {
        // bay vút lên rồi nện xuống trước mặt boss, sau đó nhảy về chỗ
        const reach = BOSS_X - 120 - h.def.x;
        if (p < 0.66) {
          const k = p / 0.66;
          dx = easeOut(k) * reach;
          dy -= Math.sin(k * Math.PI) * 340;
        } else {
          const k = (p - 0.66) / 0.34;
          dx = (1 - k) * reach;
          dy -= Math.sin(k * Math.PI) * 90;
        }
        break;
      }
    }
  }
  if (h.hurtT > 0) dx -= h.hurtT * 50;
  return { dx, dy, pose: { swing, bob, p, kind: h.attackKind, t } };
}

function drawHero(ctx: Ctx, e: GameEngine, h: HeroState, i: number) {
  const { dx, dy, pose } = heroPose(e, h, i);
  ctx.save();
  // bóng
  ellipse(ctx, h.def.x + dx, GROUND_Y + 4, 34 * (1 - Math.min(0.5, -dy / 400)), 8, 'rgba(0,0,0,0.3)');
  ctx.translate(h.def.x + dx, GROUND_Y + dy);
  if (h.ko) {
    ctx.translate(-20, -10);
    ctx.rotate(-Math.PI / 2);
    ctx.globalAlpha = 0.65;
    ctx.filter = 'grayscale(1) brightness(0.8)';
  } else if (h.hurtT > 0 && Math.floor(h.hurtT * 30) % 2 === 0) {
    ctx.filter = 'brightness(1.8) saturate(0.4)';
  } else if (h.healT > 0) {
    ctx.filter = `brightness(${1 + h.healT * 0.6})`;
  }
  if (h.attackKind === 'ultimate' || h.attackKind === 'slam' || h.attackKind === 'crescent') {
    ctx.shadowColor = h.attackKind === 'ultimate' ? '#ffe066' : h.def.color;
    ctx.shadowBlur = 30;
  }
  if (h.def.id === 'wukong') drawWukong(ctx, pose);
  else if (h.def.id === 'bajie') drawBajie(ctx, pose);
  else drawSha(ctx, pose, e.shieldT > 0);
  ctx.restore();
  if (h.ko) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = `800 22px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText('z', h.def.x + 30 + Math.sin(e.time * 3) * 4, GROUND_Y - 70 - ((e.time * 20) % 30));
  }
}

// ---------------- boss ----------------

function drawBoss(ctx: Ctx, e: GameEngine) {
  const b = e.boss;
  const t = e.time;
  let alpha = 1;
  let ox = 0;
  if (e.phase === 'intro') {
    const k = easeOut(b.enterT);
    ox = (1 - k) * 320;
    alpha = k;
  }
  if (e.phase === 'victory') {
    alpha = Math.max(0, 1 - b.dieT / 1.4);
    if (alpha <= 0) return;
  }
  if (e.phase === 'walking' || e.phase === 'final_walk' || e.phase === 'complete') return;

  const lunge = b.lungeT > 0 ? Math.sin((1 - b.lungeT / 0.5) * Math.PI) * -70 : 0;
  const cast = b.castT > 0 ? Math.sin((1 - b.castT / 0.9) * Math.PI) : 0;
  const shakeX = b.hurtT > 0 ? Math.sin(t * 90) * 8 : 0;
  const x = BOSS_X + ox + lunge + shakeX;
  const y = BOSS_Y + Math.sin(t * 1.8) * 12 - cast * 30;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  if (e.phase === 'victory') ctx.scale(1 + b.dieT * 0.3, 1 + b.dieT * 0.3);
  // đổi màu để các boss cùng dáng trông khác nhau
  if (e.stage.boss.hue) ctx.filter = `hue-rotate(${e.stage.boss.hue}deg)`;
  if (e.stage.boss.kind === 'bull_king') drawBullKing(ctx, e, cast);
  else if (!drawExtraBoss(ctx, e, cast)) drawBoneDemon(ctx, e, cast);
  ctx.restore();
}

function drawBoneDemon(ctx: Ctx, e: GameEngine, cast: number) {
  const b = e.boss;
  const t = e.time;

  // hào quang yêu khí
  const ar = 190 + Math.sin(t * 3) * 10 + cast * 60;
  const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, ar);
  aura.addColorStop(0, b.enraged ? 'rgba(255,60,110,0.45)' : 'rgba(170,90,255,0.45)');
  aura.addColorStop(1, 'rgba(120,40,200,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(-ar, -ar, ar * 2, ar * 2);

  if (b.hurtT > 0) ctx.filter = 'brightness(2.2)';

  // xương bay quanh
  for (let i = 0; i < 6; i++) {
    const a = t * 1.2 + (i / 6) * Math.PI * 2;
    ctx.save();
    ctx.translate(Math.cos(a) * 150, Math.sin(a) * 60 - 20);
    ctx.rotate(a * 2);
    rrect(ctx, -12, -2.5, 24, 5, 2, '#efe7d4');
    circle(ctx, -12, -3, 3.5, '#efe7d4');
    circle(ctx, -12, 3, 3.5, '#efe7d4');
    circle(ctx, 12, -3, 3.5, '#efe7d4');
    circle(ctx, 12, 3, 3.5, '#efe7d4');
    ctx.restore();
  }

  // tóc dài phía sau
  ctx.fillStyle = '#1e0f2e';
  ctx.beginPath();
  ctx.moveTo(-26, -120);
  ctx.bezierCurveTo(60, -140, 90 + Math.sin(t * 2) * 10, -40, 70 + Math.sin(t * 2.3) * 14, 60);
  ctx.bezierCurveTo(40, 20, 20, -40, 20, -80);
  ctx.closePath();
  ctx.fill();

  // áo choàng trắng
  const robe = ctx.createLinearGradient(0, -70, 0, 150);
  robe.addColorStop(0, '#f7f2ff');
  robe.addColorStop(1, 'rgba(190,160,255,0.15)');
  ctx.fillStyle = robe;
  ctx.beginPath();
  ctx.moveTo(-34, -70);
  ctx.lineTo(34, -70);
  ctx.bezierCurveTo(70, 0, 90, 80, 110, 140);
  for (let i = 0; i <= 8; i++) {
    const px = 110 - i * 28;
    const py = 140 + Math.sin(t * 4 + i) * 10 + (i % 2) * 14;
    ctx.lineTo(px, py);
  }
  ctx.bezierCurveTo(-120, 80, -60, 0, -34, -70);
  ctx.closePath();
  ctx.fill();

  // sườn xương trên ngực
  ctx.strokeStyle = 'rgba(120,100,140,0.6)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(0, -40 + i * 15, 22 - i * 2, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, -60);
  ctx.lineTo(0, 10);
  ctx.stroke();

  // tay áo + móng vuốt
  const armReach = -110 - cast * 30 + (b.lungeT > 0 ? -40 : 0);
  const armY = -10 - cast * 80;
  ctx.fillStyle = '#ece4fb';
  ctx.beginPath();
  ctx.moveTo(-28, -64);
  ctx.quadraticCurveTo(-70, -60, armReach + 14, armY - 12);
  ctx.lineTo(armReach + 20, armY + 16);
  ctx.quadraticCurveTo(-60, -20, -20, -30);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#f4efe6';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(armReach + 14, armY + i * 6 - 6);
    ctx.quadraticCurveTo(armReach - 6, armY + i * 7 - 12, armReach - 18, armY + i * 9 - 2);
    ctx.stroke();
  }

  // đầu
  ctx.save();
  ctx.translate(0, -100);
  ellipse(ctx, 0, 0, 31, 37, '#f4efe6');
  // hốc mắt
  ellipse(ctx, -12, -4, 10, 12, '#2a1636', -0.2);
  ellipse(ctx, 12, -4, 10, 12, '#2a1636', 0.2);
  ctx.save();
  ctx.shadowColor = b.enraged ? '#ff2d55' : '#ff5a7a';
  ctx.shadowBlur = 20;
  circle(ctx, -12, -3, 4 + Math.sin(t * 8) * 0.8, b.enraged ? '#ff2d55' : '#ff6b8a');
  circle(ctx, 12, -3, 4 + Math.sin(t * 8) * 0.8, b.enraged ? '#ff2d55' : '#ff6b8a');
  ctx.restore();
  ctx.fillStyle = '#2a1636';
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.lineTo(-5, 16);
  ctx.lineTo(5, 16);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#2a1636';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 25);
  ctx.lineTo(14, 25);
  for (let i = -2; i <= 2; i++) {
    ctx.moveTo(i * 5, 21);
    ctx.lineTo(i * 5, 29);
  }
  ctx.stroke();
  // vương miện xương
  ctx.fillStyle = '#efe7d4';
  for (let i = 0; i < 5; i++) {
    const cx = -24 + i * 12;
    const hgt = 22 - Math.abs(i - 2) * 5;
    ctx.beginPath();
    ctx.moveTo(cx - 5, -30);
    ctx.lineTo(cx, -30 - hgt);
    ctx.lineTo(cx + 5, -30);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#c8a2ff';
  circle(ctx, 0, -36, 5, '#b77cff');
  ctx.restore();
}

export function flame(ctx: Ctx, x: number, y: number, w: number, h: number, t: number, seed: number, outer: string, inner: string) {
  const fl = 1 + Math.sin(t * 12 + seed * 3.1) * 0.12 + Math.sin(t * 7.3 + seed) * 0.08;
  const sway = Math.sin(t * 5 + seed) * w * 0.25;
  for (const [k, col] of [
    [1, outer],
    [0.55, inner],
  ] as [number, string][]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - w * k, y);
    ctx.quadraticCurveTo(x - w * k, y - h * k * 0.6 * fl, x + sway * k, y - h * k * fl);
    ctx.quadraticCurveTo(x + w * k, y - h * k * 0.6 * fl, x + w * k, y);
    ctx.closePath();
    ctx.fill();
  }
}

function drawBullKing(ctx: Ctx, e: GameEngine, cast: number) {
  const b = e.boss;
  const t = e.time;
  // đứng trên mặt đất: triệt tiêu phần lơ lửng
  ctx.translate(0, -Math.sin(t * 1.8) * 12 + 4);

  // hào quang lửa
  const ar = 210 + Math.sin(t * 4) * 12 + cast * 70;
  const aura = ctx.createRadialGradient(0, 0, 20, 0, 0, ar);
  aura.addColorStop(0, b.enraged ? 'rgba(255,40,20,0.5)' : 'rgba(255,140,40,0.42)');
  aura.addColorStop(1, 'rgba(255,80,0,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(-ar, -ar, ar * 2, ar * 2);

  if (b.hurtT > 0) ctx.filter = 'brightness(2.2)';

  // áo choàng đỏ phía sau
  ctx.fillStyle = '#8e1b14';
  ctx.beginPath();
  ctx.moveTo(-40, -70);
  ctx.lineTo(50, -72);
  ctx.bezierCurveTo(95, 0, 110 + Math.sin(t * 2.4) * 10, 70, 120 + Math.sin(t * 2) * 14, 120);
  ctx.lineTo(10, 118);
  ctx.closePath();
  ctx.fill();

  // lửa sau lưng
  for (let i = 0; i < 5; i++) flame(ctx, -70 + i * 38, 132, 26, 70 + (i % 2) * 30 + cast * 40, t, i, 'rgba(255,90,20,0.75)', 'rgba(255,220,90,0.9)');

  // chân
  rrect(ctx, -36, 40, 28, 88, 10, '#2a1c18');
  rrect(ctx, 10, 40, 28, 88, 10, '#2a1c18');
  rrect(ctx, -44, 116, 40, 16, 6, '#1a100c');
  rrect(ctx, 4, 116, 40, 16, 6, '#1a100c');

  // thân giáp
  rrect(ctx, -56, -72, 112, 122, 22, '#3b2a26');
  rrect(ctx, -56, -72, 112, 122, 22, 'rgba(0,0,0,0)');
  ctx.strokeStyle = '#e0a73a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(-50, -66, 100, 110, 18);
  ctx.stroke();
  // giáp vảy
  ctx.strokeStyle = 'rgba(224,167,58,0.45)';
  ctx.lineWidth = 2.5;
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 4; c++) {
      ctx.beginPath();
      ctx.arc(-30 + c * 20 + (r % 2) * 10, -10 + r * 16, 10, 0, Math.PI);
      ctx.stroke();
    }
  // hộ tâm kính
  ctx.save();
  ctx.shadowColor = '#ffb347';
  ctx.shadowBlur = 18;
  circle(ctx, 0, -38, 17, '#e0a73a');
  circle(ctx, 0, -38, 10, b.enraged ? '#ff3b1f' : '#ff8a3d');
  ctx.restore();
  rrect(ctx, -58, 30, 116, 14, 5, '#e0a73a');

  // tay phải (phía sau) chống nạnh
  ellipse(ctx, 52, -30, 16, 30, '#5a3420', 0.3);

  // hỗn thiết côn
  const clubAng = -0.5 - cast * 1.6 + (b.lungeT > 0 ? Math.sin((1 - b.lungeT / 0.5) * Math.PI) * 1.1 : 0) + Math.sin(t * 2) * 0.05;
  ctx.save();
  ctx.translate(-70, -20 - cast * 50);
  ctx.rotate(clubAng);
  rrect(ctx, -10, -5, 150, 10, 4, '#4a4a52');
  rrect(ctx, -26, -14, 34, 28, 8, '#2b2b31');
  ctx.fillStyle = '#c9c9d2';
  for (let i = 0; i < 4; i++) {
    const sx = -22 + i * 9;
    ctx.beginPath();
    ctx.moveTo(sx, -14);
    ctx.lineTo(sx + 4, -24);
    ctx.lineTo(sx + 8, -14);
    ctx.moveTo(sx, 14);
    ctx.lineTo(sx + 4, 24);
    ctx.lineTo(sx + 8, 14);
    ctx.fill();
  }
  rrect(ctx, 130, -7, 14, 14, 3, '#e0a73a');
  ctx.restore();
  // tay trái cầm côn
  ctx.strokeStyle = '#5a3420';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-46, -54);
  ctx.lineTo(-70, -20 - cast * 50);
  ctx.stroke();
  // giáp vai
  for (const sx of [-1, 1]) {
    ctx.fillStyle = '#e0a73a';
    ctx.beginPath();
    ctx.arc(sx * 50, -62, 24, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b37a1f';
    ctx.beginPath();
    ctx.arc(sx * 50, -62, 14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
  }

  // đầu trâu
  ctx.save();
  ctx.translate(-4, -108);
  // sừng
  ctx.fillStyle = '#efe2c4';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(sx * 22, -18);
    ctx.bezierCurveTo(sx * 60, -14, sx * 80, -40, sx * 66, -78);
    ctx.bezierCurveTo(sx * 64, -50, sx * 48, -34, sx * 24, -34);
    ctx.closePath();
    ctx.fill();
  }
  // tai
  ellipse(ctx, -38, -8, 16, 8, '#4a2a18', -0.4);
  ellipse(ctx, 38, -8, 16, 8, '#4a2a18', 0.4);
  // mặt
  ellipse(ctx, 0, 0, 34, 38, '#5a3420');
  ctx.fillStyle = '#1a0f0a';
  ctx.beginPath();
  ctx.moveTo(-16, -36);
  ctx.quadraticCurveTo(0, -52, 16, -36);
  ctx.quadraticCurveTo(0, -28, -16, -36);
  ctx.fill();
  // mõm
  ellipse(ctx, -2, 22, 24, 17, '#c08a5a');
  ellipse(ctx, -11, 22, 4, 5, '#3a2014');
  ellipse(ctx, 7, 22, 4, 5, '#3a2014');
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(-2, 34, 8, 0, Math.PI * 2);
  ctx.stroke();
  // mắt rực
  ctx.save();
  ctx.shadowColor = b.enraged ? '#ff2d00' : '#ffb000';
  ctx.shadowBlur = 18;
  ctx.fillStyle = b.enraged ? '#ff3b1f' : '#ffd24a';
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(sx * 14 - 2, -6, 7, 4.5, sx * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle = '#1a0f0a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-26, -18);
  ctx.lineTo(-6, -11);
  ctx.moveTo(22, -18);
  ctx.lineTo(2, -11);
  ctx.stroke();
  // hơi thở khói khi niệm chiêu
  if (cast > 0.2) {
    for (let i = 0; i < 3; i++) circle(ctx, -30 - i * 14 - cast * 10, 26 + Math.sin(t * 9 + i) * 3, 6 + i * 3, `rgba(255,170,90,${0.5 - i * 0.12})`);
  }
  ctx.restore();
}

function drawImp(ctx: Ctx, m: Minion, t: number) {
  const hop = -Math.abs(Math.sin(m.hopT * 6)) * 8;
  ctx.save();
  ellipse(ctx, m.x, m.y + 3, 18, 5, 'rgba(0,0,0,0.3)');
  ctx.translate(m.x, m.y + hop);
  if (m.dead) {
    ctx.globalAlpha = Math.max(0, m.dieT / 0.6);
    ctx.scale(1 + (1 - m.dieT / 0.6) * 0.6, 1 - (1 - m.dieT / 0.6) * 0.5);
  }
  if (m.hurtT > 0) ctx.filter = 'brightness(2)';
  ctx.save();
  ctx.shadowColor = '#ff7a2e';
  ctx.shadowBlur = 16;
  flame(ctx, 0, 0, 20, 70, t, m.id, '#ff5a1f', '#ffc04d');
  ctx.restore();
  // sừng
  ctx.fillStyle = '#3a120a';
  ctx.beginPath();
  ctx.moveTo(-12, -40);
  ctx.lineTo(-16, -54);
  ctx.lineTo(-6, -44);
  ctx.moveTo(12, -40);
  ctx.lineTo(16, -54);
  ctx.lineTo(6, -44);
  ctx.fill();
  circle(ctx, -6, -26, 4.5, '#fff');
  circle(ctx, 6, -26, 4.5, '#fff');
  circle(ctx, -7, -26, 2.2, '#2a0a04');
  circle(ctx, 5, -26, 2.2, '#2a0a04');
  ctx.strokeStyle = '#2a0a04';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -16, 5, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();
  ctx.restore();
  if (!m.dead) {
    rrect(ctx, m.x - 16, m.y - 84 + hop, 32, 5, 2, 'rgba(0,0,0,0.5)');
    rrect(ctx, m.x - 16, m.y - 84 + hop, 32 * Math.max(0, m.hp / m.maxHp), 5, 2, '#ffb347');
  }
}

function drawMinion(ctx: Ctx, m: Minion, t: number) {
  const hop = -Math.abs(Math.sin(m.hopT * 6)) * 8;
  ctx.save();
  ellipse(ctx, m.x, m.y + 3, 18, 5, 'rgba(0,0,0,0.3)');
  ctx.translate(m.x, m.y + hop);
  if (m.dead) {
    ctx.globalAlpha = Math.max(0, m.dieT / 0.6);
    ctx.rotate((1 - m.dieT / 0.6) * 1.2);
  }
  if (m.hurtT > 0) ctx.filter = 'brightness(2)';
  ctx.strokeStyle = '#efe7d4';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  // chân
  ctx.moveTo(0, -24);
  ctx.lineTo(-7, 0);
  ctx.moveTo(0, -24);
  ctx.lineTo(7, 0);
  // sống lưng
  ctx.moveTo(0, -24);
  ctx.lineTo(0, -46);
  // tay
  ctx.moveTo(0, -42);
  ctx.lineTo(-16, -32 + Math.sin(t * 6 + m.id) * 4);
  ctx.moveTo(0, -42);
  ctx.lineTo(12, -30);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-8, -40 + i * 6);
    ctx.lineTo(8, -40 + i * 6);
    ctx.stroke();
  }
  circle(ctx, 0, -58, 13, '#efe7d4');
  circle(ctx, -5, -59, 3.5, '#2a1636');
  circle(ctx, 5, -59, 3.5, '#2a1636');
  circle(ctx, -5, -59, 1.5, '#d07bff');
  circle(ctx, 5, -59, 1.5, '#d07bff');
  ctx.restore();
  // thanh máu nhỏ
  if (!m.dead) {
    rrect(ctx, m.x - 16, m.y - 84 + hop, 32, 5, 2, 'rgba(0,0,0,0.5)');
    rrect(ctx, m.x - 16, m.y - 84 + hop, 32 * Math.max(0, m.hp / m.maxHp), 5, 2, '#d07bff');
  }
}

function drawClone(ctx: Ctx, e: GameEngine, c: { x: number; y: number; t: number; max: number; flip: boolean }) {
  const k = c.t / c.max;
  ctx.save();
  ctx.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
  ctx.translate(c.x, c.y);
  if (c.flip) ctx.scale(-1, 1);
  ctx.scale(0.75, 0.75);
  ctx.shadowColor = '#ffe066';
  ctx.shadowBlur = 25;
  drawWukong(ctx, { swing: 0, bob: 0, p: Math.min(1, k * 2.5), kind: 'staff', t: e.time });
  ctx.restore();
}

// ---------------- hiệu ứng ----------------

/** Kim Cang Chú: pháp trận vàng dưới chân boss và vòng kim cô trói quanh người */
function drawSeal(ctx: Ctx, e: GameEngine) {
  const t = e.time;
  const a = Math.min(1, e.sealT) * (0.8 + Math.sin(t * 6) * 0.2);
  ctx.save();
  ctx.globalAlpha = a;
  // pháp trận
  ctx.save();
  ctx.translate(BOSS_X, GROUND_Y);
  ctx.scale(1, 0.28);
  ctx.shadowColor = '#ffd24a';
  ctx.shadowBlur = 24;
  ctx.strokeStyle = '#ffd24a';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 170, 0, Math.PI * 2);
  ctx.stroke();
  ctx.rotate(t * 0.8);
  ctx.lineWidth = 4;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const ang = (i / 8) * Math.PI * 2 * 3;
    const x = Math.cos(ang) * 140;
    const y = Math.sin(ang) * 140;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // vòng trói
  ctx.strokeStyle = '#ffe98a';
  ctx.shadowColor = '#ffd24a';
  ctx.shadowBlur = 18;
  for (let i = 0; i < 3; i++) {
    const y = BOSS_Y - 150 + i * 90 + Math.sin(t * 3 + i) * 6;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(BOSS_X, y, 120 - i * 6, 22, Math.sin(t + i) * 0.08, 0, Math.PI * 2);
    ctx.stroke();
  }
  // chữ "Định"
  ctx.font = `900 46px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff2a8';
  ctx.fillText('定', BOSS_X, BOSS_Y - 250 + Math.sin(t * 3) * 6);
  ctx.restore();
}

/** đòn kết liễu hợp kích: cây gậy Như Ý khổng lồ từ trời nện xuống boss */
function drawComboStaff(ctx: Ctx, e: GameEngine) {
  const t = e.combo.t;
  const start = COMBO_IMPACT - 0.55;
  if (t < start) return;
  const k = Math.min(1, (t - start) / 0.55);
  const fade = t > COMBO_IMPACT ? Math.max(0, 1 - (t - COMBO_IMPACT) / 0.7) : 1;
  const len = 1100;
  const tipY = -len + 120 + (GROUND_Y + 30 - (-len + 120)) * (k * k);
  const bottom = Math.min(tipY, GROUND_Y + 30);
  ctx.save();
  ctx.globalAlpha = fade;
  // cột sáng
  const beam = ctx.createLinearGradient(BOSS_X - 120, 0, BOSS_X + 120, 0);
  beam.addColorStop(0, 'rgba(255,240,160,0)');
  beam.addColorStop(0.5, `rgba(255,240,160,${0.55 * k})`);
  beam.addColorStop(1, 'rgba(255,240,160,0)');
  ctx.fillStyle = beam;
  ctx.fillRect(BOSS_X - 120, 0, 240, bottom);
  // thân gậy
  ctx.shadowColor = '#ffd24a';
  ctx.shadowBlur = 40;
  const w = 76;
  rrect(ctx, BOSS_X - w / 2, bottom - len, w, len, 14, '#c0262a');
  rrect(ctx, BOSS_X - w / 2 + 8, bottom - len, 10, len, 5, 'rgba(255,255,255,0.25)');
  for (const yy of [bottom - 90, bottom - len + 20]) rrect(ctx, BOSS_X - w / 2 - 8, yy, w + 16, 70, 12, '#ffd24a');
  ctx.restore();
}

function drawEffects(ctx: Ctx, e: GameEngine) {
  // khiên Sa Tăng
  if (e.shieldT > 0) {
    const a = Math.min(1, e.shieldT) * (0.55 + Math.sin(e.time * 5) * 0.1);
    ctx.save();
    ctx.globalAlpha = a;
    const cx = 250;
    const cy = GROUND_Y - 40;
    const g = ctx.createRadialGradient(cx, cy, 80, cx, cy, 250);
    g.addColorStop(0, 'rgba(127,212,255,0.05)');
    g.addColorStop(1, 'rgba(127,212,255,0.35)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 240, 190, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#bfefff';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 240, 190, 0, Math.PI, 0);
    ctx.stroke();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(191,239,255,0.5)';
    for (let i = 1; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(cx, cy, 240 * (i / 6), 190, 0, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  for (const p of e.projectiles) {
    const k = Math.max(0, p.t / p.dur);
    const x = p.x0 + (p.x1 - p.x0) * k;
    const arc = p.kind === 'crescent' ? 0 : p.kind === 'minion' ? 40 : 90;
    const y = p.y0 + (p.y1 - p.y0) * k - Math.sin(k * Math.PI) * arc;
    ctx.save();
    ctx.translate(x, y);
    const fire = e.stage.boss.projectile === 'fire';
    const pc = e.stage.boss.projColor;
    if (p.kind === 'crescent') {
      // trăng khuyết của Sa Tăng, kéo theo vệt sáng
      ctx.shadowColor = '#7fd4ff';
      ctx.shadowBlur = 26;
      for (let i = 4; i >= 0; i--) {
        ctx.globalAlpha = i === 0 ? 1 : 0.45 - i * 0.08;
        ctx.fillStyle = i === 0 ? '#ffffff' : '#7fd4ff';
        ctx.beginPath();
        ctx.arc(-i * 22, 0, 46, -Math.PI / 2, Math.PI / 2);
        ctx.arc(-i * 22 - 18, 0, 40, Math.PI / 2, -Math.PI / 2, true);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    } else if (p.kind === 'orb') {
      const col = pc ?? e.stage.palette.accent;
      ctx.shadowColor = col;
      ctx.shadowBlur = 20;
      const dxp = p.x1 - p.x0;
      for (let i = 4; i >= 0; i--) {
        ctx.globalAlpha = 1 - i * 0.18;
        circle(ctx, Math.sign(-dxp) * i * 10, -i * 2, 13 - i * 2, i === 0 ? '#ffffff' : col);
      }
      ctx.globalAlpha = 1;
    } else if (p.kind === 'fire') {
      ctx.shadowColor = '#ff7a2e';
      ctx.shadowBlur = 22;
      const dxp = p.x1 - p.x0;
      for (let i = 4; i >= 0; i--) {
        circle(ctx, Math.sign(-dxp) * i * 9, -i * 2, 14 - i * 2.2, i === 0 ? '#fff3c4' : `rgba(255,${120 + i * 20},40,${0.85 - i * 0.15})`);
      }
    } else if (p.kind === 'bone') {
      ctx.rotate(e.time * 20);
      ctx.shadowColor = '#c8a2ff';
      ctx.shadowBlur = 15;
      rrect(ctx, -16, -3, 32, 6, 3, '#f4efe6');
      for (const [bx, by] of [
        [-16, -4],
        [-16, 4],
        [16, -4],
        [16, 4],
      ])
        circle(ctx, bx, by, 4.5, '#f4efe6');
    } else {
      const r = p.kind === 'aoe' ? 22 : 11;
      const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, fire ? '#ff7a2e' : pc ?? (p.kind === 'aoe' ? '#c06bff' : '#d07bff'));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  if (e.sealT > 0 && (e.phase === 'battle' || e.phase === 'wiped')) drawSeal(ctx, e);
  if (e.combo.active) drawComboStaff(ctx, e);

  for (const r of e.rings) {
    const k = r.life / r.max;
    const rad = r.r0 + (r.r1 - r.r0) * easeOut(k);
    ctx.save();
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width * (1 - k * 0.6);
    ctx.beginPath();
    if (r.flat) ctx.ellipse(r.x, r.y, rad, rad * 0.22, 0, 0, Math.PI * 2);
    else ctx.arc(r.x, r.y, rad, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  for (const s of e.slashes) {
    const k = s.life / s.max;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.globalAlpha = 1 - k;
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    const len = s.size * (0.6 + k * 0.6);
    ctx.moveTo(-len / 2, 0);
    ctx.quadraticCurveTo(0, -26 * (1 - k), len / 2, 0);
    ctx.quadraticCurveTo(0, -8, -len / 2, 0);
    ctx.fill();
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 6 * (1 - k);
    ctx.stroke();
    ctx.restore();
  }

  for (const p of e.particles) {
    const k = p.life / p.max;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = p.kind === 'heart' ? Math.min(1, (1 - k) * 2) : 1 - k;
    switch (p.kind) {
      case 'heart':
        ctx.rotate(p.rot);
        ctx.scale(1 + k * 0.3, 1 + k * 0.3);
        heartPath(ctx, p.size);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        break;
      case 'glow': {
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
        g.addColorStop(0, p.color);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-p.size * 2, -p.size * 2, p.size * 4, p.size * 4);
        break;
      }
      case 'bone':
        ctx.rotate(p.rot);
        rrect(ctx, -p.size, -p.size * 0.25, p.size * 2, p.size * 0.5, 2, p.color);
        break;
      case 'petal':
        ctx.rotate(p.rot);
        ellipse(ctx, 0, 0, p.size, p.size * 0.5, p.color);
        break;
      case 'smoke':
        circle(ctx, 0, 0, p.size * (1 + k), p.color);
        break;
      default:
        circle(ctx, 0, 0, p.size * (1 - k * 0.5), p.color);
    }
    ctx.restore();
  }

  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  for (const t of e.texts) {
    const k = t.life / t.max;
    const pop = k < 0.15 ? 0.6 + (k / 0.15) * 0.6 : 1.2 - Math.min(0.2, (k - 0.15) * 0.5);
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.scale(pop, pop);
    ctx.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
    ctx.font = `900 ${t.size}px ${FONT}`;
    ctx.lineWidth = Math.max(4, t.size * 0.18);
    ctx.strokeStyle = 'rgba(20,8,30,0.9)';
    ctx.strokeText(t.text, 0, 0);
    ctx.fillStyle = t.color;
    ctx.fillText(t.text, 0, 0);
    ctx.restore();
  }
}

// ---------------- khung hình ----------------

const imgCache = new Map<string, HTMLImageElement>();
/** ảnh quà TikTok (tải một lần, vẽ khi đã tải xong) */
function giftImage(url: string): HTMLImageElement | null {
  let img = imgCache.get(url);
  if (!img) {
    img = new Image();
    img.referrerPolicy = 'no-referrer';
    img.src = url;
    imgCache.set(url, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}

/** bong bóng thoại nhân vật nhắc người xem tặng quà */
function drawNudge(ctx: Ctx, e: GameEngine) {
  const n = e.nudge;
  if (!n) return;
  const sx = n.speaker === 'tang' ? TANG.x : HEROES.find((h) => h.id === n.speaker)!.x;
  const headY = GROUND_Y - (n.speaker === 'tang' ? 215 : 195);
  const k = n.t / n.max;
  const a = k < 0.08 ? k / 0.08 : k > 0.88 ? (1 - k) / 0.12 : 1;
  const pop = k < 0.08 ? 0.7 + (k / 0.08) * 0.3 : 1;

  ctx.save();
  ctx.font = `800 25px ${FONT}`;
  // ngắt dòng, tối đa ~360px mỗi dòng
  const words = n.text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > 360 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  const lh = 32;
  const icon = n.image ? giftImage(n.image) : null;
  const iconW = icon ? 64 : 0;
  const bw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 36 + iconW;
  const bh = Math.max(lines.length * lh + 22, icon ? 72 : 0);
  const bx = Math.max(12, Math.min(W - 12 - bw, sx - bw / 2));
  const by = headY - 34 - bh - Math.sin(e.time * 3) * 3;

  ctx.globalAlpha = a;
  ctx.translate(sx, by + bh);
  ctx.scale(pop, pop);
  ctx.translate(-sx, -(by + bh));
  ctx.shadowColor = 'rgba(0,0,0,0.45)';
  ctx.shadowBlur = 14;
  rrect(ctx, bx, by, bw, bh, 18, '#fffaf0');
  ctx.shadowBlur = 0;
  // đuôi bong bóng chỉ vào nhân vật
  ctx.fillStyle = '#fffaf0';
  ctx.beginPath();
  ctx.moveTo(sx - 12, by + bh - 2);
  ctx.lineTo(sx + 12, by + bh - 2);
  ctx.lineTo(sx, by + bh + 22);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#ffb020';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(bx, by, bw, bh, 18);
  ctx.stroke();
  ctx.fillStyle = '#3a1a06';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (icon) ctx.drawImage(icon, bx + 14, by + bh / 2 - 26, 52, 52);
  const ty = by + bh / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => ctx.fillText(l, bx + iconW + (bw - iconW) / 2, ty + i * lh));
  ctx.restore();
}

/** nền tối + tia tốc độ hướng vào boss trong lúc hợp kích */
function drawComboBackdrop(ctx: Ctx, e: GameEngine) {
  const t = e.combo.t;
  const inA = Math.min(1, t / 0.3);
  const outA = t > COMBO_IMPACT ? Math.max(0, 1 - (t - COMBO_IMPACT) / 0.6) : 1;
  const a = inA * outA;
  ctx.save();
  ctx.globalAlpha = a * 0.6;
  ctx.fillStyle = '#12061e';
  ctx.fillRect(0, 0, W, H);
  // tia tốc độ
  ctx.globalAlpha = a * 0.5;
  ctx.strokeStyle = '#fff2a8';
  for (let i = 0; i < 28; i++) {
    const ang = (i / 28) * Math.PI * 2 + Math.floor(e.time * 20) * 0.37;
    const r0 = 260 + ((i * 53) % 90);
    ctx.lineWidth = 1 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(BOSS_X + Math.cos(ang) * r0, BOSS_Y + Math.sin(ang) * r0);
    ctx.lineTo(BOSS_X + Math.cos(ang) * 900, BOSS_Y + Math.sin(ang) * 900);
    ctx.stroke();
  }
  ctx.restore();
}

/** chữ "HỢP KÍCH" đóng dấu giữa màn hình khi mở đầu chiêu */
function drawComboStamp(ctx: Ctx, e: GameEngine) {
  const t = e.combo.t;
  if (t > 1.1) return;
  const pop = t < 0.15 ? 2.2 - (t / 0.15) * 1.2 : 1;
  ctx.save();
  ctx.globalAlpha = t > 0.8 ? (1.1 - t) / 0.3 : 1;
  ctx.translate(W / 2, 560);
  ctx.scale(pop, pop);
  ctx.rotate(-0.06);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.font = `900 92px ${FONT}`;
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#4a1300';
  ctx.strokeText('HỢP KÍCH', 0, 0);
  const g = ctx.createLinearGradient(0, -70, 0, 10);
  g.addColorStop(0, '#fffbe0');
  g.addColorStop(1, '#ffb020');
  ctx.fillStyle = g;
  ctx.fillText('HỢP KÍCH', 0, 0);
  ctx.font = `900 30px ${FONT}`;
  ctx.lineWidth = 8;
  ctx.strokeText('THẦY TRÒ ĐỒNG LÒNG', 0, 50);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('THẦY TRÒ ĐỒNG LÒNG', 0, 50);
  ctx.restore();
}

export function renderFrame(ctx: Ctx, e: GameEngine) {
  ctx.save();
  if (e.shake > 0) ctx.translate((Math.random() - 0.5) * e.shake, (Math.random() - 0.5) * e.shake);

  let golden = 0;
  if (e.phase === 'final_walk') golden = Math.min(1, e.phaseT / 4) * 0.85;
  if (e.phase === 'complete') golden = 0.85;
  drawBackground(ctx, e, golden);

  if (e.phase === 'final_walk' || e.phase === 'complete') {
    const k = e.phase === 'complete' ? 1 : easeOut(Math.min(1, e.phaseT / 4.5));
    drawTemple(ctx, W + 220 - k * 360, 880, e.time);
  }

  if (e.combo.active) drawComboBackdrop(ctx, e);

  drawBoss(ctx, e);
  for (const m of e.minions) {
    const mk = e.stage.boss.minionKind;
    if (mk === 'imp') drawImp(ctx, m, e.time);
    else if (mk === 'blob') drawBlobMinion(ctx, m, e.time, e.stage.palette.accent);
    else if (mk === 'spiderling') drawSpiderling(ctx, m, e.time);
    else drawMinion(ctx, m, e.time);
  }

  // Đường Tăng
  const walking = e.phase === 'walking' || e.phase === 'final_walk';
  ctx.save();
  ellipse(ctx, TANG.x, GROUND_Y + 4, 30, 8, 'rgba(0,0,0,0.3)');
  ctx.translate(TANG.x, GROUND_Y + (walking ? -Math.abs(Math.sin(e.time * 10 + 3)) * 5 : Math.sin(e.time * 2) * 2));
  drawTang(ctx, e, walking ? Math.sin(e.time * 10 + 3) * 0.45 : 0);
  ctx.restore();

  e.heroes
    .slice()
    .sort((a, b) => a.def.x - b.def.x)
    .forEach((h, i) => drawHero(ctx, e, h, i));

  for (const c of e.clones) drawClone(ctx, e, c);
  drawEffects(ctx, e);
  drawNudge(ctx, e);
  if (e.combo.active) drawComboStamp(ctx, e);
  ctx.restore();

  if (e.flash.a > 0) {
    ctx.globalAlpha = e.flash.a;
    ctx.fillStyle = e.flash.color;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }

  const vig = ctx.createRadialGradient(W / 2, H * 0.55, H * 0.3, W / 2, H * 0.55, H * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}
