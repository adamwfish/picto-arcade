/**
 * Procedural placement of comics and obstacles. Comics string along the race
 * route (with scatter); obstacles cluster near the route and around the city
 * so there's always something to dodge.
 */

import * as THREE from 'three';
import type { ObstacleKind } from '../types';
import { mulberry32 } from '../world/geo';

/** Sample N points along a polyline of checkpoints (catmull-ish linear). */
export function sampleRoute(points: THREE.Vector3[], n: number): THREE.Vector3[] {
  if (points.length < 2) return points.slice();
  const out: THREE.Vector3[] = [];
  const segs = points.length - 1;
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * segs;
    const seg = Math.min(segs - 1, Math.floor(t));
    const f = t - seg;
    out.push(points[seg].clone().lerp(points[seg + 1], f));
  }
  return out;
}

export interface CometSpawn {
  position: THREE.Vector3;
}

export function comicSpawnPoints(route: THREE.Vector3[], count: number, seed = 99): THREE.Vector3[] {
  const rng = mulberry32(seed);
  const path = sampleRoute(route, Math.max(2, Math.floor(count / 2)));
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < count; i++) {
    const base = path[i % path.length];
    const p = base.clone();
    p.x += (rng() - 0.5) * 60;
    p.z += (rng() - 0.5) * 60;
    p.y = 14 + rng() * 40;
    pts.push(p);
  }
  return pts;
}

const KINDS: ObstacleKind[] = ['pigeon', 'crane', 'trolley', 'comicbag', 'balloon'];

export function obstacleSpawns(
  route: THREE.Vector3[],
  count: number,
  seed = 555,
): Array<{ kind: ObstacleKind; position: THREE.Vector3 }> {
  const rng = mulberry32(seed);
  const path = sampleRoute(route, Math.max(2, Math.floor(count / 1.5)));
  const out: Array<{ kind: ObstacleKind; position: THREE.Vector3 }> = [];
  for (let i = 0; i < count; i++) {
    const base = path[i % path.length];
    const kind = KINDS[Math.floor(rng() * KINDS.length)];
    const p = base.clone();
    p.x += (rng() - 0.5) * 90;
    p.z += (rng() - 0.5) * 90;
    // Cranes sit on the ground; flyers float at race altitude.
    p.y = kind === 'crane' ? 0 : 12 + rng() * 36;
    out.push({ kind, position: p });
  }
  return out;
}
