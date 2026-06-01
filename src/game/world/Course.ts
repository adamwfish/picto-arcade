/**
 * The race course — a floating comic "sky-road" circuit that weaves through
 * the Boston skyline (think Rainbow Road meets an early-2000s arcade racer,
 * with Mario-Kart curbs and boost pads). It's authored as a closed loop of
 * waypoints through every landmark, smoothed into a CatmullRom spline, then
 * skinned into:
 *
 *   - a cream track ribbon with a black underside (the comic ink edge)
 *   - red/white checkered curbs down both sides
 *   - dashed gold center line
 *   - gold chevron BOOST PADS at intervals
 *   - checkpoint ARCH gates at each landmark
 *   - a checkered START/FINISH gantry draped in flag bunting
 *
 * Gameplay reads the exposed `checkpoints`, `boostPads`, and start transform.
 */

import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { PALETTE } from '../constants';
import { project } from '../data/boston';
import { toon, flat, inkMesh } from './materials';

const UP = new THREE.Vector3(0, 1, 0);

/** Bake a geometry at a transform (so many can merge into one draw call). */
function baked(geo: THREE.BufferGeometry, pos: THREE.Vector3, rotY = 0, rotX = 0): THREE.BufferGeometry {
  const o = new THREE.Object3D();
  o.position.copy(pos);
  o.rotation.set(rotX, rotY, 0);
  o.updateMatrix();
  geo.applyMatrix4(o.matrix);
  return geo;
}

function mergedMesh(geos: THREE.BufferGeometry[], material: THREE.Material): THREE.Mesh | null {
  if (!geos.length) return null;
  const merged = mergeGeometries(geos, false);
  geos.forEach((g) => g.dispose());
  return merged ? new THREE.Mesh(merged, material) : null;
}

/** Loop waypoints: [lat, lng, altitude]. Touring Fenway → Logan → back. */
const WAYPOINTS: Array<[number, number, number]> = [
  [42.3467, -71.0972, 24], // 0  Fenway (START / FINISH)
  [42.347, -71.09, 30],
  [42.3473, -71.0821, 50], // 2  Prudential (soar past the tower)
  [42.35, -71.074, 36],
  [42.3551, -71.0656, 28], // 4  Boston Common
  [42.3588, -71.0638, 32], // 5  State House
  [42.3662, -71.0621, 32], // 6  TD Garden
  [42.369, -71.061, 44], // 7  Zakim Bridge
  [42.366, -71.03, 38],
  [42.3656, -71.0096, 28], // 9  Logan Airport
  [42.35, -71.02, 42],
  [42.3505, -71.0435, 36], // 11 Seaport
  [42.348, -71.056, 30],
  [42.343, -71.07, 30], // 13 South End
  [42.344, -71.085, 28],
];

/** Which waypoint indices get a checkpoint arch (in lap order). */
const GATE_INDICES = [0, 2, 4, 5, 6, 7, 9, 11, 13];

export interface Checkpoint {
  position: THREE.Vector3;
  t: number; // 0..1 along the curve
  isStart: boolean;
}

export interface BoostPad {
  position: THREE.Vector3;
  radius: number;
}

export class Course {
  readonly root = new THREE.Group();
  readonly curve: THREE.CatmullRomCurve3;
  readonly checkpoints: Checkpoint[] = [];
  readonly boostPads: BoostPad[] = [];
  readonly startPosition = new THREE.Vector3();
  readonly startDirection = new THREE.Vector3(0, 0, -1);
  readonly trackWidth = 17;

  private samples: THREE.Vector3[] = [];

  constructor() {
    this.root.name = 'course';
    const pts = WAYPOINTS.map(([lat, lng, h]) => {
      const p = project(lat, lng);
      return new THREE.Vector3(p.x, h, p.z);
    });
    this.curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.5);

    this.samples = this.curve.getSpacedPoints(600);
    this.buildTrack();
    this.buildCheckpoints(pts);
    this.buildBoostPads();
    this.buildStartGantry();

    // Start transform: at gate 0, facing along the track.
    this.startPosition.copy(this.curve.getPointAt(0.001)).add(new THREE.Vector3(0, 2.5, 0));
    this.startDirection.copy(this.curve.getTangentAt(0.001)).normalize();
  }

  // ---- geometry helpers ----
  private frame(t: number): { pos: THREE.Vector3; tan: THREE.Vector3; right: THREE.Vector3 } {
    const pos = this.curve.getPointAt(t);
    const tan = this.curve.getTangentAt(t).normalize();
    let right = new THREE.Vector3().crossVectors(UP, tan);
    if (right.lengthSq() < 1e-4) right.set(1, 0, 0);
    right.normalize();
    return { pos, tan, right };
  }

  /** Build a ribbon strip along the curve at a vertical offset and width. */
  private ribbon(width: number, yOffset: number, segments = 600): THREE.BufferGeometry {
    const half = width / 2;
    const positions: number[] = [];
    const uvs: number[] = [];
    let prevL: THREE.Vector3 | null = null;
    let prevR: THREE.Vector3 | null = null;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const { pos, right } = this.frame(t);
      const l = pos.clone().addScaledVector(right, half);
      const r = pos.clone().addScaledVector(right, -half);
      l.y += yOffset;
      r.y += yOffset;
      if (prevL && prevR) {
        positions.push(prevL.x, prevL.y, prevL.z, prevR.x, prevR.y, prevR.z, r.x, r.y, r.z);
        positions.push(prevL.x, prevL.y, prevL.z, r.x, r.y, r.z, l.x, l.y, l.z);
        const v0 = (i - 1) * 2;
        const v1 = i * 2;
        uvs.push(0, v0, 1, v0, 1, v1, 0, v0, 1, v1, 0, v1);
      }
      prevL = l;
      prevR = r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  private buildTrack(): void {
    // Black ink underside (slightly wider) → reads as the comic outline.
    const ink = new THREE.Mesh(this.ribbon(this.trackWidth + 2.4, -0.45, 400), flat(PALETTE.ink));
    ink.renderOrder = 0;
    this.root.add(ink);

    // Cream track surface.
    const surface = new THREE.Mesh(this.ribbon(this.trackWidth, 0, 600), toon(PALETTE.cream, { steps: 2 }));
    surface.receiveShadow = true;
    surface.renderOrder = 1;
    this.root.add(surface);

    // Dashed gold center line (thin ribbon, alternating segments hidden by gaps).
    this.buildCenterDashes();

    // Red/white checkered curbs along both edges.
    this.buildCurbs();
  }

  private buildCenterDashes(): void {
    const n = 120;
    const dashes: THREE.BufferGeometry[] = [];
    for (let i = 1; i < n; i += 2) {
      const t = i / n;
      const { pos, tan } = this.frame(t);
      dashes.push(baked(new THREE.PlaneGeometry(1.1, 5), pos.clone().add(new THREE.Vector3(0, 0.06, 0)), Math.atan2(tan.x, tan.z), -Math.PI / 2));
    }
    const mesh = mergedMesh(dashes, flat(PALETTE.gold));
    if (mesh) this.root.add(mesh);
  }

  private buildCurbs(): void {
    const half = this.trackWidth / 2;
    const n = 180;
    const reds: THREE.BufferGeometry[] = [];
    const whites: THREE.BufferGeometry[] = [];
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const { pos, tan, right } = this.frame(t);
      const bucket = i % 2 === 0 ? reds : whites;
      for (const side of [1, -1]) {
        const p = pos.clone().addScaledVector(right, side * (half + 0.4)).add(new THREE.Vector3(0, 0.1, 0));
        bucket.push(baked(new THREE.BoxGeometry(1.6, 0.5, 6.2), p, Math.atan2(tan.x, tan.z)));
      }
    }
    const redMesh = mergedMesh(reds, flat(PALETTE.red));
    const whiteMesh = mergedMesh(whites, flat(PALETTE.white));
    if (redMesh) this.root.add(redMesh);
    if (whiteMesh) this.root.add(whiteMesh);
    // Crisp black outline rail standing on the very edge of each side.
    for (const side of [1, -1]) this.root.add(this.edgeRail(side));
  }

  private edgeRail(side: number): THREE.Mesh {
    const half = this.trackWidth / 2 + 1.2;
    const positions: number[] = [];
    let prev: { a: THREE.Vector3; b: THREE.Vector3 } | null = null;
    const segs = 300;
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      const { pos, right } = this.frame(t);
      const a = pos.clone().addScaledVector(right, side * half).add(new THREE.Vector3(0, 0.05, 0));
      const b = a.clone().add(new THREE.Vector3(0, 0.9, 0));
      if (prev) {
        positions.push(prev.a.x, prev.a.y, prev.a.z, prev.b.x, prev.b.y, prev.b.z, b.x, b.y, b.z);
        positions.push(prev.a.x, prev.a.y, prev.a.z, b.x, b.y, b.z, a.x, a.y, a.z);
      }
      prev = { a, b };
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x11121a, side: THREE.DoubleSide }));
  }

  private buildCheckpoints(pts: THREE.Vector3[]): void {
    // Map each gate waypoint to its nearest t on the curve.
    for (let g = 0; g < GATE_INDICES.length; g++) {
      const idx = GATE_INDICES[g];
      const wp = pts[idx];
      const t = this.nearestT(wp);
      const pos = this.curve.getPointAt(t);
      const isStart = idx === 0;
      this.checkpoints.push({ position: pos.clone(), t, isStart });
      if (!isStart) this.buildArch(t, g);
    }
  }

  private buildArch(t: number, index: number): void {
    const { pos, tan, right } = this.frame(t);
    const half = this.trackWidth / 2 + 1;
    const arch = new THREE.Group();
    const color = index % 2 ? PALETTE.blue : PALETTE.red;
    // Two posts.
    for (const side of [1, -1]) {
      const post = inkMesh(new THREE.BoxGeometry(1.4, 14, 1.4), toon(color), 0.18);
      post.position.copy(pos).addScaledVector(right, side * half);
      post.position.y += 7;
      arch.add(post);
    }
    // Top banner beam.
    const beam = inkMesh(new THREE.BoxGeometry(this.trackWidth + 4, 3, 1.6), toon(PALETTE.navy), 0.18);
    beam.position.copy(pos).add(new THREE.Vector3(0, 15.5, 0));
    beam.rotation.y = Math.atan2(tan.x, tan.z);
    arch.add(beam);
    // Gold "checkpoint" chevrons on the beam.
    const star = new THREE.Mesh(new THREE.CircleGeometry(1.3, 5), flat(PALETTE.gold));
    star.position.copy(pos).add(new THREE.Vector3(0, 15.5, 0)).addScaledVector(tan, -0.9);
    star.lookAt(star.position.clone().addScaledVector(tan, -1));
    arch.add(star);
    this.root.add(arch);
  }

  private buildBoostPads(): void {
    const n = 14;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const { pos, tan } = this.frame(t);
      const padPos = pos.clone().add(new THREE.Vector3(0, 0.12, 0));
      this.boostPads.push({ position: padPos.clone(), radius: 7 });

      const group = new THREE.Group();
      group.position.copy(padPos);
      group.rotation.y = Math.atan2(tan.x, tan.z);
      // Two gold chevrons pointing forward.
      for (let c = 0; c < 2; c++) {
        const chevron = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.4), flat(PALETTE.gold));
        chevron.rotation.x = -Math.PI / 2;
        chevron.position.z = -c * 3.6;
        group.add(chevron);
        const tip = new THREE.Mesh(new THREE.PlaneGeometry(7, 1), flat(PALETTE.red));
        tip.rotation.x = -Math.PI / 2;
        tip.position.set(0, 0.02, -c * 3.6 - 2);
        group.add(tip);
      }
      this.root.add(group);
    }
  }

  private buildStartGantry(): void {
    const t = 0.0;
    const { pos, tan, right } = this.frame(t);
    const half = this.trackWidth / 2 + 1;
    const yaw = Math.atan2(tan.x, tan.z);

    // Checkered start line across the track.
    const cells = 14;
    for (let i = 0; i < cells; i++) {
      for (let j = 0; j < 3; j++) {
        const col = (i + j) % 2 === 0 ? PALETTE.ink : PALETTE.white;
        const cell = new THREE.Mesh(new THREE.PlaneGeometry(this.trackWidth / cells, 2), flat(col));
        cell.rotation.x = -Math.PI / 2;
        cell.rotation.z = yaw;
        const off = (i - cells / 2 + 0.5) * (this.trackWidth / cells);
        cell.position.copy(pos)
          .addScaledVector(right, off)
          .addScaledVector(tan, (j - 1) * 2)
          .add(new THREE.Vector3(0, 0.07, 0));
        this.root.add(cell);
      }
    }

    // Gantry posts + banner.
    const gantry = new THREE.Group();
    for (const side of [1, -1]) {
      const post = inkMesh(new THREE.BoxGeometry(2, 20, 2), toon(PALETTE.red), 0.2);
      post.position.copy(pos).addScaledVector(right, side * (half + 1));
      post.position.y += 10;
      gantry.add(post);
    }
    const banner = inkMesh(new THREE.BoxGeometry(this.trackWidth + 7, 5, 1.8), toon(PALETTE.navy), 0.2);
    banner.position.copy(pos).add(new THREE.Vector3(0, 21, 0));
    banner.rotation.y = yaw;
    gantry.add(banner);

    // "START / FINISH" gold bar on the banner.
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(this.trackWidth + 5, 2.4), flat(PALETTE.gold));
    bar.position.copy(pos).add(new THREE.Vector3(0, 21, 0)).addScaledVector(tan, -1);
    bar.rotation.y = yaw;
    gantry.add(bar);

    // Flag bunting swag between the posts (alternating red/white/blue triangles).
    const buntColors = [PALETTE.red, PALETTE.white, PALETTE.blue];
    const flags = 16;
    for (let i = 0; i < flags; i++) {
      const ft = i / (flags - 1);
      const off = (ft - 0.5) * (this.trackWidth + 6);
      const sag = Math.sin(ft * Math.PI) * 2.2;
      const tri = new THREE.Mesh(new THREE.ConeGeometry(0.7, 1.8, 3), flat(buntColors[i % 3]));
      tri.position.copy(pos)
        .addScaledVector(right, off)
        .add(new THREE.Vector3(0, 18.3 - sag, 0))
        .addScaledVector(tan, -0.9);
      tri.rotation.x = Math.PI;
      tri.rotation.y = yaw;
      gantry.add(tri);
    }
    this.root.add(gantry);
  }

  // ---- queries ----
  private nearestT(p: THREE.Vector3): number {
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < this.samples.length; i++) {
      const d = this.samples[i].distanceToSquared(p);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best / (this.samples.length - 1);
  }

  /** Progress (0..1 around the loop) nearest to a world position. */
  progressAt(p: THREE.Vector3): number {
    return this.nearestT(p);
  }

  dispose(): void {
    this.root.traverse((o) => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
    });
  }
}
