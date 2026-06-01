import { useEffect, useRef, useState } from 'react';

interface Props {
  getCountdown: () => number;
}

/** Big comic "3·2·1·GO!" overlay during the countdown phase. */
export function Countdown({ getCountdown }: Props) {
  const [n, setN] = useState(getCountdown());
  const prev = useRef(n);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = getCountdown();
      if (v !== prev.current) {
        prev.current = v;
        setN(v);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [getCountdown]);

  const label = n <= 0 ? 'GO!' : String(n);
  return (
    <div className="countdown">
      <span key={label}>{label}</span>
    </div>
  );
}
