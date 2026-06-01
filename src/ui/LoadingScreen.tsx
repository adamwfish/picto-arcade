import { useEffect, useState } from 'react';

interface Props {
  onDone: () => void;
}

const TIPS = [
  'TIP: Hold SPACE to unleash HOLY GRAIL MODE when the meter is full!',
  'TIP: Chain comic pickups without crashing to crank your multiplier.',
  'TIP: SHIFT brakes hard — tap it to thread the cranes.',
  'TIP: Golden Age books are rare and worth a fortune. Grab them all!',
  'TIP: Fly the gold gates in order to tour all of Boston.',
];

/** Comic-style loading screen with a striped progress bar and a rotating tip. */
export function LoadingScreen({ onDone }: Props) {
  const [pct, setPct] = useState(0);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  useEffect(() => {
    let p = 0;
    const id = setInterval(() => {
      p = Math.min(100, p + 6 + Math.random() * 12);
      setPct(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(onDone, 350);
      }
    }, 120);
    return () => clearInterval(id);
  }, [onDone]);

  return (
    <div className="overlay halftone">
      <div className="title-badge">NOW LOADING</div>
      <h1 className="comic-title" style={{ fontSize: 'clamp(34px,7vw,72px)' }}>
        SPACE RUNNER
      </h1>
      <p className="comic-sub" style={{ fontSize: 'clamp(18px,4vw,34px)' }}>
        BOSTON
      </p>
      <div className="loading-bar-track" role="progressbar" aria-valuenow={Math.round(pct)}>
        <div className="loading-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <p className="title-hint" style={{ maxWidth: 460 }}>{tip}</p>
    </div>
  );
}
