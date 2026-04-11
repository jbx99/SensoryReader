import { useState } from 'react';
import { useScreenRecorder } from '../hooks/useScreenRecorder';

const DURATION_OPTIONS = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
];

export function RecordButton() {
  const rec = useScreenRecorder();
  const [menuOpen, setMenuOpen] = useState(false);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  // Countdown overlay
  if (rec.state === 'countdown') {
    return (
      <div className="rec-countdown-overlay">
        <div className="rec-countdown-number">{rec.elapsed}</div>
      </div>
    );
  }

  // Recording indicator
  if (rec.state === 'recording') {
    return (
      <div className="rec-bar">
        <span className="rec-dot" />
        <span className="rec-time">{formatTime(rec.elapsed)} / {formatTime(rec.maxDuration)}</span>
        <button className="rec-stop-btn" onClick={rec.stop}>
          Stop
        </button>
      </div>
    );
  }

  // Done — preview + download
  if (rec.state === 'done' && rec.videoUrl) {
    return (
      <div className="rec-done-panel">
        <video
          className="rec-preview"
          src={rec.videoUrl}
          controls
          playsInline
          muted
        />
        <p className="rec-done-hint">
          Drag and drop the file into a GitHub README or issue to embed it.
        </p>
        <div className="rec-done-actions">
          <button className="rec-action-btn rec-action-btn--primary" onClick={rec.download}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            Download
          </button>
          <button className="rec-action-btn" onClick={rec.discard}>
            Discard
          </button>
        </div>
      </div>
    );
  }

  // Idle — record button with duration picker
  return (
    <div className="rec-trigger">
      <button
        className="toolbar-btn rec-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        title="Record clip"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9"/>
          <circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>

      {menuOpen && (
        <div className="rec-menu">
          <div className="rec-menu__title">Record clip</div>
          {DURATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className="rec-menu__item"
              onClick={() => {
                setMenuOpen(false);
                rec.start(opt.value);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
