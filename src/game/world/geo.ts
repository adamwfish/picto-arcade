/** Small geometry helpers shared by world builders. */

import * as THREE from 'three';
import { project, type Vec2 } from '../data/boston';

/** Project a list of [lat,lng] pairs into game-space Vec2s. */
export function projectAll(pts: Array<[number, number]>): Vec2[] {
  return pts.map(([lat, lng]) => project(lat, lng));
}

/**
 * Build a flat ribbon (in the XZ plane, at y=0) following a centerline with a
 * constant width. Returns a BufferGeometry of triangles facing +Y. Great for
 * rivers and roads drawn as thick illustrated strokes.
 */
export function ribbonGeometry(center: Vec2[], width: number): THREE.BufferGeometry {
  const half = width / 2;
  const left: Vec2[] = [];
  const right: Vec2[] = [];

  for (let i = 0; i < center.length; i++) {
    const prev = center[Math.max(0, i - 1)];
    const next = center[Math.min(center.length - 1, i + 1)];
    let dx = next.x - prev.x;
    let dz = next.z - prev.z;
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    // Perpendicular in XZ.
    const nx = -dz;
    const nz = dx;
    left.push({ x: center[i].x + nx * half, z: center[i].z + nz * half });
    right.push({ x: center[i].x - nx * half, z: center[i].z - nz * half });
  }

  const positions: number[] = [];
  const uvs: number[] = [];
  for (let i = 0; i < center.length - 1; i++) {
    const l0 = left[i];
    const r0 = right[i];
    const l1 = left[i + 1];
    const r1 = right[i + 1];
    // two triangles (l0, r0, r1) (l0, r1, l1)
    positions.push(l0.x, 0, l0.z, r0.x, 0, r0.z, r1.x, 0, r1.z);
    positions.push(l0.x, 0, l0.z, r1.x, 0, r1.z, l1.x, 0, l1.z);
    const v0 = i;
    const v1 = i + 1;
    uvs.push(0, v0, 1, v0, 1, v1, 0, v0, 1, v1, 0, v1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

/** Build a filled flat polygon (XZ plane) from projected points. */
export function polygonGeometry(pts: Vec2[]): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(pts[0].x, pts[0].z);
  for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i].x, pts[i].z);
  shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(Math.PI / 2); // shape is in XY → lay flat in XZ
  return geo;
}

/** A seeded pseudo-random generator for stable city layouts. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
