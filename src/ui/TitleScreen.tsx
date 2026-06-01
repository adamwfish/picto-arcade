interface Props {
  onPlay: () => void;
  onLeaderboard: () => void;
  muted: boolean;
  onToggleMute: () => void;
  bestStory: number;
}

/**
 * Animated title screen. The live 3D city slowly orbits behind it (rendered by
 * the engine); this overlay is the comic-cover treatment on top.
 */
export function TitleScreen({ onPlay, onLeaderboard, muted, onToggleMute, bestStory }: Props) {
  return (
    <div className="overlay">
      <div className="title-stack">
        <div className="title-badge">ROBO PICTO PRESENTS</div>
        <h1 className="comic-title title-main">SPACE RUNNER</h1>
        <div className="title-boston">★ BOSTON ★</div>
        <div className="title-buttons">
          <button className="comic-btn" onClick={onPlay}>
            PLAY
          </button>
          <button className="comic-btn alt" onClick={onLeaderboard}>
            HIGH SCORES
          </button>
          <button className="comic-btn ghost" onClick={onToggleMute}>
            {muted ? 'SOUND: OFF' : 'SOUND: ON'}
          </button>
        </div>
        {bestStory > 0 && (
          <div className="title-hint">STORY BEST: {bestStory.toLocaleString()}</div>
        )}
        <div className="title-hint">
          WASD / ARROWS STEER · SPACE BOOST &amp; HOLY GRAIL · SHIFT BRAKE · P PAUSE · M MUTE
        </div>
      </div>
    </div>
  );
}
