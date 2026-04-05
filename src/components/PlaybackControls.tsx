import type { PlaybackStatus } from '../types';

interface PlaybackControlsProps {
  status: PlaybackStatus;
  currentIndex: number;
  totalTokens: number;
  effectiveWpm: number;
  onTogglePlayback: () => void;
  onRewind: () => void;
  onSkipSentence: () => void;
  onSeek: (index: number) => void;
  onNudgeWpm: (delta: number) => void;
  onSetWpm: (wpm: number) => void;
}

function formatTimeRemaining(wordsLeft: number, wpm: number): string {
  if (wpm === 0) return '--:--';
  const seconds = Math.ceil((wordsLeft / wpm) * 60);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlaybackControls({
  status,
  currentIndex,
  totalTokens,
  effectiveWpm,
  onTogglePlayback,
  onRewind,
  onSkipSentence,
  onSeek,
  onNudgeWpm,
  onSetWpm,
}: PlaybackControlsProps) {
  const wordsLeft = Math.max(0, totalTokens - currentIndex);
  const timeRemaining = formatTimeRemaining(wordsLeft, effectiveWpm);

  return (
    <div className="playback-controls">
      <div className="playback-controls__bar">
        <button
          className="playback-btn"
          onClick={onRewind}
          title="Rewind 5s (←)"
        >
          ⏪
        </button>

        <button
          className="playback-btn playback-btn--main"
          onClick={onTogglePlayback}
          title="Play/Pause (Space)"
        >
          {status === 'playing' ? '⏸' : '▶'}
        </button>

        <button
          className="playback-btn"
          onClick={onSkipSentence}
          title="Skip sentence (→)"
        >
          ⏩
        </button>
      </div>

      <input
        type="range"
        className="playback-scrubber"
        min={0}
        max={totalTokens}
        value={currentIndex}
        onChange={(e) => onSeek(Number(e.target.value))}
      />

      <div className="playback-controls__info">
        <div className="playback-wpm">
          <button className="wpm-btn" onClick={() => onNudgeWpm(-25)} title="−25 WPM (↓)">−</button>
          <span className="wpm-display">{effectiveWpm}</span>
          <button className="wpm-btn" onClick={() => onNudgeWpm(25)} title="+25 WPM (↑)">+</button>
        </div>

        <input
          type="range"
          className="wpm-slider"
          min={100}
          max={1000}
          step={25}
          value={effectiveWpm}
          onChange={(e) => onSetWpm(Number(e.target.value))}
          title={`${effectiveWpm} WPM (↑/↓ arrows)`}
        />

        <div className="playback-progress">
          {currentIndex} / {totalTokens} · {timeRemaining}
        </div>
      </div>
    </div>
  );
}
