/**
 * The player's spaceship, built entirely in the mascot style: rounded white
 * body, bold black outlines, red + blue accents, and a cockpit shaped like
 * the skeleton astronaut's helmet from the logo — complete with a little bone
 * skull peeking through the navy visor.
 */

import * as THREE from 'three';
import { PALETTE } from '../constants';
import { toon, flat, outlined, inkMesh } from '../world/materials';

export class Ship {
  readonly root = new THREE.Group();
  /** Inner group we bank/roll for visual flair without affecting heading. */
  private readonly body = new THREE.Group();
  private readonly engineGlow: THREE.Mesh;
  private readonly flame: THREE.Mesh;
  private readonly skull: THREE.Group;
  private bank = 0;
  private bob = 0;

  constructor() {
    this.root.name = 'ship';
    this.root.add(this.body);

    // --- Main hull: a rounded capsule lying along -Z (forward). ---
    const hull = inkMesh(new THREE.CapsuleGeometry(1.5, 3.4, 6, 14), toon(PALETTE.white), 0.22);
    hull.rotation.x = Math.PI / 2;
    this.body.add(hull);

    // Red nose cone.
    const nose = inkMesh(new THREE.ConeGeometry(1.4, 2.6, 14), toon(PALETTE.red), 0.2);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -3.7;
    this.body.add(nose);

    // --- Cockpit: the astronaut helmet. White ring + navy visor dome. ---
    const helmetRing = inkMesh(new THREE.SphereGeometry(1.35, 16, 12), toon(PALETTE.white), 0.18);
    helmetRing.position.set(0, 0.95, -0.4);
    this.body.add(helmetRing);

    const visor = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62),
      toon(PALETTE.navy, { steps: 2, emissive: PALETTE.navy, emissiveIntensity: 0.15 }),
    );
    visor.rotation.x = Math.PI * 0.12;
    visor.position.set(0, 1.05, -0.55);
    this.body.add(visor);

    // The skull inside the helmet (bone dome + two dark eye sockets + grin).
    this.skull = this.buildSkull();
    this.skull.position.set(0, 0.95, -0.75);
    this.body.add(this.skull);

    // --- Wings: swept blue deltas with red tips. ---
    for (const side of [-1, 1]) {
      const wing = inkMesh(new THREE.BoxGeometry(3.4, 0.3, 2.2), toon(PALETTE.blue), 0.18);
      wing.position.set(side * 2.6, -0.2, 1.0);
      wing.rotation.y = side * 0.32;
      wing.rotation.z = side * -0.12;
      this.body.add(wing);

      const tip = inkMesh(new THREE.BoxGeometry(0.7, 0.4, 1.4), toon(PALETTE.red), 0.14);
      tip.position.set(side * 4.3, -0.1, 1.2);
      this.body.add(tip);

      // Little fin.
      const fin = inkMesh(new THREE.BoxGeometry(0.25, 1.3, 1.2), toon(PALETTE.red), 0.12);
      fin.position.set(side * 1.4, 0.7, 2.4);
      fin.rotation.z = side * 0.3;
      this.body.add(fin);
    }

    // --- Engine block + glow + boost flame at the tail (+Z). ---
    const engine = inkMesh(new THREE.CylinderGeometry(1.0, 1.2, 1.2, 12), toon(PALETTE.navy), 0.16);
    engine.rotation.x = Math.PI / 2;
    engine.position.z = 2.6;
    this.body.add(engine);

    this.engineGlow = new THREE.Mesh(
      new THREE.CircleGeometry(0.85, 16),
      flat(PALETTE.gold, { transparent: true, opacity: 0.9 }),
    );
    this.engineGlow.position.set(0, 0, 3.25);
    this.engineGlow.rotation.y = Math.PI;
    this.body.add(this.engineGlow);

    this.flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.8, 4, 12),
      flat(PALETTE.red, { transparent: true, opacity: 0.85 }),
    );
    this.flame.rotation.x = -Math.PI / 2;
    this.flame.position.z = 5;
    this.flame.scale.setScalar(0.001);
    this.body.add(this.flame);

    this.root.scale.setScalar(1.15);
  }

  private buildSkull(): THREE.Group {
    const g = new THREE.Group();
    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.55, 12, 10), toon(PALETTE.bone, { steps: 2 }));
    g.add(outlined(cranium, 0.08));

    const jaw = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.35, 0.4), toon(PALETTE.bone, { steps: 2 }));
    jaw.position.set(0, -0.5, 0.05);
    g.add(outlined(jaw, 0.06));

    const eyeMat = flat(PALETTE.ink);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), eyeMat);
      eye.position.set(sx * 0.22, 0.05, -0.42);
      g.add(eye);
    }
    // A red comic-style grin line.
    const grin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.05), flat(PALETTE.red));
    grin.position.set(0, -0.32, -0.45);
    g.add(grin);
    g.scale.setScalar(0.9);
    return g;
  }

  /** Visual roll/bank toward turn direction. `target` in radians. */
  setBank(target: number, dt: number, ret = 6): void {
    this.bank += (target - this.bank) * Math.min(1, dt * ret);
  }

  /**
   * Drive engine visuals. `thrust` 0..1 sizes the flame; `boost` adds a big
   * Holy-Grail flare and tints it.
   */
  setThrust(thrust: number, boost: boolean): void {
    const s = THREE.MathUtils.clamp(thrust, 0, 1);
    const flameLen = 0.3 + s * 1.4 + (boost ? 1.6 : 0);
    this.flame.scale.set(0.8 + (boost ? 0.7 : 0), flameLen, 0.8 + (boost ? 0.7 : 0));
    const fmat = this.flame.material as THREE.MeshBasicMaterial;
    fmat.color.set(boost ? 0xffd54a : 0xe23446);
    fmat.opacity = 0.5 + s * 0.4;
    const gmat = this.engineGlow.material as THREE.MeshBasicMaterial;
    gmat.opacity = 0.5 + s * 0.5;
  }

  update(_dt: number, t: number): void {
    this.body.rotation.z = this.bank;
    // Gentle idle bob.
    this.bob = Math.sin(t * 2.2) * 0.12;
    this.body.position.y = this.bob;
    // Flame flicker.
    const flick = 0.85 + Math.sin(t * 40) * 0.15;
    this.flame.scale.y *= flick;
  }

  setVisible(v: boolean): void {
    this.root.visible = v;
  }
}
