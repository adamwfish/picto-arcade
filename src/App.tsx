import { useCallback, useEffect, useRef, useState } from 'react';
import { Game } from './game/Game';
import type { GameMode, GamePhase, RunResult, ScoreEntry } from './game/types';
import { loadScores, saveScore, bestScore } from './state/leaderboard';
import { LoadingScreen } from './ui/LoadingScreen';
import { TitleScreen } from './ui/TitleScreen';
import { ModeSelect } from './ui/ModeSelect';
import { Hud } from './ui/Hud';
import { ComicFx } from './ui/ComicFx';
import { Countdown } from './ui/Countdown';
import { PauseMenu } from './ui/PauseMenu';
import { Results } from './ui/Results';
import { Leaderboard } from './ui/Leaderboard';
import { TouchControls } from './ui/TouchControls';

const BURST_WORDS = ['ZOWIE!', 'POW!', 'KABOOM!', 'WHAMM!', 'ZOOM!', 'KAPOW!'];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  const [phase, setPhase] = useState<GamePhase>('loading');
  // `loading` gates whether the title is shown yet (engine itself starts at 'title').
  const [bootDone, setBootDone] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [scores, setScores] = useState<ScoreEntry[]>(() => loadScores());
  const [muted, setMuted] = useState(false);
  const [grailActive, setGrailActive] = useState(false);
  const [burst, setBurst] = useState({ key: 0, word: 'ZOWIE!' });
  const [savedName, setSavedName] = useState('PICTO');
  const lastMode = useRef<GameMode>('story');

  // Boot the engine once the canvas is mounted.
  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new Game(canvasRef.current, {
      onPhase: (p) => {
        setPhase(p);
        setGrailActive(false);
      },
      onResult: (r) => setResult(r),
      onGrailActivate: () => {
        setGrailActive(true);
        triggerBurst('HOLY GRAIL!');
      },
      onCrash: () => triggerBurst(BURST_WORDS[Math.floor(Math.random() * BURST_WORDS.length)]),
    });
    gameRef.current = game;
    // Trigger an initial resize so the renderer matches the canvas box.
    window.dispatchEvent(new Event('resize'));
    setMuted(game.audio.isMuted());
    // The engine boots straight into its 'title' phase; mirror that into React
    // (it won't emit onPhase for its own initial state).
    setPhase(game.getPhase());

    return () => {
      game.dispose();
      gameRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the grail-active overlay in sync each frame (engine owns the truth).
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const g = gameRef.current;
      if (g) setGrailActive(g.hud.grailActive);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const triggerBurst = (word: string) => {
    setBurst((b) => ({ key: b.key + 1, word }));
  };

  const getHud = useCallback(() => gameRef.current!.hud, []);
  const getCountdown = useCallback(() => gameRef.current?.getCountdown() ?? 0, []);

  const startMode = (mode: GameMode) => {
    lastMode.current = mode;
    setResult(null);
    gameRef.current?.startRun(mode);
  };

  const toggleMute = () => {
    const m = gameRef.current?.audio.toggleMute() ?? false;
    setMuted(m);
  };

  const handleSaveScore = (name: string) => {
    if (!result) return;
    setSavedName(name);
    const entry: ScoreEntry = {
      name,
      mode: result.mode,
      score: result.score,
      comics: result.comics,
      time: result.time,
      date: Date.now(),
    };
    setScores(saveScore(entry));
  };

  // Persist endless / comic-hunt runs automatically (no name prompt for endless).
  useEffect(() => {
    if (result && result.mode === 'endless' && result.comics > 0) {
      handleSaveScore(savedName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const inRun = phase === 'playing' || phase === 'paused' || phase === 'countdown';
  const showTitle = bootDone && phase === 'title' && !showLeaderboard;

  return (
    <>
      <canvas ref={canvasRef} id="game-canvas" />

      {/* In-run HUD + comic FX */}
      {(phase === 'playing' || phase === 'paused') && <Hud getHud={getHud} />}
      {inRun && (
        <ComicFx active={grailActive && phase === 'playing'} burstKey={burst.key} burstWord={burst.word} />
      )}
      {phase === 'countdown' && <Countdown getCountdown={getCountdown} />}
      {inRun && <TouchControls press={(k, d) => gameRef.current?.pressKey(k, d)} />}

      {/* Loading → reveals the title */}
      {!bootDone && <LoadingScreen onDone={() => setBootDone(true)} />}

      {showTitle && (
        <TitleScreen
          muted={muted}
          bestStory={bestScore(scores, 'story')}
          onToggleMute={toggleMute}
          onPlay={() => {
            gameRef.current?.enterModeSelect();
          }}
          onLeaderboard={() => setShowLeaderboard(true)}
        />
      )}

      {bootDone && phase === 'modeselect' && (
        <ModeSelect
          scores={scores}
          onPick={startMode}
          onBack={() => gameRef.current?.enterTitle()}
        />
      )}

      {phase === 'paused' && (
        <PauseMenu
          muted={muted}
          onToggleMute={toggleMute}
          onResume={() => gameRef.current?.resume()}
          onRestart={() => gameRef.current?.restart()}
          onQuit={() => gameRef.current?.quitToTitle()}
        />
      )}

      {phase === 'results' && result && (
        <Results
          result={result}
          scores={scores}
          savedName={savedName}
          onSave={handleSaveScore}
          onReplay={() => startMode(lastMode.current)}
          onModeSelect={() => gameRef.current?.enterModeSelect()}
          onTitle={() => gameRef.current?.quitToTitle()}
        />
      )}

      {showLeaderboard && (
        <Leaderboard scores={scores} onBack={() => setShowLeaderboard(false)} />
      )}

      <div className="sound-badge">SOUND {muted ? 'OFF' : 'ON'} · PRESS M</div>
    </>
  );
}
