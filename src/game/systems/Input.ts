/**
 * Keyboard input for the racer. WASD + arrows steer/throttle, Space boosts,
 * Shift brakes, P/Esc pause, M mutes. Exposes a simple polled snapshot the
 * physics step reads each frame plus one-shot edge callbacks.
 */

export interface InputState {
  throttle: number; // -1 (back) .. 1 (forward) from W/S
  steer: number; // -1 (left) .. 1 (right) from A/D
  pitch: number; // -1 (down) .. 1 (up) from Up/Down arrows
  boost: boolean;
  brake: boolean;
}

export class Input {
  private keys = new Set<string>();
  readonly state: InputState = { throttle: 0, steer: 0, pitch: 0, boost: false, brake: false };
  onPause?: () => void;
  onMute?: () => void;
  onBoostPress?: () => void;
  private boostWasDown = false;
  private attached = false;

  private keydown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    this.keys.add(k);
    if (k === 'p' || k === 'escape') this.onPause?.();
    if (k === 'm') this.onMute?.();
  };
  private keyup = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase());
  };
  private blur = () => this.keys.clear();

  attach(): void {
    if (this.attached) return;
    window.addEventListener('keydown', this.keydown, { passive: false });
    window.addEventListener('keyup', this.keyup);
    window.addEventListener('blur', this.blur);
    this.attached = true;
  }

  detach(): void {
    window.removeEventListener('keydown', this.keydown);
    window.removeEventListener('keyup', this.keyup);
    window.removeEventListener('blur', this.blur);
    this.attached = false;
  }

  private has(...k: string[]): boolean {
    return k.some((key) => this.keys.has(key));
  }

  /** Recompute the polled snapshot. Call once per frame before physics. */
  poll(): InputState {
    const s = this.state;
    s.throttle = (this.has('w') ? 1 : 0) - (this.has('s') ? 1 : 0);
    s.steer = (this.has('d', 'arrowright') ? 1 : 0) - (this.has('a', 'arrowleft') ? 1 : 0);
    s.pitch = (this.has('arrowup') ? 1 : 0) - (this.has('arrowdown') ? 1 : 0);
    s.boost = this.has(' ');
    s.brake = this.has('shift');

    if (s.boost && !this.boostWasDown) this.onBoostPress?.();
    this.boostWasDown = s.boost;
    return s;
  }

  /** Programmatic key injection for on-screen / touch controls. */
  setKey(key: string, down: boolean): void {
    if (down) this.keys.add(key);
    else this.keys.delete(key);
  }
}
