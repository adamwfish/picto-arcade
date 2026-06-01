/**
 * Boston geographic reference data.
 *
 * Real latitude/longitude for landmarks, the Charles River, and major roads,
 * projected to a local planar game grid. The course is NOT 1:1 accurate — we
 * use real *relative* positions and shapes, then simplify everything into
 * cartoon geometry elsewhere. No Google imagery is streamed; this is purely
 * coordinate reference (as the brief requires).
 */

import { ORIGIN, SCALE } from '../constants';

export interface Vec2 {
  x: number;
  z: number;
}

/** Equirectangular projection around ORIGIN → game units. North is -Z. */
export function project(lat: number, lng: number): Vec2 {
  const latRad = (ORIGIN.lat * Math.PI) / 180;
  const mx = (lng - ORIGIN.lng) * 111320 * Math.cos(latRad);
  const mz = (lat - ORIGIN.lat) * 110540;
  return { x: mx * SCALE, z: -mz * SCALE };
}

export type LandmarkType =
  | 'stadium' // Fenway
  | 'tower' // Prudential
  | 'park' // Boston Common
  | 'arena' // TD Garden
  | 'bridge' // Zakim
  | 'airport' // Logan
  | 'capitol'; // State House dome (bonus flavor)

export interface Landmark {
  id: string;
  name: string;
  type: LandmarkType;
  lat: number;
  lng: number;
  /** Footprint half-extents in game units, computed lazily where needed. */
  w?: number;
  d?: number;
  h?: number;
}

export const LANDMARKS: Landmark[] = [
  { id: 'fenway', name: 'Fenway Park', type: 'stadium', lat: 42.3467, lng: -71.0972, w: 26, d: 22, h: 10 },
  { id: 'pru', name: 'Prudential Tower', type: 'tower', lat: 42.3473, lng: -71.0821, w: 9, d: 9, h: 56 },
  { id: 'common', name: 'Boston Common', type: 'park', lat: 42.3551, lng: -71.0656, w: 34, d: 28, h: 0 },
  { id: 'tdgarden', name: 'TD Garden', type: 'arena', lat: 42.3662, lng: -71.0621, w: 18, d: 16, h: 14 },
  { id: 'zakim', name: 'Zakim Bridge', type: 'bridge', lat: 42.369, lng: -71.061, w: 6, d: 30, h: 34 },
  { id: 'logan', name: 'Logan Airport', type: 'airport', lat: 42.3656, lng: -71.0096, w: 40, d: 30, h: 6 },
  { id: 'statehouse', name: 'MA State House', type: 'capitol', lat: 42.3588, lng: -71.0638, w: 10, d: 8, h: 16 },
];

export function landmark(id: string): Landmark {
  const l = LANDMARKS.find((x) => x.id === id);
  if (!l) throw new Error(`Unknown landmark ${id}`);
  return l;
}

/**
 * Charles River centerline (downstream, roughly W→E then curving N to the
 * harbor). Coordinates trace the real river between Boston and Cambridge.
 */
export const CHARLES_RIVER: Array<[number, number]> = [
  [42.3585, -71.1105], // BU bend
  [42.3565, -71.0995],
  [42.3548, -71.0905],
  [42.3552, -71.0815], // Esplanade
  [42.357, -71.0735],
  [42.3605, -71.0685], // Museum of Science
  [42.366, -71.0625], // locks near TD Garden / Zakim
  [42.3705, -71.055], // into the inner harbor
  [42.366, -71.035],
  [42.358, -71.02], // harbor toward Logan
];

/** Inner-harbor / ocean fill east of downtown (simple polygon). */
export const HARBOR: Array<[number, number]> = [
  [42.378, -71.05],
  [42.378, -70.99],
  [42.33, -70.99],
  [42.335, -71.035],
  [42.352, -71.04],
  [42.366, -71.045],
];

/**
 * Major arteries as polylines. Loosely follows Storrow Drive, Mass Ave,
 * Boylston, the Greenway/93 corridor, and the airport approach — enough to
 * read as "Boston street layout" without being a survey map.
 */
export const ROADS: Array<{ name: string; pts: Array<[number, number]>; width: number }> = [
  {
    name: 'Storrow Dr',
    width: 5,
    pts: [
      [42.3548, -71.0905],
      [42.3552, -71.0815],
      [42.357, -71.0735],
      [42.3605, -71.0685],
      [42.3655, -71.063],
    ],
  },
  {
    name: 'Massachusetts Ave',
    width: 4.5,
    pts: [
      [42.3405, -71.0995],
      [42.3445, -71.0935],
      [42.3475, -71.0855],
      [42.3505, -71.0805],
      [42.358, -71.0945],
    ],
  },
  {
    name: 'Boylston St',
    width: 4,
    pts: [
      [42.3467, -71.0972],
      [42.3478, -71.0855],
      [42.3515, -71.0735],
      [42.3535, -71.0662],
    ],
  },
  {
    name: 'I-93 / Greenway',
    width: 6,
    pts: [
      [42.369, -71.061],
      [42.3635, -71.0575],
      [42.3565, -71.0555],
      [42.349, -71.0535],
      [42.342, -71.0525],
    ],
  },
  {
    name: 'Summer St → Airport',
    width: 4.5,
    pts: [
      [42.3515, -71.0555],
      [42.3505, -71.041],
      [42.354, -71.028],
      [42.3605, -71.0155],
    ],
  },
  {
    name: 'Cambridge St',
    width: 4,
    pts: [
      [42.3608, -71.0705],
      [42.3608, -71.0635],
      [42.359, -71.0585],
      [42.3635, -71.0575],
    ],
  },
];

/** Generic neighborhood block clusters (cartoon brownstones / downtown). */
export const DISTRICTS: Array<{ name: string; lat: number; lng: number; radius: number; tall: boolean }> = [
  { name: 'Back Bay', lat: 42.3486, lng: -71.078, radius: 30, tall: false },
  { name: 'Financial District', lat: 42.3565, lng: -71.0555, radius: 24, tall: true },
  { name: 'Downtown Crossing', lat: 42.3555, lng: -71.0605, radius: 18, tall: true },
  { name: 'North End', lat: 42.3647, lng: -71.0542, radius: 16, tall: false },
  { name: 'Beacon Hill', lat: 42.3588, lng: -71.0685, radius: 16, tall: false },
  { name: 'South End', lat: 42.3415, lng: -71.0735, radius: 26, tall: false },
  { name: 'Seaport', lat: 42.3505, lng: -71.0435, radius: 22, tall: true },
];

/**
 * Story-mode race route: a sequence of landmark checkpoints that sends the
 * player on a tour past every required Boston site, ending at Logan.
 */
export const RACE_ROUTE: string[] = [
  'fenway',
  'pru',
  'common',
  'statehouse',
  'tdgarden',
  'zakim',
  'logan',
];
