/**
 * Assembles the entire stylized Boston: comic sky, ground, the Charles +
 * harbor, the road network, a dense map-driven city fill, every signature
 * landmark, parks, and the mascot Americana centerpiece — all in flat
 * cel-shaded, black-outlined geometry.
 *
 * The race course itself lives in Course.ts; this is the scenery the course
 * flies through.
 */

import * as THREE from 'three';
import { PALETTE, hex } from '../constants';
import { LANDMARKS, landmark, project } from '../data/boston';
import { toon, flat } from './materials';
import { buildWater } from './water';
import { buildRoads } from './roads';
import { buildLandmark } from './landmarks';
import { scatterTrees } from './trees';
import { buildCityFill } from './cityfill';
import { buildMascot, buildMissionPatch, buildFlag, spotlight } from './decor';

export class World {
  readonly root = new THREE.Group();
  readonly landmarkPositions = new Map<string, THREE.Vector3>();

  constructor() {
    this.root.name = 'world';
    this.buildSky();
    this.buildGround();
    this.root.add(buildWater());
    this.root.add(buildRoads());
    this.root.add(buildCityFill());
    this.buildLandmarks();
    this.buildParksAndTrees();
    this.buildMascotCenterpiece();
  }

  private buildSky(): void {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(1500, 24, 12),
      new THREE.MeshBasicMaterial({ color: hex(PALETTE.sky), side: THREE.BackSide }),
    );
    this.root.add(sky);

    const cloudMat = flat(PALETTE.white);
    for (let i = 0; i < 16; i++) {
      const cloud = new THREE.Group();
      const a = (i / 16) * Math.PI * 2;
      const r = 320 + (i % 4) * 90;
      for (let b = 0; b < 4; b++) {
        const puff = new THREE.Mesh(new THREE.SphereGeometry(11 + b * 3, 8, 6), cloudMat);
        puff.position.set(b * 9 - 13, 0, (b % 2) * 5);
        cloud.add(puff);
      }
      cloud.position.set(Math.cos(a) * r, 130 + (i % 5) * 18, Math.sin(a) * r);
      cloud.scale.setScalar(1.3 + (i % 3) * 0.5);
      this.root.add(cloud);
    }
  }

  private buildGround(): void {
    const ground = new THREE.Mesh(new THREE.CircleGeometry(1000, 48), flat(PALETTE.cream));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.root.add(ground);

    // Pale grass/asphalt tint disc under greater downtown for warmth.
    const tint = new THREE.Mesh(new THREE.CircleGeometry(260, 32), flat(PALETTE.road));
    tint.rotation.x = -Math.PI / 2;
    tint.position.y = 0.02;
    this.root.add(tint);
  }

  private buildLandmarks(): void {
    for (const l of LANDMARKS) {
      const p = project(l.lat, l.lng);
      const group = buildLandmark(l);
      group.position.set(p.x, 0, p.z);
      group.name = `landmark:${l.id}`;
      this.root.add(group);
      this.landmarkPositions.set(l.id, new THREE.Vector3(p.x, (l.h ?? 8) * 0.6, p.z));

      // A few rooftop flags for Americana flavor.
      if (l.id === 'logan' || l.id === 'tdgarden' || l.id === 'statehouse') {
        const flag = buildFlag();
        flag.position.set(p.x, (l.h ?? 10) * 0.6, p.z);
        this.root.add(flag);
      }
    }
  }

  private buildParksAndTrees(): void {
    const common = landmark('common');
    const c = project(common.lat, common.lng);
    this.root.add(scatterTrees(c.x, c.z, 34, 30, 11));

    const pru = project(42.354, -71.082);
    this.root.add(scatterTrees(pru.x, pru.z, 18, 14, 23));
  }

  private buildMascotCenterpiece(): void {
    // The skeleton-astronaut mascot as a giant statue on Boston Common, with
    // the American-flag "mission patch" rising behind him — the logo, in 3D.
    const c = project(42.3551, -71.0656);

    const patch = buildMissionPatch();
    patch.scale.setScalar(2.0);
    patch.position.set(c.x, 40, c.z - 14);
    this.root.add(patch);

    const mascot = buildMascot();
    mascot.scale.setScalar(3.4);
    mascot.position.set(c.x, 1.2, c.z + 6);
    mascot.rotation.y = Math.PI; // face out toward the incoming course
    this.root.add(mascot);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(9, 11, 2.4, 20), toon(PALETTE.navy, { steps: 2 }));
    base.position.set(c.x, 1.2, c.z + 6);
    this.root.add(base);
    this.root.add(this.outlinedDisc(c.x, c.z + 6));
    const glow = spotlight(PALETTE.gold, 16);
    glow.position.set(c.x, 0.06, c.z + 6);
    this.root.add(glow);
  }

  private outlinedDisc(x: number, z: number): THREE.Mesh {
    const ink = new THREE.Mesh(new THREE.CylinderGeometry(11.6, 13, 2.2, 20), flat(PALETTE.ink));
    ink.position.set(x, 1.1, z);
    return ink;
  }

  dispose(): void {
    this.root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose?.();
    });
  }
}
