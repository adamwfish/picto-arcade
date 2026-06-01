import { useMemo, useState } from 'react';
import type { RunResult, ScoreEntry } from '../game/types';
import { isHighScore, topForMode } from '../state/leaderboard';
import { modeName } from './modes';

interface Props {
  result: RunResult;
  scores: ScoreEntry[];
  savedName: string;
  onSave: (name: string) => void;
  onReplay: () => void;
  onModeSelect: () => void;
  onTitle: () => void;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const r = (sec % 60).toFixed(1);
  return `${m}:${r.padStart(4, '0')}`;
}

export function Results({ result, scores, savedName, onSave, onReplay, onModeSelect, onTitle }: Props) {
  const high = useMemo(
    () => result.mode !== 'endless' && isHighScore(scores, result.mode, result.score),
    [scores, result],
  );
  const [name, setName] = useState(savedName || 'PICTO');
  const [saved, setSaved] = useState(false);
  const top = useMemo(() => topForMode(scores, result.mode, 8), [scores, result.mode]);

  const headline =
    result.mode === 'comichunt'
      ? "TIME'S UP!"
      : result.mode === 'endless'
        ? 'FLIGHT LOGGED'
        : result.won
          ? 'FINISH!'
          : 'OUT OF TIME';

  const save = () => {
    onSave(name.trim().slice(0, 8).toUpperCase() || 'PICTO');
    setSaved(true);
  };

  return (
    <div className="overlay dim">
      <div className="comic-panel" style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', maxWidth: 520 }}>
        <h2 className="comic-title" style={{ fontSize: 'clamp(34px,7vw,66px)', color: result.won ? 'var(--red)' : 'var(--navy)' }}>
          {headline}
        </h2>
        <div className="comic-sub" style={{ fontSize: 20 }}>{modeName(result.mode)}</div>

        <div className="results-stats">
          <div>SCORE: <b>{result.score.toLocaleString()}</b></div>
          <div>COMICS COLLECTED: <b>{result.comics}</b></div>
          <div>TIME: <b>{fmtTime(result.time)}</b></div>
        </div>

        {high && !saved && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
            <div className="comic-sub" style={{ fontSize: 18, color: 'var(--red)' }}>NEW HIGH SCORE!</div>
            <input
              className="name-input"
              maxLength={8}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-label="Enter your name"
            />
            <button className="comic-btn gold" onClick={save}>SAVE</button>
          </div>
        )}

        {top.length > 0 && (
          <div className="lb-table">
            {top.map((s, i) => (
              <div key={i} className={`lb-row ${saved && s.name === name.toUpperCase() && s.score === result.score ? 'me' : ''}`}>
                <span>{i + 1}. {s.name}</span>
                <span>{result.mode === 'timetrial' ? fmtTime(s.time) : s.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="comic-btn" onClick={onReplay}>RACE AGAIN</button>
          <button className="comic-btn alt" onClick={onModeSelect}>MODES</button>
          <button className="comic-btn ghost" onClick={onTitle}>TITLE</button>
        </div>
      </div>
    </div>
  );
}
