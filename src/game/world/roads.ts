/**
 * Boston's major arteries drawn as thick black-lined illustrations: a black
 * ink stroke underneath a slightly narrower pale fill, with a dashed gold
 * center line. Reads as a hand-drawn map road.
 */

import * as THREE from 'three';
import { ROADS } from '../data/boston';
import { PALETTE } from '../constants';
import { flat } from './materials';
import { projectAll, ribbonGeometry } from './geo';

export function buildRoads(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'roads';

  const inkMat = flat(PALETTE.ink);
  const fillMat = flat(PALETTE.road);
  const centerMat = flat(PALETTE.gold);

  for (const road of ROADS) {
    const pts = projectAll(road.pts);

    const ink = new THREE.Mesh(ribbonGeometry(pts, road.width + 1.2), inkMat);
    ink.position.y = 0.1;
    const fill = new THREE.Mesh(ribbonGeometry(pts, road.width), fillMat);
    fill.position.y = 0.12;
    group.add(ink, fill);

    // Dashed gold center line.
    const dash = new THREE.Mesh(ribbonGeometry(pts, 0.5), centerMat);
    dash.position.y = 0.14;
    group.add(dash);
  }

  return group;
}
