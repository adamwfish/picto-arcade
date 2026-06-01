/**
 * Robo Picto Space Runner: Boston — core engine.
 *
 * Owns the Three.js renderer/scene, the world, the ship, the chase camera,
 * input, audio, and all entities. Runs a single fixed-ish rAF loop that drives
 * the active game mode and publishes a live HUD snapshot the React layer reads.
 */

import * as THREE from 'three';
import { FLIGHT, GRAIL, PALETTE, hex } from './constants';
import type { GameMode, GamePhase, HudState, RunResult } from './types';
import { World } from './world/World';
import { Ship } from './ship/Ship';
import { Input } from './systems/Input';
import { ChaseCamera } from './systems/ChaseCamera';
import { Audio } from './audio/Audio';
import { Comic, randomRarity } from './entities/Comic';
import { Obstacle } from './entities/Obstacle';
import { comicSpawnPoints, obstacleSpawns } from './systems/spawn';

interface ModeConfig {
  timeLimit: number; // seconds; 0 => no limit
  timeIsElapsed: boolean;
  comics: number;
  obstacles: number;
  usesCheckpoints: boolean;
  showPosition: boolean;
}

const MODE_CONFIG: Record<GameMode, ModeConfig> = {
  story: { timeLimit: 160, timeIsElapsed: false, comics: 70, obstacles: 46, usesCheckpoints: true, showPosition: true },
  timetrial: { timeLimit: 0, timeIsElapsed: true, comics: 40, obstacles: 40, usesCheckpoints: true, showPosition: false },
  comichunt: { timeLimit: 90, timeIsElapsed: false, comics: 120, obstacles: 30, usesCheckpoints: false, showPosition: false },
  endless: { timeLimit: 0, timeIsElapsed: true, comics: 90, obstacles: 50, usesCheckpoints: false, showPosition: false },
};

const CHECKPOINT_RADIUS = 30;
const SHIP_RADIUS = 2.6;

export interface GameCallbacks {
  onPhase?: (phase: GamePhase) => void;
  onResult?: (result: RunResult) => void;
  onGrailActivate?: () => void;
  onCrash?: () => void;
}

export class Game {
  readonly hud: HudState = {
    speed: 0,
    position: 1,
    totalRacers: 6,
    comics: 0,
    grail: 0,
    grailActive: false,
    timeLeft: 0,
    timeIsElapsed: false,
    score: 0,
    multiplier: 1,
    lap: 1,
    totalLaps: 1,
    checkpoint: 0,
    totalCheckpoints: 0,
    altitude: 0,
  };

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private world: World;
  private ship = new Ship();
  private cam: ChaseCamera;
  private input = new Input();
  readonly audio = new Audio();
  private cb: GameCallbacks;

  private comics: Comic[] = [];
  private obstacles: Obstacle[] = [];
  private comicGroup = new THREE.Group();
  private obstacleGroup = new THREE.Group();
  private checkpointMarker: THREE.Mesh;

  private phase: GamePhase = 'title';
  private mode: GameMode = 'story';
  private config: ModeConfig = MODE_CONFIG.story;

  // Flight state.
  private pos = new THREE.Vector3();
  private quat = new THREE.Quaternion();
  private yaw = 0;
  private pitch = 0;
  private speed: number = FLIGHT.baseSpeed;

  // Run state.
  private clockT = 0; // total animation time
  private runTime = 0; // elapsed in current run
  private timeLeft = 0;
  private grail = 0;
  private grailActive = false;
  private grailTimer = 0;
  private comicCount = 0;
  private score = 0;
  private streak = 0;
  private invuln = 0;
  private cpIndex = 0;
  private rivals: number[] = [];
  private countdown = 0;

  private last = performance.now();
  private raf = 0;
  private disposed = false;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks = {}) {
    this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    this.renderer.setClearColor(hex(PALETTE.sky), 1);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene.fog = new THREE.Fog(hex(PALETTE.sky), 500, 1300);

    this.world = new World();
    this.scene.add(this.world.root);
    this.scene.add(this.ship.root);
    this.scene.add(this.comicGroup);
    this.scene.add(this.obstacleGroup);

    this.setupLights();

    // Glowing checkpoint gate marker (a comic-gold ring).
    this.checkpointMarker = new THREE.Mesh(
      new THREE.TorusGeometry(CHECKPOINT_RADIUS, 2.4, 8, 32),
      new THREE.MeshBasicMaterial({ color: hex(PALETTE.gold), transparent: true, opacity: 0.85 }),
    );
    this.checkpointMarker.visible = false;
    this.scene.add(this.checkpointMarker);

    this.cam = new ChaseCamera(canvas.clientWidth / Math.max(1, canvas.clientHeight));

    this.ship.setVisible(false); // hidden until a run starts (title shows the city)
    this.input.attach();
    this.input.onPause = () => this.togglePause();
    this.input.onMute = () => this.audio.toggleMute();
    this.input.onBoostPress = () => this.tryGrail();

    window.addEventListener('resize', this.onResize);
    this.resetTitleCamera();
    this.loop(this.last);
  }

  // ---------- setup ----------
  private setupLights(): void {
    const hemi = new THREE.HemisphereLight(hex(PALETTE.white), hex(PALETTE.cream), 0.9);
    this.scene.add(hemi);
    const sun = new THREE.DirectionalLight(hex(PALETTE.white), 1.1);
    sun.position.set(120, 200, 80);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const s = 260;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.camera.far = 600;
    this.scene.add(sun);
    this.scene.add(sun.target);
  }

  private resetTitleCamera(): void {
    // Slow orbit over downtown for the title screen.
    this.pos.set(60, 70, 120);
    this.cam.camera.position.set(120, 90, 160);
  }

  private onResize = () => {
    const canvas = this.renderer.domElement;
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.cam.resize(w / Math.max(1, h));
  };

  // ---------- run lifecycle ----------
  startRun(mode: GameMode): void {
    this.mode = mode;
    this.config = MODE_CONFIG[mode];
    this.audio.resume();
    this.audio.startMusic();

    this.spawnEntities();

    // Reset flight & run state.
    const start = this.world.startPosition();
    this.pos.copy(start);
    this.cpIndex = 0;
    // Aim toward the first checkpoint.
    const aimTarget = this.config.usesCheckpoints ? this.world.checkpoints[0] : new THREE.Vector3(start.x - 100, start.y, start.z - 100);
    this.yaw = Math.atan2(aimTarget.x - start.x, aimTarget.z - start.z) + Math.PI;
    this.pitch = 0;
    this.speed = FLIGHT.baseSpeed;
    this.runTime = 0;
    this.timeLeft = this.config.timeLimit;
    this.grail = 0;
    this.grailActive = false;
    this.grailTimer = 0;
    this.comicCount = 0;
    this.score = 0;
    this.streak = 0;
    this.invuln = 0;
    this.countdown = 3;
    this.rivals = this.config.showPosition ? [0.04, 0.02, 0.06, 0.03, 0.05] : [];

    this.updateQuat();
    this.ship.root.position.copy(this.pos);
    this.ship.root.quaternion.copy(this.quat);
    this.ship.setVisible(true);
    this.cam.snap(this.pos, this.quat);

    this.hud.totalLaps = 1;
    this.hud.lap = 1;
    this.hud.totalCheckpoints = this.world.checkpoints.length;
    this.hud.timeIsElapsed = this.config.timeIsElapsed;
    this.hud.totalRacers = this.rivals.length + 1;
    this.updateCheckpointMarker();

    this.setPhase('countdown');
  }

  private spawnEntities(): void {
    // Clear previous.
    this.clearEntities();
    const route = this.world.checkpoints;

    for (const p of comicSpawnPoints(route, this.config.comics, this.mode.length * 17 + 3)) {
      const c = new Comic(randomRarity(), p);
      this.comics.push(c);
      this.comicGroup.add(c.root);
    }
    for (const s of obstacleSpawns(route, this.config.obstacles, this.mode.length * 31 + 7)) {
      const o = new Obstacle(s.kind, s.position);
      this.obstacles.push(o);
      this.obstacleGroup.add(o.root);
    }
  }

  private clearEntities(): void {
    for (const c of this.comics) this.comicGroup.remove(c.root);
    for (const o of this.obstacles) this.obstacleGroup.remove(o.root);
    this.comics = [];
    this.obstacles = [];
  }

  togglePause(): void {
    if (this.phase === 'playing') this.setPhase('paused');
    else if (this.phase === 'paused') this.setPhase('playing');
  }

  resume(): void {
    if (this.phase === 'paused') this.setPhase('playing');
  }

  restart(): void {
    this.startRun(this.mode);
  }

  quitToTitle(): void {
    this.audio.stopMusic();
    this.ship.setVisible(false);
    this.checkpointMarker.visible = false;
    this.clearEntities();
    this.resetTitleCamera();
    this.setPhase('title');
  }

  private setPhase(p: GamePhase): void {
    this.phase = p;
    this.cb.onPhase?.(p);
  }

  // ---------- grail ----------
  private tryGrail(): void {
    if (this.phase !== 'playing') return;
    if (this.grail >= 1 && !this.grailActive) {
      this.grailActive = true;
      this.grailTimer = GRAIL.duration;
      this.grail = 1;
      this.audio.grailActivate();
      this.cb.onGrailActivate?.();
      this.cam.addShake(0.6);
    }
  }

  // ---------- main loop ----------
  private loop = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.clockT += dt;

    this.update(dt);
    this.renderer.render(this.scene, this.cam.camera);
    this.raf = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    // Always animate world ambiance.
    this.ship.update(dt, this.clockT);
    for (const c of this.comics) c.update(dt, this.clockT);
    for (const o of this.obstacles) o.update(dt, this.clockT);

    if (this.phase === 'title' || this.phase === 'modeselect' || this.phase === 'loading') {
      this.updateTitleCamera(dt);
      return;
    }
    if (this.phase === 'results') {
      // Gentle drift while showing results.
      this.cam.update(dt, this.pos, this.quat, 0.3, false);
      return;
    }
    if (this.phase === 'paused') {
      this.publishHud();
      return;
    }
    if (this.phase === 'countdown') {
      this.countdown -= dt;
      this.cam.update(dt, this.pos, this.quat, 0, false);
      this.publishHud();
      if (this.countdown <= 0) {
        this.setPhase('playing');
        this.audio.checkpoint();
      }
      return;
    }

    // ---- playing ----
    this.runTime += dt;
    this.stepFlight(dt);
    this.stepGrail(dt);
    this.stepCollisions(dt);
    if (this.config.usesCheckpoints) this.stepCheckpoints();
    this.stepTimer(dt);
    if (this.config.showPosition) this.stepRivals(dt);

    const speed01 = (this.speed - FLIGHT.minSpeed) / (FLIGHT.boostSpeed - FLIGHT.minSpeed);
    this.cam.update(dt, this.pos, this.quat, THREE.MathUtils.clamp(speed01, 0, 1), this.grailActive);
    this.publishHud();
  }

  private updateTitleCamera(dt: number): void {
    const t = this.clockT * 0.1;
    const target = new THREE.Vector3(Math.cos(t) * 170, 95, Math.sin(t) * 170);
    this.cam.camera.position.lerp(target, 1 - Math.exp(-1.5 * dt));
    this.cam.camera.lookAt(0, 20, 0);
  }

  private updateQuat(): void {
    const e = new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ');
    this.quat.setFromEuler(e);
  }

  private stepFlight(dt: number): void {
    const inp = this.input.poll();

    // Throttle → target speed; boost/grail overrides.
    let targetSpeed = FLIGHT.baseSpeed + inp.throttle * 40;
    if (this.grailActive) targetSpeed = FLIGHT.boostSpeed;
    if (inp.brake) targetSpeed = FLIGHT.minSpeed;
    targetSpeed = THREE.MathUtils.clamp(targetSpeed, FLIGHT.minSpeed, this.grailActive ? FLIGHT.boostSpeed : FLIGHT.maxSpeed);

    const rate = targetSpeed > this.speed ? FLIGHT.accel : FLIGHT.brakeDecel;
    this.speed += THREE.MathUtils.clamp(targetSpeed - this.speed, -rate * dt, rate * dt);

    // Steering & pitch.
    this.yaw -= inp.steer * FLIGHT.turnRate * dt;
    this.pitch += inp.pitch * FLIGHT.pitchRate * dt;
    this.pitch = THREE.MathUtils.clamp(this.pitch, -0.6, 0.6);
    // Auto-level pitch gently.
    this.pitch *= 1 - Math.min(1, dt * 0.8);
    this.updateQuat();

    // Forward motion along -Z of the ship.
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quat);
    this.pos.addScaledVector(forward, this.speed * dt);
    // Pitch input adds vertical lift (climb/dive).
    this.pos.y += inp.pitch * FLIGHT.liftRate * dt;

    // Clamp altitude & keep over the map.
    this.pos.y = THREE.MathUtils.clamp(this.pos.y, FLIGHT.minAltitude, FLIGHT.maxAltitude);
    const flatDist = Math.hypot(this.pos.x, this.pos.z);
    if (flatDist > 820) {
      const k = 820 / flatDist;
      this.pos.x *= k;
      this.pos.z *= k;
      this.speed = Math.max(FLIGHT.minSpeed, this.speed * 0.96);
    }

    // Visual bank toward steer.
    this.ship.setBank(-inp.steer * FLIGHT.rollVisual, dt, FLIGHT.bankReturn);
    this.ship.setThrust(
      (this.speed - FLIGHT.minSpeed) / (FLIGHT.maxSpeed - FLIGHT.minSpeed),
      this.grailActive || inp.boost,
    );

    this.ship.root.position.copy(this.pos);
    this.ship.root.quaternion.copy(this.quat);

    if (this.invuln > 0) this.invuln -= dt;
  }

  private stepGrail(dt: number): void {
    if (this.grailActive) {
      this.grailTimer -= dt;
      this.grail = Math.max(0, this.grailTimer / GRAIL.duration);
      if (this.grailTimer <= 0) {
        this.grailActive = false;
        this.grail = 0;
      }
    }
  }

  private stepCollisions(_dt: number): void {
    const shipPos = this.pos;

    // Comics.
    for (const c of this.comics) {
      if (c.collected) continue;
      if (shipPos.distanceToSquared(c.root.position) < (c.radius + SHIP_RADIUS) ** 2) {
        const pts = c.collect();
        this.streak++;
        const mult = this.currentMultiplier();
        this.score += Math.round(pts * mult * (this.grailActive ? 2 : 1));
        this.comicCount++;
        this.grail = Math.min(1, this.grail + GRAIL.perComic);
        if (this.streak > 0 && this.streak % 8 === 0) this.audio.ding();
        else this.audio.collectComic();
      }
    }

    // Obstacles.
    if (this.invuln <= 0 && !this.grailActive) {
      for (const o of this.obstacles) {
        if (shipPos.distanceToSquared(o.root.position) < (o.radius + SHIP_RADIUS) ** 2) {
          if (o.soft) {
            this.audio.pop();
            this.speed = Math.max(FLIGHT.minSpeed, this.speed * 0.78);
            this.invuln = 0.4;
          } else {
            this.crash();
          }
          break;
        }
      }
    } else if (this.grailActive) {
      // Holy Grail Mode smashes soft obstacles for bonus, ignores hard ones.
      for (const o of this.obstacles) {
        if (o.soft && o.root.visible && shipPos.distanceToSquared(o.root.position) < (o.radius + SHIP_RADIUS) ** 2) {
          o.root.visible = false;
          this.score += 50;
          this.audio.pop();
        }
      }
    }
  }

  private crash(): void {
    this.speed = FLIGHT.minSpeed;
    this.invuln = 1.4;
    this.streak = 0;
    this.cam.addShake(1.0);
    this.audio.crash();
    this.cb.onCrash?.();
    if (this.config.timeLimit > 0) this.timeLeft = Math.max(0, this.timeLeft - 4);
  }

  private currentMultiplier(): number {
    return Math.min(5, 1 + Math.floor(this.streak / 6) * 0.5);
  }

  private stepCheckpoints(): void {
    const cps = this.world.checkpoints;
    if (this.cpIndex >= cps.length) return;
    const target = cps[this.cpIndex];
    if (this.pos.distanceTo(target) < CHECKPOINT_RADIUS) {
      this.cpIndex++;
      this.audio.checkpoint();
      this.score += 200;
      if (this.cpIndex >= cps.length) {
        // Finished the route!
        this.finishRun(true);
        return;
      }
      this.updateCheckpointMarker();
    }
  }

  private updateCheckpointMarker(): void {
    const cps = this.world.checkpoints;
    if (this.config.usesCheckpoints && this.cpIndex < cps.length) {
      this.checkpointMarker.position.copy(cps[this.cpIndex]);
      this.checkpointMarker.visible = true;
    } else {
      this.checkpointMarker.visible = false;
    }
  }

  private stepTimer(dt: number): void {
    if (this.config.timeLimit > 0) {
      this.timeLeft -= dt;
      if (this.timeLeft <= 0) {
        this.timeLeft = 0;
        this.finishRun(this.mode === 'comichunt'); // comic hunt "wins" by ending; story loses on timeout
      }
    }
  }

  private stepRivals(dt: number): void {
    // Advance ghost rivals along the route as a fraction 0..1.
    for (let i = 0; i < this.rivals.length; i++) {
      this.rivals[i] += dt * (0.0072 + i * 0.0006);
    }
  }

  private playerProgress(): number {
    const total = this.world.checkpoints.length;
    if (total === 0) return 0;
    let frac = this.cpIndex / total;
    if (this.cpIndex < total) {
      const target = this.world.checkpoints[this.cpIndex];
      const prev = this.cpIndex > 0 ? this.world.checkpoints[this.cpIndex - 1] : this.world.startPosition();
      const segLen = prev.distanceTo(target) || 1;
      const done = THREE.MathUtils.clamp(1 - this.pos.distanceTo(target) / segLen, 0, 1);
      frac += done / total;
    }
    return frac;
  }

  private finishRun(won: boolean): void {
    if (this.phase === 'results') return;
    this.ship.setThrust(0.2, false);
    this.audio.stopMusic();
    if (won) this.audio.fanfare();
    else this.audio.gameOver();
    this.checkpointMarker.visible = false;
    const result: RunResult = {
      mode: this.mode,
      score: this.score,
      comics: this.comicCount,
      time: this.runTime,
      finished: true,
      won,
    };
    this.setPhase('results');
    this.cb.onResult?.(result);
  }

  // ---------- HUD ----------
  private publishHud(): void {
    const h = this.hud;
    h.speed = Math.round((this.speed / FLIGHT.maxSpeed) * 240);
    h.comics = this.comicCount;
    h.grail = this.grail;
    h.grailActive = this.grailActive;
    h.score = this.score;
    h.multiplier = this.currentMultiplier();
    h.checkpoint = Math.min(this.cpIndex, this.world.checkpoints.length);
    h.totalCheckpoints = this.world.checkpoints.length;
    h.altitude = Math.round(this.pos.y);
    h.timeIsElapsed = this.config.timeIsElapsed;
    h.timeLeft = this.config.timeIsElapsed ? this.runTime : this.timeLeft;

    if (this.config.showPosition) {
      const prog = this.playerProgress();
      let ahead = 0;
      for (const r of this.rivals) if (r > prog) ahead++;
      h.position = 1 + ahead;
      h.totalRacers = this.rivals.length + 1;
    } else {
      h.position = 1;
      h.totalRacers = 1;
    }
  }

  // expose countdown number for HUD
  getCountdown(): number {
    return Math.ceil(this.countdown);
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  setMuted(m: boolean): void {
    this.audio.setMuted(m);
  }

  /** Inject a key from on-screen / touch controls. */
  pressKey(key: string, down: boolean): void {
    this.input.setKey(key, down);
  }

  enterModeSelect(): void {
    this.setPhase('modeselect');
  }

  enterTitle(): void {
    this.setPhase('title');
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    this.input.detach();
    this.audio.dispose();
    this.world.dispose();
    this.renderer.dispose();
  }
}
