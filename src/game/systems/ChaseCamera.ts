/**
 * Third-person chase camera, Star Fox / F-Zero style: rides behind and above
 * the ship, smoothly lerping into place and widening its FOV during boost for
 * that "everything-rushes-at-you" arcade kick.
 */

import * as THREE from 'three';
import { CAMERA } from '../constants';

export class ChaseCamera {
  readonly camera: THREE.PerspectiveCamera;
  private desiredPos = new THREE.Vector3();
  private currentLook = new THREE.Vector3();
  private shake = 0;

  constructor(aspect: number) {
    this.camera = new THREE.PerspectiveCamera(CAMERA.fov, aspect, 0.5, 3000);
    this.camera.position.set(0, 30, 60);
  }

  resize(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  addShake(amount: number): void {
    this.shake = Math.min(1.2, this.shake + amount);
  }

  /** Snap directly behind the ship (used on (re)spawn so we don't swoop in). */
  snap(shipPos: THREE.Vector3, shipQuat: THREE.Quaternion): void {
    this.computeDesired(shipPos, shipQuat);
    this.camera.position.copy(this.desiredPos);
    this.currentLook.copy(shipPos);
  }

  private computeDesired(shipPos: THREE.Vector3, shipQuat: THREE.Quaternion): void {
    const back = new THREE.Vector3(0, CAMERA.height, CAMERA.distance).applyQuaternion(shipQuat);
    this.desiredPos.copy(shipPos).add(back);
  }

  update(dt: number, shipPos: THREE.Vector3, shipQuat: THREE.Quaternion, speed01: number, boosting: boolean): void {
    this.computeDesired(shipPos, shipQuat);
    const k = 1 - Math.exp(-CAMERA.stiffness * dt);
    this.camera.position.lerp(this.desiredPos, k);

    // Look a bit ahead of the ship along its forward (-Z) axis.
    const ahead = new THREE.Vector3(0, 2, -CAMERA.lookAhead).applyQuaternion(shipQuat).add(shipPos);
    this.currentLook.lerp(ahead, 1 - Math.exp(-CAMERA.rotStiffness * dt));

    // Camera shake (boost / crash).
    if (this.shake > 0.001) {
      const s = this.shake * 1.4;
      this.camera.position.x += (Math.random() - 0.5) * s;
      this.camera.position.y += (Math.random() - 0.5) * s;
      this.shake = Math.max(0, this.shake - dt * 2.5);
    }

    this.camera.lookAt(this.currentLook);

    // Speed-reactive FOV.
    const targetFov = THREE.MathUtils.lerp(CAMERA.fov, CAMERA.boostFov, boosting ? 1 : speed01 * 0.5);
    this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 4);
    this.camera.updateProjectionMatrix();
  }
}
