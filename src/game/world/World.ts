/**
 * Assembles the entire stylized Boston: ground, comic sky, the Charles +
 * harbor, road network, generic neighborhood blocks, and every signature
 * landmark — all in flat cel-shaded, black-outlined geometry.
 */

import * as THREE from 'three';
import { PALETTE, hex } from '../constants';
import { LANDMARKS, DISTRICTS, RACE_ROUTE, landmark, project } from '../data/boston';
import { toon, flat, inkMesh } from './materials';
import { mulberry32 } from './geo';
import { buildWater } from './water';
import { buildRoads } from './roads';
import { buildLandmark } from './landmarks';
import { scatterTrees } from './trees';

export class World {
  readonly root = new THREE.Group();
  readonly checkpoints: THREE.Vector3[] = [];
  readonly landmarkPositions = new Map<string, THREE.Vector3>();

  constructor() {
    this.root.name = 'world';
    this.buildSky();
    this.buildGround();
    this.root.add(buildWater());
    this.root.add(buildRoads());
    this.buildDistricts();
    this.buildLandmarks();
    this.buildParksAndTrees();
    this.computeCheckpoints();
  }

  private buildSky(): void {
    // A big inverted dome of pale comic sky. Unlit so it stays flat.
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1400, 24, 12),
      new THREE.MeshBasicMaterial({ color: hex(PALETTE.sky), side: THREE.BackSide }),
    );
    this.root.add(sky);

    // A couple of fat comic clouds (flat white blobs) drifting high up.
    const cloudMat = flat(PALETTE.white);
    for (let i = 0; i < 14; i++) {
      const cloud = new THREE.Group();
      const a = (i / 14) * Math.PI * 2;
      const r = 280 + (i % 4) * 90;
      for (let b = 0; b < 4; b++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(10 + b * 3, 8, 6), cloudMat);
        puff.position.set(b * 9 - 13, 0, (b % 2) * 5);
        cloud.add(puff);
      }
      cloud.position.set(Math.cos(a) * r, 120 + (i % 5) * 16, Math.sin(a) * r);
      cloud.scale.setScalar(1.2 + (i % 3) * 0.4);
      this.root.add(cloud);
    }
  }

  private buildGround(): void {
    // The land — a warm cream "paper" base the whole city sits on.
    const ground = new THREE.Mesh(
      new THREE.CircleGeometry(900, 48),
      flat(PALETTE.cream),
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    this.root.add(ground);

    // A faint grass tint disc under downtown for warmth.
    const tint = new THREE.Mesh(new THREE.CircleGeometry(220, 32), flat(PALETTE.road));
    tint.rotation.x = -Math.PI / 2;
    tint.position.y = 0.02;
    this.root.add(tint);
  }

  private buildDistricts(): void {
    const rng = mulberry32(1337);
    for (const dist of DISTRICTS) {
      const c = project(dist.lat, dist.lng);
      const count = Math.floor(dist.radius * (dist.tall ? 0.7 : 0.9));
      for (let i = 0; i < count; i++) {
        const a = rng() * Math.PI * 2;
        const r = Math.sqrt(rng()) * dist.radius;
        const x = c.x + Math.cos(a) * r;
        const z = c.z + Math.sin(a) * r;

        const w = 3 + rng() * 5;
        const depth = 3 + rng() * 5;
        const h = dist.tall ? 10 + rng() * rng() * 46 : 5 + rng() * 10;

        const palette = dist.tall
          ? [PALETTE.steel, PALETTE.navy, PALETTE.white][Math.floor(rng() * 3)]
          : [PALETTE.brick, PALETTE.cream, PALETTE.red][Math.floor(rng() * 3)];

        const b = inkMesh(new THREE.BoxGeometry(w, h, depth), toon(palette, { steps: 3 }), 0.4);
        b.position.set(x, h / 2, z);
        b.rotation.y = Math.round(rng() * 4) * (Math.PI / 8);

        // A flat windows decal stripe or a little roof box for variety.
        if (dist.tall && h > 24) {
          const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.4, 2, depth * 0.4), flat(PALETTE.red));
          cap.position.set(x, h + 1, z);
          this.root.add(cap);
        }
        this.root.add(b);
      }
    }
  }

  private buildLandmarks(): void {
    for (const l of LANDMARKS) {
      const p = project(l.lat, l.lng);
      const group = buildLandmark(l);
      group.position.set(p.x, 0, p.z);
      group.name = `landmark:${l.id}`;
      this.root.add(group);
      this.landmarkPositions.set(l.id, new THREE.Vector3(p.x, (l.h ?? 8) * 0.6, p.z));
    }
  }

  private buildParksAndTrees(): void {
    const common = landmark('common');
    const c = project(common.lat, common.lng);
    this.root.add(scatterTrees(c.x, c.z, 30, 26, 11));

    // Esplanade strip along the river near the Pru.
    const pru = project(42.354, -71.082);
    this.root.add(scatterTrees(pru.x, pru.z, 18, 14, 23));
  }

  private computeCheckpoints(): void {
    for (const id of RACE_ROUTE) {
      const l = landmark(id);
      const p = project(l.lat, l.lng);
      // Fly the player through the air just above/beside each landmark.
      this.checkpoints.push(new THREE.Vector3(p.x, Math.max(18, (l.h ?? 10) * 0.7 + 10), p.z));
    }
  }

  /** Start position: just in front of the first checkpoint (Fenway). */
  startPosition(): THREE.Vector3 {
    const first = this.checkpoints[0];
    return new THREE.Vector3(first.x + 30, 22, first.z + 30);
  }

  dispose(): void {
    this.root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose?.();
    });
  }
}
