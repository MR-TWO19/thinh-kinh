import { useEffect, useMemo } from 'react';
import { eventBus } from './events/bus';
import { GameEngine } from './game/engine';
import { Stage } from './components/Stage';
import { ControlPanel } from './components/ControlPanel';
import { useShortcuts } from './components/useShortcuts';
import { SimulatorSource } from './events/sources';
import { TikTokRelaySource } from './events/tiktokSource';

/**
 * ?view=stage  -> chỉ sân khấu 9:16 (để capture bằng OBS / TikTok LIVE Studio)
 * ?view=panel  -> chỉ bảng điều khiển (điều khiển cửa sổ sân khấu qua BroadcastChannel)
 * mặc định     -> sân khấu + bảng điều khiển cạnh nhau
 */
export default function App() {
  const view = new URLSearchParams(location.search).get('view') ?? 'both';

  if (view === 'panel') {
    return (
      <div className="layout panel-only">
        <ControlPanel standalone />
      </div>
    );
  }
  return <StageApp withPanel={view !== 'stage'} />;
}

function StageApp({ withPanel }: { withPanel: boolean }) {
  const engine = useMemo(() => new GameEngine(), []);
  useEffect(() => eventBus.subscribe((env) => engine.handle(env)), [engine]);
  // nhận tim / quà thật từ relay TikTok (npm run relay); relay chưa chạy thì tự thử lại
  useEffect(() => {
    const live = new TikTokRelaySource();
    live.onCatalog = (gifts) => engine.setCatalog(gifts);
    live.start(eventBus);
    return () => live.stop();
  }, [engine]);
  useEffect(() => {
    // chỉ khi dev: window.__tkEngine để debug / tua nhanh trong console
    if (import.meta.env.DEV) (window as unknown as { __tkEngine: GameEngine }).__tkEngine = engine;
  }, [engine]);

  return (
    <div className={`layout ${withPanel ? 'with-panel' : 'stage-only'}`}>
      <Stage engine={engine} />
      {withPanel ? <ControlPanel /> : <StageShortcuts />}
    </div>
  );
}

/** Ở chế độ chỉ-sân-khấu vẫn bấm phím tắt được (mỗi lần 1 quà). */
function StageShortcuts() {
  const sim = useMemo(() => {
    const s = new SimulatorSource();
    s.start(eventBus);
    return s;
  }, []);
  useShortcuts(sim, 1);
  return null;
}
