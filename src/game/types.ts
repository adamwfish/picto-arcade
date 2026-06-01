/** Shared game-wide types. */

export type GameMode = 'story' | 'timetrial' | 'comichunt' | 'endless';

export type GamePhase =
  | 'loading'
  | 'title'
  | 'modeselect'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'results';

export type ObstacleKind =
  | 'pigeon'
  | 'crane'
  | 'trolley'
  | 'comicbag'
  | 'balloon';

export type ComicRarity = 'silver' | 'golden' | 'xmen' | 'ff';

/** Live values the HUD reads every frame. */
export interface HudState {
  speed: number; // displayed MPH-ish
  position: number; // race position (1-based) — story/timetrial
  totalRacers: number;
  comics: number;
  grail: number; // 0..1 meter fill
  grailActive: boolean;
  timeLeft: number; // seconds (counts down) or elapsed for time trial
  timeIsElapsed: boolean;
  score: number;
  multiplier: number;
  lap: number;
  totalLaps: number;
  checkpoint: number;
  totalCheckpoints: number;
  altitude: number;
}

export interface RunResult {
  mode: GameMode;
  score: number;
  comics: number;
  time: number; // seconds elapsed
  finished: boolean;
  won: boolean;
}

export interface ScoreEntry {
  name: string;
  mode: GameMode;
  score: number;
  comics: number;
  time: number;
  date: number;
}

export interface GameSettings {
  muted: boolean;
}
