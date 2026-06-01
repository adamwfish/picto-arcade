/** Local high-score persistence (top 10 per mode + overall). */

import { LS_KEYS } from '../game/constants';
import type { GameMode, ScoreEntry } from '../game/types';

export function loadScores(): ScoreEntry[] {
  try {
    const raw = localStorage.getItem(LS_KEYS.scores);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ScoreEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScore(entry: ScoreEntry): ScoreEntry[] {
  const all = loadScores();
  all.push(entry);
  // Keep a generous cap; UI filters per-mode.
  all.sort((a, b) => b.score - a.score);
  const trimmed = all.slice(0, 60);
  localStorage.setItem(LS_KEYS.scores, JSON.stringify(trimmed));
  return trimmed;
}

export function topForMode(scores: ScoreEntry[], mode: GameMode, n = 10): ScoreEntry[] {
  return scores
    .filter((s) => s.mode === mode)
    .sort((a, b) => (mode === 'timetrial' ? a.time - b.time : b.score - a.score))
    .slice(0, n);
}

export function bestScore(scores: ScoreEntry[], mode: GameMode): number {
  const top = topForMode(scores, mode, 1);
  return top.length ? top[0].score : 0;
}

export function isHighScore(scores: ScoreEntry[], mode: GameMode, score: number): boolean {
  const top = topForMode(scores, mode, 10);
  return top.length < 10 || score > top[top.length - 1].score;
}
