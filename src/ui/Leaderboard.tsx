import { useState } from 'react';
import type { GameMode, ScoreEntry } from '../game/types';
import { MODES } from './modes';
import { topForMode } from '../state/leaderboard';

interface Props {
  scores: ScoreEntry[];
  onBack: () => void;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const r = (sec % 60).toFixed(1);
  return `${m}:${r.padStart(4, '0')}`;
}

export function Leaderboard({ scores, onBack }: Props) {
  const [mode, setMode] = useState<GameMode>('story');
  const rows = topForMode(scores, mode, 10);

  return (
    <div className="overlay halftone">
      <h2 className="comic-title" style={{ fontSize: 'clamp(30px,6vw,58px)' }}>HIGH SCORES</h2>
      <div className="tabs">
        {MODES.map((m) => (
          <button key={m.id} className={`tab ${mode === m.id ? 'active' : ''}`} onClick={() => setMode(m.id)}>
            {m.name}
          </button>
        ))}
      </div>
      <div className="comic-panel" style={{ minWidth: 'min(86vw, 440px)' }}>
        {rows.length === 0 ? (
          <div className="lb-table" style={{ textAlign: 'center', padding: '12px 0' }}>
            NO SCORES YET — GO SET ONE!
          </div>
        ) : (
          <div className="lb-table">
            {rows.map((s, i) => (
              <div key={i} className="lb-row">
                <span>{i + 1}. {s.name}</span>
                <span>{mode === 'timetrial' ? fmtTime(s.time) : s.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="comic-btn ghost" onClick={onBack}>BACK</button>
    </div>
  );
}
