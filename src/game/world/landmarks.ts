/**
 * Cartoon, cel-shaded recreations of Boston's signature landmarks. Each is a
 * bold, readable silhouette built from a handful of outlined primitives — the
 * goal is instant recognizability ("that's the Zakim!"), not architectural
 * accuracy.
 */

import * as THREE from 'three';
import { PALETTE } from '../constants';
import { toon, flat, outlined, inkMesh } from './materials';
import type { Landmark } from '../data/boston';
import { makeTree } from './trees';

function box(w: number, h: number, d: number, color: string, steps = 3, ink = 0.4): THREE.Group {
  return inkMesh(new THREE.BoxGeometry(w, h, d), toon(color, { steps }), ink);
}

function cyl(rt: number, rb: number, h: number, color: string, seg = 12, ink = 0.3): THREE.Group {
  return inkMesh(new THREE.CylinderGeometry(rt, rb, h, seg), toon(color, { steps: 3 }), ink);
}

/** Fenway Park — green grandstand ring + the Green Monster + light towers. */
function buildStadium(l: Landmark): THREE.Group {
  const g = new THREE.Group();
  const w = l.w ?? 26;
  const d = l.d ?? 22;

  // Outer stand ring (open oval made from 4 angled stands).
  const standMat = toon(PALETTE.navy, { steps: 3 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(w * 0.6, 3, 6, 18), standMat);
  ring.rotation.x = Math.PI / 2;
  ring.scale.set(1, d / w, 1);
  ring.position.y = 4;
  g.add(outlined(ring, 0.5));

  // Playing field.
  const field = new THREE.Mesh(new THREE.CircleGeometry(w * 0.55, 24), flat(PALETTE.grass));
  field.rotation.x = -Math.PI / 2;
  field.scale.set(1, 1, d / w);
  field.position.y = 0.3;
  g.add(field);

  // The Green Monster — a tall left-field wall.
  const monster = box(w * 0.9, 7, 1.2, PALETTE.grassDeep);
  monster.position.set(0, 3.5, -d * 0.5);
  g.add(monster);

  // Light towers.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pole = cyl(0.3, 0.3, 11, PALETTE.steel, 6, 0.18);
      pole.position.set(sx * w * 0.5, 5.5, sz * d * 0.5);
      const bank = box(3, 1.6, 0.6, PALETTE.gold);
      bank.position.set(sx * w * 0.5, 11, sz * d * 0.5);
      g.add(pole, bank);
    }
  }
  return g;
}

/** Prudential Tower — tall banded slab with antenna. */
function buildTower(l: Landmark): THREE.Group {
  const g = new THREE.Group();
  const h = l.h ?? 56;
  const w = l.w ?? 9;

  const shaft = box(w, h, w, PALETTE.steel);
  shaft.position.y = h / 2;
  g.add(shaft);

  // Window bands (flat blue stripes).
  const bandMat = flat(PALETTE.navy);
  const bands = Math.floor(h / 6);
  for (let i = 1; i < bands; i++) {
    const band = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, 0.8, w + 0.1), bandMat);
    band.position.y = i * 6;
    g.add(band);
  }
  // Crown + antenna.
  const crown = box(w * 0.7, 3, w * 0.7, PALETTE.white);
  crown.position.y = h + 1.5;
  const antenna = cyl(0.15, 0.3, 8, PALETTE.red, 6, 0.12);
  antenna.position.y = h + 6;
  g.add(crown, antenna);
  return g;
}

/** Boston Common — green park mound with paths, a gazebo, and trees. */
function buildPark(l: Landmark): THREE.Group {
  const g = new THREE.Group();
  const w = l.w ?? 34;
  const d = l.d ?? 28;

  const lawn = new THREE.Mesh(new THREE.CircleGeometry(1, 28), flat(PALETTE.grass));
  lawn.scale.set(w, d, 1);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.18;
  g.add(lawn);

  // Frog Pond — a small comic-blue kidney.
  const pond = new THREE.Mesh(new THREE.CircleGeometry(5, 18), flat(PALETTE.water));
  pond.rotation.x = -Math.PI / 2;
  pond.position.set(-w * 0.2, 0.22, d * 0.1);
  pond.scale.set(1, 0.7, 1);
  g.add(pond);

  // Gazebo / bandstand.
  const base = cyl(3, 3.4, 0.8, PALETTE.cream, 10, 0.2);
  base.position.set(w * 0.18, 0.4, -d * 0.12);
  const roof = cyl(0.2, 3.4, 2.4, PALETTE.red, 10, 0.25);
  roof.position.set(w * 0.18, 2.6, -d * 0.12);
  g.add(base, roof);

  // A ring of trees.
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const t = makeTree(0.9 + (i % 3) * 0.2);
    t.position.set(Math.cos(a) * w * 0.85, 0, Math.sin(a) * d * 0.85);
    g.add(t);
  }
  return g;
}

/** TD Garden — rounded arena drum with a banner ring. */
function buildArena(l: Landmark): THREE.Group {
  const g = new THREE.Group();
  const w = l.w ?? 18;
  const h = l.h ?? 14;

  const drum = cyl(w * 0.6, w * 0.7, h, PALETTE.cream, 16, 0.45);
  drum.position.y = h / 2;
  g.add(drum);

  const roof = cyl(w * 0.5, w * 0.62, 2.2, PALETTE.red, 16, 0.4);
  roof.position.y = h + 0.6;
  g.add(roof);

  // Championship banner ring (gold + navy chips).
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const banner = box(0.6, 2.4, 0.2, i % 2 ? PALETTE.gold : PALETTE.navy, 2, 0.1);
    banner.position.set(Math.cos(a) * w * 0.64, h * 0.7, Math.sin(a) * w * 0.64);
    banner.lookAt(0, h * 0.7, 0);
    g.add(banner);
  }
  return g;
}

/** Zakim Bridge — the unmistakable inverted-Y cable-stayed towers + cables. */
function buildBridge(l: Landmark): THREE.Group {
  const g = new THREE.Group();
  const h = l.h ?? 34;
  const span = (l.d ?? 30) * 2;

  // Deck.
  const deck = box(8, 0.8, span, PALETTE.steel);
  deck.position.y = 6;
  g.add(deck);

  // Two inverted-Y pylons.
  const cableMat = flat(PALETTE.white);
  for (const sz of [-0.18, 0.18]) {
    const baseZ = sz * span;
    // Splayed legs.
    for (const sx of [-1, 1]) {
      const leg = cyl(0.5, 0.8, 12, PALETTE.cream, 8, 0.2);
      leg.position.set(sx * 2.4, 6 + 6, baseZ);
      leg.rotation.z = sx * 0.28;
      g.add(leg);
    }
    // Single spire above the deck.
    const spire = cyl(0.4, 0.6, h, PALETTE.cream, 8, 0.25);
    spire.position.set(0, 6 + 12 + h / 2, baseZ);
    g.add(spire);
    // Fan of cables to the deck.
    for (let i = 1; i <= 6; i++) {
      const len = i * (span * 0.16) / 6;
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1, 4), cableMat);
      const topY = 6 + 12 + h * 0.9;
      const tip = new THREE.Vector3(0, 6.6, baseZ + (sz > 0 ? len : -len));
      const top = new THREE.Vector3(0, topY, baseZ);
      const mid = tip.clone().add(top).multiplyScalar(0.5);
      cable.position.copy(mid);
      cable.scale.y = tip.distanceTo(top);
      cable.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        top.clone().sub(tip).normalize(),
      );
      g.add(cable);
    }
  }
  return g;
}

/** Logan Airport — flat terminals, runways, control tower, parked jet. */
function buildAirport(l: Landmark): THREE.Group {
  const g = new THREE.Group();
  const w = l.w ?? 40;
  const d = l.d ?? 30;

  // Tarmac.
  const tarmac = new THREE.Mesh(new THREE.PlaneGeometry(w * 2, d * 2), flat(PALETTE.asphalt));
  tarmac.rotation.x = -Math.PI / 2;
  tarmac.position.y = 0.2;
  g.add(tarmac);

  // Runway stripes.
  const stripeMat = flat(PALETTE.cream);
  for (let i = -3; i <= 3; i++) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2, d * 1.6), stripeMat);
    s.rotation.x = -Math.PI / 2;
    s.rotation.z = 0.15;
    s.position.set(i * 6, 0.24, 0);
    g.add(s);
  }

  // Terminal building.
  const terminal = box(w * 0.7, 5, d * 0.5, PALETTE.white);
  terminal.position.set(-w * 0.4, 2.5, -d * 0.3);
  g.add(terminal);

  // Control tower.
  const towerBase = cyl(1.2, 1.6, 14, PALETTE.cream, 8, 0.2);
  towerBase.position.set(w * 0.3, 7, -d * 0.3);
  const cab = box(4, 2.5, 4, PALETTE.navy);
  cab.position.set(w * 0.3, 14.5, -d * 0.3);
  g.add(towerBase, cab);

  // A parked cartoon jet.
  const jet = buildJet();
  jet.position.set(0, 1.6, d * 0.2);
  jet.rotation.y = 0.4;
  g.add(jet);
  return g;
}

function buildJet(): THREE.Group {
  const g = new THREE.Group();
  const body = inkMesh(new THREE.CapsuleGeometry(1.1, 8, 4, 10), toon(PALETTE.white), 0.25);
  body.rotation.z = Math.PI / 2;
  g.add(body);
  const wing = box(2, 0.3, 8, PALETTE.red);
  g.add(wing);
  const tail = box(1.4, 2.4, 0.3, PALETTE.red);
  tail.position.set(-4.2, 1.4, 0);
  g.add(tail);
  return g;
}

/** Massachusetts State House — brick block with a golden dome. */
function buildCapitol(l: Landmark): THREE.Group {
  const g = new THREE.Group();
  const w = l.w ?? 10;
  const h = l.h ?? 16;
  const block = box(w, h * 0.6, l.d ?? 8, PALETTE.brick);
  block.position.y = (h * 0.6) / 2;
  g.add(block);
  const drum = cyl(2.4, 2.8, 2.5, PALETTE.cream, 12, 0.2);
  drum.position.y = h * 0.6 + 1.2;
  const dome = inkMesh(new THREE.SphereGeometry(2.6, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(PALETTE.gold, { steps: 3 }), 0.25);
  dome.position.y = h * 0.6 + 2.5;
  const cupola = cyl(0.3, 0.5, 1.4, PALETTE.gold, 8, 0.1);
  cupola.position.y = h * 0.6 + 5.2;
  g.add(drum, dome, cupola);
  return g;
}

const BUILDERS: Record<Landmark['type'], (l: Landmark) => THREE.Group> = {
  stadium: buildStadium,
  tower: buildTower,
  park: buildPark,
  arena: buildArena,
  bridge: buildBridge,
  airport: buildAirport,
  capitol: buildCapitol,
};

export function buildLandmark(l: Landmark): THREE.Group {
  return BUILDERS[l.type](l);
}
