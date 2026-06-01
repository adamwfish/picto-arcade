import { useEffect, useRef, useState } from 'react';
import type { HudState } from '../game/types';

interface Props {
  getHud: () => HudState;
}

function fmtTime(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, '0')}`;
}

/**
 * Live race HUD. Reads the engine's mutable hud snapshot on its own animation
 * frame and throttles React updates to ~20fps so we never thrash the tree.
 */
export function Hud({ getHud }: Props) {
  const [h, setH] = useState<HudState>(getHud());
  const lastUpdate = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      if (now - lastUpdate.current > 50) {
        lastUpdate.current = now;
        setH({ ...getHud() });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getHud]);

  const timeDanger = !h.timeIsElapsed && h.timeLeft <= 10;

  return (
    <div className="hud">
      {/* Speed */}
      <div className="hud-bubble hud-tl">
        <div className="hud-label">SPEED</div>
        <div className="speed-meter">
          <span className="hud-value">{h.speed}</span>
          <span className="speed-unit">MPH</span>
        </div>
        <div className="hud-label" style={{ marginTop: 4 }}>ALT {h.altitude}</div>
      </div>

      {/* Multiplier pop */}
      {h.multiplier > 1 && <div className="multiplier-pop">x{h.multiplier.toFixed(1)}</div>}

      {/* Time */}
      <div className={`hud-bubble hud-time ${timeDanger ? 'danger' : ''}`}>
        <div className="hud-label">{h.timeIsElapsed ? 'TIME' : 'TIME LEFT'}</div>
        <div className="hud-value">{fmtTime(h.timeLeft)}</div>
      </div>

      {/* Score + position + comics */}
      <div className="hud-bubble hud-tr">
        <div className="hud-label">SCORE</div>
        <div className="hud-value">{h.score.toLocaleString()}</div>
        {h.totalRacers > 1 && (
          <div className="hud-label" style={{ marginTop: 4 }}>
            POS {h.position}/{h.totalRacers}
          </div>
        )}
        {h.totalCheckpoints > 0 && (
          <div className="hud-label">GATE {h.checkpoint}/{h.totalCheckpoints}</div>
        )}
      </div>

      {/* Comics collected */}
      <div className="hud-bubble hud-bl">
        <div className="hud-label">COMICS</div>
        <div className="hud-value">📚 {h.comics}</div>
      </div>

      {/* Holy Grail meter */}
      <div
        className={`hud-bubble grail-wrap ${h.grail >= 1 && !h.grailActive ? 'grail-ready' : ''} ${
          h.grailActive ? 'grail-active' : ''
        }`}
      >
        <div className="hud-label">
          {h.grailActive ? 'HOLY GRAIL MODE!' : h.grail >= 1 ? 'PRESS SPACE!' : 'POWER OF THE COLLECTION'}
        </div>
        <div className="grail-track">
          <div className="grail-fill" style={{ width: `${Math.round(h.grail * 100)}%` }} />
        </div>
      </div>
    </div>
  );
}
