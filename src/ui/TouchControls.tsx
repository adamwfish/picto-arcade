import type { PointerEvent } from 'react';

interface Props {
  press: (key: string, down: boolean) => void;
}

/** On-screen controls for coarse-pointer (touch) devices. */
export function TouchControls({ press }: Props) {
  const bind = (key: string) => ({
    onPointerDown: (e: PointerEvent) => {
      e.preventDefault();
      press(key, true);
    },
    onPointerUp: (e: PointerEvent) => {
      e.preventDefault();
      press(key, false);
    },
    onPointerLeave: () => press(key, false),
    onPointerCancel: () => press(key, false),
  });

  return (
    <div className="touch-controls">
      <div className="touch-pad left">
        <button className="touch-btn tb-up" {...bind('arrowup')}>▲</button>
        <button className="touch-btn tb-left" {...bind('a')}>◀</button>
        <button className="touch-btn tb-down" {...bind('arrowdown')}>▼</button>
        <button className="touch-btn tb-right" {...bind('d')}>▶</button>
      </div>
      <div className="touch-pad right">
        <button className="touch-btn big" {...bind(' ')}>BOOST</button>
        <button className="touch-btn big" {...bind('shift')}>BRAKE</button>
      </div>
    </div>
  );
}
