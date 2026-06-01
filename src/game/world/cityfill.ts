/**
 * Dense "map" city fill. Lays a real-ish street grid over greater downtown and
 * packs every block with cartoon buildings so Boston reads as a full city
 * rather than a few landmarks.
 *
 * Performance: hundreds of buildings would be hundreds of draw calls, so we
 * MERGE them — all bodies of a given palette color become one mesh, and every
 * building's slightly-expanded black shell is merged into a single BackSide
 * "ink" mesh. The whole city then costs ~6 draw calls while keeping the thick
 * comic outline on every block.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PALETTE, hex } from '../constants';
import { toon } from './materials';
import { mulberry32, projectAll } from './geo';
import { CHARLES_RIVER, HARBOR } from '../data/boston';

// Building body colors (low-rise vs downtown towers share this palette).
const BODY_COLORS = [PALETTE.brick, PALETTE.cream, PALETTE.steel, PALETTE.white, PALETTE.navy, PALETTE.red];

function pointInPolygon(x: number, z: number, poly: Array<{ x: number; z: number }>): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z, xj = poly[j].x, zj = poly[j].z;
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

function distToPolyline(x: number, z: number, line: Array<{ x: number; z: number }>): number {
  let min = Infinity;
  for (let i = 0; i < line.length - 1; i++) {
    const a = line[i], b = line[i + 1];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len2 = dx * dx + dz * dz || 1;
    let t = ((x - a.x) * dx + (z - a.z) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + dx * t, pz = a.z + dz * t;
    min = Math.min(min, Math.hypot(x - px, z - pz));
  }
  return min;
}

export function buildCityFill(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'cityfill';
  const rng = mulberry32(20250601);

  const harbor = projectAll(HARBOR);
  const river = projectAll(CHARLES_RIVER);

  // Grid region (game units) covering greater downtown.
  const REGION = 240;
  const BLOCK = 20; // block pitch (building + street)
  const bodyBuckets = new Map<string, THREE.BufferGeometry[]>();
  const inkGeos: THREE.BufferGeometry[] = [];
  const accentGeos: { gold: THREE.BufferGeometry[]; red: THREE.BufferGeometry[] } = { gold: [], red: [] };

  const pushBody = (color: string, geo: THREE.BufferGeometry) => {
    if (!bodyBuckets.has(color)) bodyBuckets.set(color, []);
    bodyBuckets.get(color)!.push(geo);
  };

  const tmp = new THREE.Matrix4();

  for (let gx = -REGION; gx <= REGION; gx += BLOCK) {
    for (let gz = -REGION; gz <= REGION; gz += BLOCK) {
      // Jittered cell center.
      const cx = gx + (rng() - 0.5) * 4;
      const cz = gz + (rng() - 0.5) * 4;

      // Skip water and the very center (Boston Common breathing room handled elsewhere).
      if (pointInPolygon(cx, cz, harbor)) continue;
      if (distToPolyline(cx, cz, river) < 12) continue;
      const distCore = Math.hypot(cx, cz);
      if (distCore < 16) continue; // leave the Common clear
      // Thin out toward the edges so the city fades into countryside.
      if (distCore > 170 && rng() < 0.45) continue;
      if (rng() < 0.12) continue; // occasional empty lot / plaza

      // 1–2 buildings per block.
      const perBlock = rng() < 0.4 ? 2 : 1;
      for (let b = 0; b < perBlock; b++) {
        const ox = cx + (perBlock > 1 ? (b - 0.5) * 7 : 0) + (rng() - 0.5) * 3;
        const oz = cz + (rng() - 0.5) * 3;
        const w = 5 + rng() * 6;
        const d = 5 + rng() * 6;
        // Taller toward the financial core (north-east of the Common).
        const coreBias = Math.max(0, 1 - Math.hypot(ox - 30, oz + 20) / 120);
        const h = 6 + rng() * (10 + coreBias * coreBias * 80);

        const color = BODY_COLORS[Math.floor(rng() * BODY_COLORS.length)];
        const body = new THREE.BoxGeometry(w, h, d);
        tmp.makeTranslation(ox, h / 2, oz);
        body.applyMatrix4(tmp);
        pushBody(color, body);

        // Expanded black shell for the merged outline.
        const shell = new THREE.BoxGeometry(w + 0.7, h + 0.7, d + 0.7);
        shell.applyMatrix4(tmp);
        inkGeos.push(shell);

        // Rooftop accent: water tower / sign / red cap.
        if (h > 28 && rng() < 0.5) {
          const cap = new THREE.BoxGeometry(w * 0.35, 2.5, d * 0.35);
          cap.applyMatrix4(new THREE.Matrix4().makeTranslation(ox, h + 1.2, oz));
          accentGeos.red.push(cap);
        } else if (rng() < 0.25) {
          const sign = new THREE.BoxGeometry(w * 0.8, 1.6, 0.4);
          sign.applyMatrix4(new THREE.Matrix4().makeTranslation(ox, h + 0.8, oz));
          accentGeos.gold.push(sign);
        }
      }
    }
  }

  // Merge & add: one ink shell mesh for all outlines.
  if (inkGeos.length) {
    const inkMerged = mergeGeometries(inkGeos, false);
    if (inkMerged) {
      const inkMesh = new THREE.Mesh(inkMerged, new THREE.MeshBasicMaterial({ color: hex(PALETTE.ink), side: THREE.BackSide }));
      inkMesh.renderOrder = 0;
      group.add(inkMesh);
    }
    inkGeos.forEach((g) => g.dispose());
  }

  // One mesh per body color.
  for (const [color, geos] of bodyBuckets) {
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, toon(color, { steps: 3 }));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    geos.forEach((g) => g.dispose());
  }

  // Accent meshes.
  if (accentGeos.red.length) {
    const m = mergeGeometries(accentGeos.red, false);
    if (m) group.add(new THREE.Mesh(m, toon(PALETTE.red, { steps: 2 })));
    accentGeos.red.forEach((g) => g.dispose());
  }
  if (accentGeos.gold.length) {
    const m = mergeGeometries(accentGeos.gold, false);
    if (m) group.add(new THREE.Mesh(m, toon(PALETTE.gold, { steps: 2 })));
    accentGeos.gold.forEach((g) => g.dispose());
  }

  return group;
}
