import { useEffect, useRef } from 'react';
import { H, W, type GameEngine } from '../game/engine';
import { renderFrame } from '../game/render';
import { Hud } from './Hud';

/** Sân khấu 9:16: canvas vẽ cảnh + lớp HUD bằng DOM để chữ luôn sắc nét khi capture. */
export function Stage({ engine }: { engine: GameEngine }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      engine.tick(dt);
      ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
      renderFrame(ctx, engine);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [engine]);

  return (
    <div className="stage" id="stage">
      <canvas ref={canvasRef} className="stage-canvas" />
      <Hud engine={engine} />
    </div>
  );
}
