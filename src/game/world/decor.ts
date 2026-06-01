/**
 * Mascot + Americana decor — the pieces that make the whole world feel like
 * the Robo Picto logo: the skeleton-astronaut himself as a giant roadside
 * statue, a circular "mission patch" flag backdrop, and red/white/blue
 * bunting helpers.
 */

import * as THREE from 'three';
import { PALETTE, hex } from '../constants';
import { toon, flat, inkMesh } from './materials';

const BONE = PALETTE.bone;

/**
 * The skeleton astronaut mascot — white suit, bone skull in a navy visor,
 * one arm thrown up in a peace sign, a stack of stolen comics in the other.
 * Faces +Z. Roughly 6 units tall at scale 1.
 */
export function buildMascot(): THREE.Group {
  const m = new THREE.Group();
  m.name = 'mascot';

  // Torso + pelvis (white suit).
  const torso = inkMesh(new THREE.CapsuleGeometry(1.05, 1.5, 5, 12), toon(PALETTE.white), 0.16);
  torso.position.y = 3.2;
  m.add(torso);
  // Red chest patch + control box.
  const chest = inkMesh(new THREE.BoxGeometry(0.9, 1.1, 0.4), toon(PALETTE.red), 0.1);
  chest.position.set(0, 3.4, 0.95);
  m.add(chest);
  // Backpack.
  const pack = inkMesh(new THREE.BoxGeometry(1.6, 1.8, 0.9), toon(PALETTE.white), 0.14);
  pack.position.set(0, 3.4, -1.05);
  m.add(pack);
  const packDial = inkMesh(new THREE.BoxGeometry(0.7, 0.7, 0.3), toon(PALETTE.gold), 0.08);
  packDial.position.set(0, 3.4, -1.55);
  m.add(packDial);

  // --- Head: helmet + visor + skull ---
  const head = new THREE.Group();
  head.position.set(0, 5.2, 0.1);
  const helmet = inkMesh(new THREE.SphereGeometry(1.25, 16, 14), toon(PALETTE.white), 0.16);
  head.add(helmet);
  const visor = new THREE.Mesh(
    new THREE.SphereGeometry(1.02, 16, 14, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.25, Math.PI * 0.5),
    toon(PALETTE.navy, { steps: 2 }),
  );
  visor.position.z = 0.18;
  head.add(visor);
  head.add(buildSkull());
  m.add(head);

  // --- Arms ---
  // Right arm raised in a peace sign.
  const rArm = new THREE.Group();
  rArm.position.set(1.15, 3.9, 0.1);
  const rUpper = inkMesh(new THREE.CapsuleGeometry(0.34, 1.2, 4, 8), toon(PALETTE.white), 0.1);
  rUpper.position.set(0.5, 0.8, 0);
  rUpper.rotation.z = -0.9;
  rArm.add(rUpper);
  const rHand = new THREE.Group();
  rHand.position.set(1.5, 1.9, 0);
  const palm = inkMesh(new THREE.BoxGeometry(0.5, 0.5, 0.4), toon(BONE, { steps: 2 }), 0.07);
  rHand.add(palm);
  for (const fx of [-0.13, 0.13]) {
    const finger = inkMesh(new THREE.CapsuleGeometry(0.1, 0.5, 3, 6), toon(BONE, { steps: 2 }), 0.05);
    finger.position.set(fx, 0.45, 0);
    rHand.add(finger);
  }
  rArm.add(rHand);
  m.add(rArm);

  // Left arm cradling a comic stack.
  const lUpper = inkMesh(new THREE.CapsuleGeometry(0.34, 1.3, 4, 8), toon(PALETTE.white), 0.1);
  lUpper.position.set(-1.35, 3.3, 0.4);
  lUpper.rotation.z = 0.5;
  lUpper.rotation.x = -0.4;
  m.add(lUpper);
  const stack = buildComicStack();
  stack.position.set(-1.5, 2.9, 1.0);
  stack.rotation.z = 0.15;
  m.add(stack);

  // --- Legs + boots ---
  for (const sx of [-0.55, 0.55]) {
    const leg = inkMesh(new THREE.CapsuleGeometry(0.42, 1.5, 4, 8), toon(PALETTE.white), 0.12);
    leg.position.set(sx, 1.5, 0);
    m.add(leg);
    const boot = inkMesh(new THREE.BoxGeometry(0.9, 0.6, 1.3), toon(PALETTE.white), 0.1);
    boot.position.set(sx, 0.5, 0.25);
    m.add(boot);
    const sole = inkMesh(new THREE.BoxGeometry(0.95, 0.25, 1.35), toon(PALETTE.red), 0.06);
    sole.position.set(sx, 0.2, 0.25);
    m.add(sole);
  }

  return m;
}

function buildSkull(): THREE.Group {
  const g = new THREE.Group();
  g.position.set(0, 0, 0.55);
  const cranium = inkMesh(new THREE.SphereGeometry(0.62, 14, 12), toon(BONE, { steps: 2 }), 0.07);
  g.add(cranium);
  const jaw = inkMesh(new THREE.BoxGeometry(0.62, 0.34, 0.45), toon(BONE, { steps: 2 }), 0.05);
  jaw.position.set(0, -0.55, 0.05);
  g.add(jaw);
  const eyeMat = flat(PALETTE.ink);
  for (const sx of [-0.24, 0.24]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 8), eyeMat);
    eye.position.set(sx, 0.05, 0.42);
    g.add(eye);
  }
  // Nose triangle + grin teeth.
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 3), eyeMat);
  nose.position.set(0, -0.2, 0.5);
  g.add(nose);
  for (let i = -2; i <= 2; i++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.16, 0.05), flat(PALETTE.ink));
    tooth.position.set(i * 0.12, -0.5, 0.48);
    g.add(tooth);
  }
  return g;
}

function buildComicStack(): THREE.Group {
  const g = new THREE.Group();
  const colors = [PALETTE.red, PALETTE.blue, PALETTE.gold, PALETTE.navy];
  for (let i = 0; i < 4; i++) {
    const bookGroup = inkMesh(new THREE.BoxGeometry(1.5, 0.22, 1.1), toon(colors[i % colors.length], { steps: 2 }), 0.06);
    bookGroup.position.y = i * 0.26;
    bookGroup.rotation.y = (i - 1.5) * 0.08;
    g.add(bookGroup);
  }
  return g;
}

/**
 * A big circular "mission patch" billboard echoing the logo: cream ring,
 * black outline, an American-flag face (stripes + star canton). Stands
 * upright; faces +Z. ~36 units across at scale 1.
 */
export function buildMissionPatch(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'missionPatch';
  const R = 18;

  // Black outline disc, then cream ring, then flag face.
  const ink = new THREE.Mesh(new THREE.CircleGeometry(R + 1.2, 48), flat(PALETTE.ink));
  ink.position.z = -0.3;
  g.add(ink);
  const ring = new THREE.Mesh(new THREE.RingGeometry(R - 2.4, R, 48), flat(PALETTE.cream));
  ring.position.z = 0.05;
  g.add(ring);

  // Flag face clipped to a circle via a CircleGeometry base + stripe planes
  // masked by being slightly smaller than the inner radius.
  const inner = R - 2.4;
  const face = new THREE.Mesh(new THREE.CircleGeometry(inner, 48), flat(PALETTE.white));
  g.add(face);
  // 13 stripes across the disc (clamped by the circle visually).
  const stripes = 13;
  for (let i = 0; i < stripes; i++) {
    if (i % 2 === 1) continue;
    const y = inner - (i + 0.5) * (2 * inner / stripes);
    const halfW = Math.sqrt(Math.max(0, inner * inner - y * y));
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(halfW * 2, (2 * inner) / stripes), flat(PALETTE.red));
    stripe.position.set(0, y, 0.05);
    g.add(stripe);
  }
  // Navy star canton (upper-left).
  const canton = new THREE.Mesh(new THREE.PlaneGeometry(inner * 0.8, inner * 0.55), flat(PALETTE.navy));
  canton.position.set(-inner * 0.32, inner * 0.42, 0.1);
  g.add(canton);
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 4; c++) {
      const star = new THREE.Mesh(new THREE.CircleGeometry(0.7, 5), flat(PALETTE.white));
      star.position.set(-inner * 0.58 + c * (inner * 0.18), inner * 0.58 - r * (inner * 0.17), 0.12);
      g.add(star);
    }
  }

  // Backing pole.
  const pole = inkMesh(new THREE.CylinderGeometry(1, 1.3, R + 8, 10), toon(PALETTE.steel), 0.2);
  pole.position.y = -(R + 8) / 2;
  pole.position.z = -1;
  g.add(pole);

  return g;
}

/** A swag of red/white/blue triangle bunting along a straight span. */
export function buildBunting(length: number, count = 18): THREE.Group {
  const g = new THREE.Group();
  const colors = [PALETTE.red, PALETTE.white, PALETTE.blue];
  for (let i = 0; i < count; i++) {
    const f = i / (count - 1);
    const x = (f - 0.5) * length;
    const sag = Math.sin(f * Math.PI) * (length * 0.04);
    const tri = new THREE.Mesh(new THREE.ConeGeometry(0.6, 1.5, 3), flat(colors[i % 3]));
    tri.position.set(x, -sag, 0);
    tri.rotation.x = Math.PI;
    g.add(tri);
  }
  return g;
}

/** A small American flag on a pole, for rooftops and the airport. */
export function buildFlag(): THREE.Group {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 8, 6), flat(PALETTE.ink));
  pole.position.y = 4;
  g.add(pole);
  const flag = new THREE.Group();
  flag.position.set(1.6, 7, 0);
  const field = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8), flat(PALETTE.white));
  flag.add(field);
  for (let i = 0; i < 7; i++) {
    if (i % 2 === 1) continue;
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(3, 1.8 / 7), flat(PALETTE.red));
    stripe.position.set(0, 0.9 - (i + 0.5) * (1.8 / 7), 0.01);
    flag.add(stripe);
  }
  const canton = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.9), flat(PALETTE.navy));
  canton.position.set(-0.9, 0.45, 0.02);
  flag.add(canton);
  g.add(flag);
  return g;
}

/** A faint flat "ground glow" disc, helps the mascot statue read against the city. */
export function spotlight(color: string, radius: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 24), new THREE.MeshBasicMaterial({ color: hex(color), transparent: true, opacity: 0.25 }));
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.05;
  return m;
}
