import type { GameMode } from '../game/types';

export interface ModeMeta {
  id: GameMode;
  name: string;
  blurb: string;
}

export const MODES: ModeMeta[] = [
  {
    id: 'story',
    name: 'Story Mode',
    blurb: 'Race the full Boston tour — Fenway to Logan — grabbing comics and beating rival ships to the finish.',
  },
  {
    id: 'timetrial',
    name: 'Time Trial',
    blurb: 'Same route, no rivals, just the clock. Carve the cleanest line for your fastest completion.',
  },
  {
    id: 'comichunt',
    name: 'Comic Hunt',
    blurb: '90 seconds. Hoover up as many rare books as you can. Build streaks for big multipliers.',
  },
  {
    id: 'endless',
    name: 'Endless Flight',
    blurb: 'Free-roam the whole cartoon city. No clock, no finish line — just you and the skyline.',
  },
];

export function modeName(id: GameMode): string {
  return MODES.find((m) => m.id === id)?.name ?? id;
}
