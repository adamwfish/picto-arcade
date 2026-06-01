/**
 * Comic / screen-print material toolkit.
 *
 * Two ingredients give us the mascot's "outlined vector illustration" look on
 * 3D geometry:
 *
 *   1. MeshToonMaterial driven by a tiny 2–3 step gradient ramp → hard,
 *      flat cel-shaded bands instead of smooth lighting (no gradients).
 *   2. An inverted-hull outline: a duplicate of the mesh, scaled slightly
 *      along its normals, rendered with BackSide in flat black. Cheap,
 *      reliable, and gives every object the thick comic-book ink line.
 */

import * as THREE from 'three';
import { PALETTE, hex } from '../constants';

const toonRamps = new Map<number, THREE.DataTexture>();

/** Build (and cache) an N-step grayscale gradient map for toon banding. */
function gradientMap(steps: number): THREE.DataTexture {
  const cached = toonRamps.get(steps);
  if (cached) return cached;
  const data = new Uint8Array(steps);
  for (let i = 0; i < steps; i++) {
    // Bias toward the lit end so shapes stay bright and sticker-like.
    data[i] = Math.round(80 + (175 * i) / Math.max(1, steps - 1));
  }
  const tex = new THREE.DataTexture(data, steps, 1, THREE.RedFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  toonRamps.set(steps, tex);
  return tex;
}

export interface ToonOptions {
  steps?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
}

const toonCache = new Map<string, THREE.MeshToonMaterial>();

/** Flat cel-shaded material in one of our palette colors. */
export function toon(color: string, opts: ToonOptions = {}): THREE.MeshToonMaterial {
  const steps = opts.steps ?? 3;
  const key = `${color}|${steps}|${opts.emissive ?? ''}|${opts.emissiveIntensity ?? 0}|${opts.opacity ?? 1}`;
  const cached = toonCache.get(key);
  if (cached && !opts.transparent) return cached;
  const mat = new THREE.MeshToonMaterial({
    color: hex(color),
    gradientMap: gradientMap(steps),
    emissive: opts.emissive ? hex(opts.emissive) : 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 0,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
  if (!opts.transparent) toonCache.set(key, mat);
  return mat;
}

/** Pure flat (unlit) material — used for water, sky bands, decals. */
export function flat(color: string, opts: { opacity?: number; transparent?: boolean } = {}): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: hex(color),
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
}

let outlineMat: THREE.MeshBasicMaterial | null = null;
function getOutlineMat(): THREE.MeshBasicMaterial {
  if (!outlineMat) {
    outlineMat = new THREE.MeshBasicMaterial({ color: hex(PALETTE.ink), side: THREE.BackSide });
  }
  return outlineMat;
}

/**
 * Wrap a mesh with a black inverted-hull outline and return a Group holding
 * both. `thickness` is in world units of normal expansion.
 */
export function outlined(mesh: THREE.Mesh, thickness = 0.4): THREE.Group {
  const group = new THREE.Group();
  const outline = new THREE.Mesh(mesh.geometry, getOutlineMat());
  // Expand along normals via a scale that matches the geometry's size.
  mesh.geometry.computeBoundingSphere();
  const r = mesh.geometry.boundingSphere?.radius ?? 1;
  const s = 1 + thickness / Math.max(0.5, r);
  outline.scale.setScalar(s);
  outline.castShadow = false;
  outline.receiveShadow = false;
  group.add(outline);
  group.add(mesh);
  return group;
}

/**
 * Convenience: build an outlined mesh from geometry + material in one call.
 */
export function inkMesh(
  geo: THREE.BufferGeometry,
  material: THREE.Material,
  thickness = 0.4,
): THREE.Group {
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return outlined(mesh, thickness);
}
