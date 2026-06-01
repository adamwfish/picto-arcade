/**
 * The Charles River + inner harbor as flat comic-blue coloring. No textures,
 * no reflections — just bold shapes with a darker outline lip, matching the
 * "flat blue comic coloring" direction.
 */

import * as THREE from 'three';
import { CHARLES_RIVER, HARBOR } from '../data/boston';
import { PALETTE } from '../constants';
import { flat } from './materials';
import { projectAll, ribbonGeometry, polygonGeometry } from './geo';

export function buildWater(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'water';

  const waterMat = flat(PALETTE.water);
  const lipMat = flat(PALETTE.waterDeep);

  // Harbor polygon, slightly below ground level so banks read as outlines.
  const harborPts = projectAll(HARBOR);
  const harbor = new THREE.Mesh(polygonGeometry(harborPts), waterMat);
  harbor.position.y = 0.05;
  harbor.renderOrder = 1;
  group.add(harbor);

  // Charles River ribbon. A wider dark lip underneath fakes a thick outline.
  const river = projectAll(CHARLES_RIVER);
  const lip = new THREE.Mesh(ribbonGeometry(river, 16), lipMat);
  lip.position.y = 0.06;
  const flow = new THREE.Mesh(ribbonGeometry(river, 13), waterMat);
  flow.position.y = 0.08;
  group.add(lip, flow);

  // A few flat "comic ripple" dashes along the river for life.
  const rippleMat = flat(PALETTE.blueLight, { transparent: true, opacity: 0.7 });
  for (let i = 1; i < river.length - 1; i += 1) {
    const p = river[i];
    const ripple = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.7), rippleMat);
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(p.x + (i % 2 ? 2 : -2), 0.12, p.z);
    group.add(ripple);
  }

  return group;
}
