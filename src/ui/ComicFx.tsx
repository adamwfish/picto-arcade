import { useEffect, useRef, useState } from 'react';

interface Props {
  /** Whether Holy Grail Mode (speed lines + tint) is active. */
  active: boolean;
  /** Increment this counter to trigger a one-shot starburst word. */
  burstKey: number;
  burstWord: string;
}

/**
 * Comic-book screen FX: rotating speed lines + warm tint while Holy Grail Mode
 * is on, plus a one-shot hand-lettered starburst ("ZOWIE!", "POW!") on demand.
 */
export function ComicFx({ active, burstKey, burstWord }: Props) {
  const [show, setShow] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (burstKey === 0) return;
    setShow(false);
    // Force reflow so the animation restarts each trigger.
    requestAnimationFrame(() => setShow(true));
    if (timer.current) clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setShow(false), 700);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [burstKey]);

  return (
    <>
      <div className={`fx-overlay ${active ? 'on' : ''}`}>
        <div className="speed-lines" />
        <div className="grail-tint" />
      </div>
      <div className={`burst ${show ? 'go' : ''}`}>{burstWord}</div>
    </>
  );
}
