/**
 * Cartoon trees: simplified green blobs on a stubby trunk, each wrapped in the
 * black inverted-hull outline. Deliberately low-poly so we can scatter a few
 * dozen across Boston Common and the Esplanade and still hold 60 FPS.
 */

import * as THREE from 'three';
import { PALETTE } from '../constants';
import { toon, outlined } from './materials';
import { mulberry32 } from './geo';

const blobGeo = new THREE.IcosahedronGeometry(1, 0); // 20-face blob
const trunkGeo = new THREE.CylinderGeometry(0.28, 0.36, 1.4, 6);

export function makeTree(scale = 1, tint: string = PALETTE.grass): THREE.Group {
  const tree = new THREE.Group();

  const trunk = new THREE.Mesh(trunkGeo, toon(PALETTE.brick, { steps: 2 }));
  trunk.position.y = 0.7 * scale;
  trunk.scale.setScalar(scale);
  tree.add(outlined(trunk, 0.18));

  // 1–2 overlapping canopy blobs.
  const canopy = new THREE.Mesh(blobGeo, toon(tint, { steps: 2 }));
  canopy.position.y = 1.9 * scale;
  canopy.scale.setScalar(1.5 * scale);
  tree.add(outlined(canopy, 0.22));

  const top = new THREE.Mesh(blobGeo, toon(PALETTE.grassDeep, { steps: 2 }));
  top.position.set(0.4 * scale, 2.6 * scale, 0.2 * scale);
  top.scale.setScalar(0.9 * scale);
  tree.add(outlined(top, 0.18));

  return tree;
}

/**
 * Scatter `count` trees in a radius around a center point (avoiding the dead
 * center). Returns a group ready to drop into the scene.
 */
export function scatterTrees(
  cx: number,
  cz: number,
  radius: number,
  count: number,
  seed = 7,
): THREE.Group {
  const group = new THREE.Group();
  const rng = mulberry32(seed);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2;
    const r = (0.25 + 0.75 * rng()) * radius;
    const t = makeTree(0.8 + rng() * 0.7, rng() > 0.5 ? PALETTE.grass : PALETTE.grassDeep);
    t.position.set(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r);
    t.rotation.y = rng() * Math.PI;
    group.add(t);
  }
  return group;
}
