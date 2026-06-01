/**
 * Floating vintage comic-book collectibles. Generic, copyright-safe cover
 * art evoking Silver/Golden-age books and team titles — bold cover blocks,
 * a logo bar, and a price corner. They spin and bob; grabbing one bumps the
 * score and fills the "Power of the Collection" meter.
 */

import * as THREE from 'three';
import { PALETTE } from '../constants';
import { toon, flat, outlined } from '../world/materials';
import type { ComicRarity } from '../types';

const RARITY_STYLE: Record<ComicRarity, { cover: string; bar: string; points: number; label: string }> = {
  silver: { cover: PALETTE.blue, bar: PALETTE.gold, points: 100, label: 'Silver Age' },
  golden: { cover: PALETTE.gold, bar: PALETTE.red, points: 250, label: 'Golden Age' },
  xmen: { cover: PALETTE.red, bar: PALETTE.navy, points: 150, label: 'Mutant Squad' },
  ff: { cover: PALETTE.navy, bar: PALETTE.blueLight, points: 150, label: 'Fantastic Quartet' },
};

const COVER_GEO = new THREE.BoxGeometry(2.2, 3.0, 0.18);

export class Comic {
  readonly root = new THREE.Group();
  readonly rarity: ComicRarity;
  readonly points: number;
  readonly radius = 2.6;
  collected = false;
  private spin: number;
  private bobPhase: number;

  constructor(rarity: ComicRarity, position: THREE.Vector3) {
    this.rarity = rarity;
    const style = RARITY_STYLE[rarity];
    this.points = style.points;
    this.spin = 0.8 + Math.random() * 0.8;
    this.bobPhase = Math.random() * Math.PI * 2;

    const cover = new THREE.Mesh(COVER_GEO, toon(style.cover, { steps: 3 }));
    this.root.add(outlined(cover, 0.14));

    // Top logo/title bar.
    const bar = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.55, 0.22), flat(style.bar));
    bar.position.set(0, 1.05, 0.02);
    this.root.add(bar);

    // A circular "cover figure" splash.
    const splash = new THREE.Mesh(new THREE.CircleGeometry(0.7, 16), flat(PALETTE.cream));
    splash.position.set(0, -0.1, 0.1);
    this.root.add(splash);
    const figure = new THREE.Mesh(new THREE.CircleGeometry(0.4, 12), flat(PALETTE.ink));
    figure.position.set(0, -0.1, 0.11);
    this.root.add(figure);

    // Price/grade corner star.
    const corner = new THREE.Mesh(new THREE.CircleGeometry(0.34, 5), flat(PALETTE.white));
    corner.position.set(-0.78, -1.2, 0.11);
    this.root.add(corner);

    // A soft sparkle halo behind it.
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.9, 2.3, 16),
      flat(PALETTE.gold, { transparent: true, opacity: 0.35 }),
    );
    halo.position.z = -0.2;
    this.root.add(halo);

    this.root.position.copy(position);
  }

  update(dt: number, t: number): void {
    if (this.collected) return;
    this.root.rotation.y += this.spin * dt;
    this.root.position.y += Math.sin(t * 1.6 + this.bobPhase) * dt * 0.6;
  }

  /** Pop animation handle — caller hides it; we just flag + shrink. */
  collect(): number {
    this.collected = true;
    this.root.visible = false;
    return this.points;
  }
}

export const COMIC_RARITIES: ComicRarity[] = ['silver', 'golden', 'xmen', 'ff'];

export function randomRarity(): ComicRarity {
  const r = Math.random();
  if (r < 0.5) return 'silver';
  if (r < 0.72) return 'xmen';
  if (r < 0.92) return 'ff';
  return 'golden';
}
