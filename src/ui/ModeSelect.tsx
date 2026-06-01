import type { GameMode, ScoreEntry } from '../game/types';
import { MODES } from './modes';
import { bestScore } from '../state/leaderboard';

interface Props {
  scores: ScoreEntry[];
  onPick: (mode: GameMode) => void;
  onBack: () => void;
}

/** Comic-card grid for choosing a game mode. */
export function ModeSelect({ scores, onPick, onBack }: Props) {
  return (
    <div className="overlay halftone">
      <h2 className="comic-title" style={{ fontSize: 'clamp(30px,6vw,58px)' }}>
        CHOOSE YOUR RUN
      </h2>
      <div className="mode-grid">
        {MODES.map((m) => {
          const best = bestScore(scores, m.id);
          return (
            <button key={m.id} className="mode-card" onClick={() => onPick(m.id)}>
              <h3>{m.name}</h3>
              <p>{m.blurb}</p>
              {best > 0 && <div className="best">BEST: {best.toLocaleString()}</div>}
            </button>
          );
        })}
      </div>
      <button className="comic-btn ghost" onClick={onBack}>
        BACK
      </button>
    </div>
  );
}
