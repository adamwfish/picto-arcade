/**
 * Robo Picto Space Runner: Boston — global constants & tuning.
 *
 * The palette is lifted straight from the mascot logo: thick black outlines,
 * a creamy off-white, comic red, navy/cornflower blue, and a gold accent.
 * Everything in the world is colored from this short list to keep the
 * screen-print / comic-book look consistent.
 */

export const PALETTE = {
  ink: '#11121a', // near-black outline ink
  white: '#ffffff', // suit white
  cream: '#f4ecd8', // aged-comic paper / sky
  bone: '#e9e2cf', // skeleton bone
  red: '#e23446', // comic red
  redDeep: '#a01e2a',
  navy: '#1d2660', // deep flag blue
  blue: '#4f6dd6', // cornflower accent
  blueLight: '#9fb3ef',
  lavender: '#b9b3e0',
  gold: '#ffd54a', // pulpy gold
  sky: '#bcd4e6', // pale comic sky
  water: '#3f73c4', // flat comic water
  waterDeep: '#2b56a0',
  grass: '#6fae5e', // common / park green
  grassDeep: '#4e8a42',
  road: '#d9d2c0', // pale road fill
  asphalt: '#c4bca8',
  brick: '#c8634a', // brownstone brick
  steel: '#9aa7c4', // steel / glass
} as const;

/** Number → 0xRRGGBB for Three.js color constructors. */
export function hex(c: string): number {
  return parseInt(c.replace('#', ''), 16);
}

/**
 * World scale. We project real Boston lat/lng to a local planar grid in
 * meters, then multiply by SCALE to get game units. 0.2 => 1 unit ≈ 5 m,
 * so the ~8 km Fenway→Logan span becomes a ~1600-unit playfield: big enough
 * to feel like a city flyover, small enough to stay 60 FPS on low-poly geo.
 */
export const SCALE = 0.2;

/** Geographic anchor — Boston Common. Everything is measured relative to it. */
export const ORIGIN = { lat: 42.3551, lng: -71.0656 };

/** Arcade flight tuning. Fun over realism. */
export const FLIGHT = {
  baseSpeed: 78, // cruising forward speed (units/sec)
  minSpeed: 30,
  maxSpeed: 132,
  boostSpeed: 188, // Holy Grail / boost top speed
  accel: 60,
  brakeDecel: 130,
  turnRate: 1.9, // yaw rad/sec
  pitchRate: 1.25,
  rollVisual: 0.7, // banking roll for looks
  bankReturn: 4,
  liftRate: 46, // vertical speed from pitch (units/sec)
  minAltitude: 6,
  maxAltitude: 180,
  drag: 1.4,
} as const;

/** Camera chase rig. */
export const CAMERA = {
  distance: 22,
  height: 9,
  lookAhead: 18,
  stiffness: 5.5, // position lerp
  rotStiffness: 6,
  fov: 62,
  boostFov: 74,
} as const;

/** Holy Grail / "Power of the Collection" meter. */
export const GRAIL = {
  perComic: 0.11, // meter gained per comic (0..1)
  duration: 6.5, // seconds of Holy Grail Mode
  drainTime: 6.5,
} as const;

export const LS_KEYS = {
  scores: 'rpsr_boston_scores_v1',
  mute: 'rpsr_boston_mute_v1',
  settings: 'rpsr_boston_settings_v1',
} as const;
