interface Props {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  muted: boolean;
  onToggleMute: () => void;
}

export function PauseMenu({ onResume, onRestart, onQuit, muted, onToggleMute }: Props) {
  return (
    <div className="overlay dim">
      <div className="comic-panel" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <h2 className="comic-title" style={{ fontSize: 'clamp(34px,6vw,62px)' }}>
          PAUSED
        </h2>
        <button className="comic-btn" onClick={onResume}>RESUME</button>
        <button className="comic-btn alt" onClick={onRestart}>RESTART</button>
        <button className="comic-btn ghost" onClick={onToggleMute}>{muted ? 'SOUND: OFF' : 'SOUND: ON'}</button>
        <button className="comic-btn ghost" onClick={onQuit}>QUIT TO TITLE</button>
      </div>
    </div>
  );
}
