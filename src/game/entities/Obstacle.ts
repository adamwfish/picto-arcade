/**
 * Cartoon Boston hazards. Five flavors, all bold readable silhouettes:
 *   - pigeon    : flapping Boston pigeon, drifts across your path
 *   - crane     : stationary construction crane with a swinging load
 *   - trolley    : flying MBTA-green trolley car
 *   - comicbag  : floating comic-shop bag (bumpable, harmless-looking decoy)
 *   - balloon   : cartoon traffic-cone balloon hazard
 *
 * Each exposes a collision radius and whether a hit is "soft" (bag) or a
 * real crash.
 */

import * as THREE from 'three';
import { PALETTE } from '../constants';
import { toon, flat, outlined, inkMesh } from '../world/materials';
import type { ObstacleKind } from '../types';

export class Obstacle {
  readonly root = new THREE.Group();
  readonly kind: ObstacleKind;
  readonly radius: number;
  readonly soft: boolean;
  private drift: THREE.Vector3;
  private wing?: THREE.Group;
  private load?: THREE.Object3D;
  private phase = Math.random() * Math.PI * 2;
  private base = new THREE.Vector3();

  constructor(kind: ObstacleKind, position: THREE.Vector3) {
    this.kind = kind;
    this.base.copy(position);
    this.root.position.copy(position);

    switch (kind) {
      case 'pigeon':
        this.radius = 2.2;
        this.soft = false;
        this.buildPigeon();
        this.drift = new THREE.Vector3((Math.random() - 0.5) * 10, 0, (Math.random() - 0.5) * 10);
        break;
      case 'crane':
        this.radius = 4.5;
        this.soft = false;
        this.buildCrane();
        this.drift = new THREE.Vector3();
        break;
      case 'trolley':
        this.radius = 4;
        this.soft = false;
        this.buildTrolley();
        this.drift = new THREE.Vector3((Math.random() - 0.5) * 16, 0, (Math.random() - 0.5) * 16);
        break;
      case 'comicbag':
        this.radius = 2.6;
        this.soft = true;
        this.buildBag();
        this.drift = new THREE.Vector3();
        break;
      case 'balloon':
      default:
        this.radius = 2.8;
        this.soft = false;
        this.buildBalloon();
        this.drift = new THREE.Vector3();
        break;
    }
  }

  private buildPigeon(): void {
    const bodyMat = toon(PALETTE.lavender, { steps: 2 });
    const body = inkMesh(new THREE.SphereGeometry(0.9, 12, 10), bodyMat, 0.14);
    body.scale.set(1, 0.85, 1.3);
    this.root.add(body);
    const head = inkMesh(new THREE.SphereGeometry(0.5, 10, 8), bodyMat, 0.1);
    head.position.set(0, 0.4, -1);
    this.root.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 6), flat(PALETTE.gold));
    beak.rotation.x = -Math.PI / 2;
    beak.position.set(0, 0.35, -1.5);
    this.root.add(beak);

    this.wing = new THREE.Group();
    for (const sx of [-1, 1]) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.9), toon(PALETTE.white, { steps: 2 }));
      w.position.set(sx * 1.1, 0.1, 0);
      this.wing.add(outlined(w, 0.1));
    }
    this.root.add(this.wing);
  }

  private buildCrane(): void {
    const mast = inkMesh(new THREE.BoxGeometry(0.8, 22, 0.8), toon(PALETTE.gold), 0.18);
    mast.position.y = 11;
    this.root.add(mast);
    const jib = inkMesh(new THREE.BoxGeometry(20, 0.7, 0.7), toon(PALETTE.gold), 0.16);
    jib.position.set(5, 21, 0);
    this.root.add(jib);
    const counter = inkMesh(new THREE.BoxGeometry(2, 1.2, 1.2), toon(PALETTE.red), 0.14);
    counter.position.set(-4.5, 21, 0);
    this.root.add(counter);
    // Swinging load on a cable.
    this.load = new THREE.Group();
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 6, 4), flat(PALETTE.ink));
    cable.position.y = -3;
    this.load.add(cable);
    const hook = inkMesh(new THREE.BoxGeometry(2, 2, 2), toon(PALETTE.navy), 0.16);
    hook.position.y = -6.5;
    this.load.add(hook);
    this.load.position.set(11, 21, 0);
    this.root.add(this.load);
  }

  private buildTrolley(): void {
    const body = inkMesh(new THREE.BoxGeometry(3, 2.2, 6.5), toon(PALETTE.grassDeep), 0.2);
    body.position.y = 0.5;
    this.root.add(body);
    const roof = inkMesh(new THREE.BoxGeometry(3.2, 0.5, 6.7), toon(PALETTE.cream), 0.16);
    roof.position.y = 1.8;
    this.root.add(roof);
    // Windows.
    for (let i = -2; i <= 2; i++) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.9, 0.9), flat(PALETTE.blueLight));
      win.position.set(0, 0.7, i * 1.2);
      this.root.add(win);
    }
    // Trolley pole.
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 4), flat(PALETTE.ink));
    pole.position.set(0, 3.2, 1);
    pole.rotation.x = 0.3;
    this.root.add(pole);
    // Little wings since it "flies".
    for (const sx of [-1, 1]) {
      const w = inkMesh(new THREE.BoxGeometry(2, 0.2, 2), toon(PALETTE.red), 0.12);
      w.position.set(sx * 2.2, 0.2, 0);
      this.root.add(w);
    }
  }

  private buildBag(): void {
    const bag = inkMesh(new THREE.BoxGeometry(2.4, 3, 1), toon(PALETTE.white), 0.16);
    bag.position.y = 0.2;
    this.root.add(bag);
    // Handles.
    for (const sx of [-1, 1]) {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.1, 6, 12, Math.PI), flat(PALETTE.ink));
      handle.position.set(sx * 0.6, 1.7, 0);
      this.root.add(handle);
    }
    // "COMICS" red band.
    const band = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.8, 1.05), flat(PALETTE.red));
    band.position.y = 0.5;
    this.root.add(band);
    const star = new THREE.Mesh(new THREE.CircleGeometry(0.7, 5), flat(PALETTE.gold));
    star.position.set(0, 0.5, 0.55);
    this.root.add(star);
  }

  private buildBalloon(): void {
    const balloon = inkMesh(new THREE.SphereGeometry(1.6, 14, 12), toon(PALETTE.red), 0.18);
    this.root.add(balloon);
    // Cartoon traffic stripes.
    for (let i = 0; i < 3; i++) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(1.55, 0.12, 6, 18), flat(PALETTE.white));
      stripe.rotation.x = Math.PI / 2;
      stripe.position.y = -0.6 + i * 0.6;
      this.root.add(stripe);
    }
    const knot = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 6), toon(PALETTE.redDeep, { steps: 2 }));
    knot.position.y = -1.7;
    this.root.add(knot);
  }

  update(dt: number, t: number, bounds = 900): void {
    switch (this.kind) {
      case 'pigeon': {
        this.root.position.addScaledVector(this.drift, dt);
        if (this.wing) this.wing.rotation.z = Math.sin(t * 14 + this.phase) * 0.6;
        this.root.lookAt(
          this.root.position.x + this.drift.x,
          this.root.position.y,
          this.root.position.z + this.drift.z,
        );
        // Wrap if it drifts too far.
        if (this.root.position.length() > bounds) this.root.position.copy(this.base);
        break;
      }
      case 'crane':
        if (this.load) this.load.rotation.z = Math.sin(t * 0.8 + this.phase) * 0.3;
        break;
      case 'trolley':
        this.root.position.addScaledVector(this.drift, dt);
        this.root.position.y = this.base.y + Math.sin(t * 1.5 + this.phase) * 1.5;
        if (this.root.position.distanceTo(this.base) > 80) {
          this.drift.multiplyScalar(-1);
        }
        break;
      case 'comicbag':
        this.root.rotation.y += dt * 0.8;
        this.root.position.y = this.base.y + Math.sin(t * 1.2 + this.phase) * 1.2;
        break;
      case 'balloon':
        this.root.position.y = this.base.y + Math.sin(t * 1.6 + this.phase) * 1.6;
        this.root.rotation.y += dt * 0.5;
        break;
    }
  }
}
