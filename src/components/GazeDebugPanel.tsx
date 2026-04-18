import { useState, useEffect, useRef, useCallback } from 'react';
import type { GazeDebugInfo, GazeState, GazeDirection, CalibrationData } from '../hooks/useGazeDetection';

interface GazeDebugPanelProps {
  gazeState: GazeState;
  gazePresent: boolean;
  gazeDirection: GazeDirection;
  debug: GazeDebugInfo;
  error: string | null;
  tolerance: number;
  videoElement: HTMLVideoElement | null;
  calibration: CalibrationData;
  onClose: () => void;
  onRestart: () => void;
  onCalibrate: () => void;
}

const DIRECTION_LABELS: Record<GazeDirection, string> = {
  center: 'Center',
  left: 'Left',
  right: 'Right',
  up: 'Up',
  down: 'Down',
  away: 'Away',
};

const DIRECTION_COLORS: Record<GazeDirection, string> = {
  center: '#2ecc71',
  left: '#3498db',
  right: '#3498db',
  up: '#9b59b6',
  down: '#9b59b6',
  away: '#e74c3c',
};

/** Small crosshair widget showing where the iris is pointing */
function GazeReticle({ irisOffset, direction }: { irisOffset: { x: number; y: number } | null; direction: GazeDirection }) {
  const cx = irisOffset ? 24 + irisOffset.x * 18 : 24;
  const cy = irisOffset ? 24 + irisOffset.y * 18 : 24;
  const color = DIRECTION_COLORS[direction];

  return (
    <svg width="48" height="48" viewBox="0 0 48 48" style={{ display: 'block' }}>
      {/* Outer ring */}
      <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
      {/* Crosshairs */}
      <line x1="24" y1="4" x2="24" y2="44" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
      {/* Center dot */}
      <circle cx="24" cy="24" r="2" fill="rgba(255,255,255,0.2)" />
      {/* Iris position */}
      {irisOffset && (
        <circle cx={cx} cy={cy} r="5" fill={color} opacity="0.9">
          <animate attributeName="r" values="5;6;5" dur="1.5s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export function GazeDebugPanel({
  gazeState,
  gazePresent,
  gazeDirection,
  debug,
  error,
  tolerance,
  videoElement,
  calibration,
  onClose,
  onRestart,
  onCalibrate,
}: GazeDebugPanelProps) {
  const [showVideo, setShowVideo] = useState(true);
  const videoMirrorRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  // Drag state
  const panelRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.gaze-debug-close')) return;
    if (!target.closest('.gaze-debug-header')) return;

    e.preventDefault();
    const panel = panelRef.current;
    if (!panel) return;

    const rect = panel.getBoundingClientRect();
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: rect.left,
      originY: rect.top,
    };
    panel.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: dragRef.current.originX + dx,
      y: dragRef.current.originY + dy,
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  // Mirror the webcam video into our canvas
  useEffect(() => {
    if (!showVideo || gazeState !== 'tracking' || !videoElement) return;

    const drawFrame = () => {
      const canvas = videoMirrorRef.current;
      if (canvas && videoElement.videoWidth > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 320;
          canvas.height = (videoElement.videoHeight / videoElement.videoWidth) * 320;
          // Mirror horizontally
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(videoElement, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();

          // Draw face bounding box
          if (debug.lastFace) {
            const scaleX = canvas.width / videoElement.videoWidth;
            const scaleY = canvas.height / videoElement.videoHeight;
            const fx = canvas.width - (debug.lastFace.x + debug.lastFace.w) * scaleX;
            const fy = debug.lastFace.y * scaleY;
            const fw = debug.lastFace.w * scaleX;
            const fh = debug.lastFace.h * scaleY;

            ctx.strokeStyle = DIRECTION_COLORS[debug.gazeDirection];
            ctx.lineWidth = 2;
            ctx.strokeRect(fx, fy, fw, fh);

            // Direction label on the face box
            ctx.fillStyle = DIRECTION_COLORS[debug.gazeDirection];
            ctx.font = 'bold 12px monospace';
            ctx.fillText(DIRECTION_LABELS[debug.gazeDirection], fx + 4, fy - 4);
          }
        }
      }
      rafRef.current = requestAnimationFrame(drawFrame);
    };

    rafRef.current = requestAnimationFrame(drawFrame);
    return () => cancelAnimationFrame(rafRef.current);
  }, [showVideo, gazeState, videoElement, debug.lastFace, debug.gazeDirection]);

  const stateLabel: Record<GazeState, string> = {
    inactive: 'Inactive',
    initializing: 'Loading model...',
    tracking: 'Tracking',
    error: 'Error',
  };

  const stateColor: Record<GazeState, string> = {
    inactive: '#888',
    initializing: '#f39c12',
    tracking: '#2ecc71',
    error: '#e74c3c',
  };

  return (
    <div
      ref={panelRef}
      className="gaze-debug-panel"
      style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <div className="gaze-debug-header" style={{ cursor: 'grab' }}>
        <span className="gaze-debug-title">Eye Tracking Debug</span>
        <button className="gaze-debug-close" onClick={onClose}>&times;</button>
      </div>

      {/* Camera preview */}
      {showVideo && gazeState === 'tracking' && videoElement && (
        <canvas ref={videoMirrorRef} className="gaze-debug-video" />
      )}

      {/* Gaze direction + reticle */}
      {gazeState === 'tracking' && (
        <div className="gaze-debug-section" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <GazeReticle irisOffset={debug.irisOffset} direction={debug.gazeDirection} />
          <div style={{ flex: 1 }}>
            <div className="gaze-debug-row">
              <span className="gaze-debug-label">Gaze</span>
              <span style={{ color: DIRECTION_COLORS[gazeDirection], fontWeight: 600 }}>
                {DIRECTION_LABELS[gazeDirection]}
              </span>
            </div>
            <div className="gaze-debug-row">
              <span className="gaze-debug-label">Presence</span>
              <span style={{ color: gazePresent ? '#2ecc71' : '#e74c3c' }}>
                {gazePresent ? 'Looking at screen' : 'Looking away'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Status section */}
      <div className="gaze-debug-section">
        <div className="gaze-debug-row">
          <span className="gaze-debug-label">State</span>
          <span style={{ color: stateColor[gazeState] }}>{stateLabel[gazeState]}</span>
        </div>
        <div className="gaze-debug-row">
          <span className="gaze-debug-label">Method</span>
          <span>{debug.method ?? '—'}</span>
        </div>
      </div>

      {/* Stats section */}
      {gazeState === 'tracking' && (
        <div className="gaze-debug-section">
          <div className="gaze-debug-row">
            <span className="gaze-debug-label">FPS</span>
            <span className={debug.fps < 5 ? 'gaze-debug-warn' : ''}>{debug.fps}</span>
          </div>
          <div className="gaze-debug-row">
            <span className="gaze-debug-label">Frames</span>
            <span>{debug.predictions}</span>
          </div>
          <div className="gaze-debug-row">
            <span className="gaze-debug-label">Away frames</span>
            <span>{debug.nulls}</span>
          </div>
          {debug.irisOffset && (
            <div className="gaze-debug-row">
              <span className="gaze-debug-label">Iris raw</span>
              <span>H: {debug.irisOffset.x} &nbsp; V: {debug.irisOffset.y}</span>
            </div>
          )}
          {debug.irisNormalized && calibration.calibrated && (
            <div className="gaze-debug-row">
              <span className="gaze-debug-label">Iris calibrated</span>
              <span>H: {debug.irisNormalized.x} &nbsp; V: {debug.irisNormalized.y}</span>
            </div>
          )}
          {debug.eyeOpenness && (
            <div className="gaze-debug-row">
              <span className="gaze-debug-label">Eye openness</span>
              <span>L: {debug.eyeOpenness.left} &nbsp; R: {debug.eyeOpenness.right}</span>
            </div>
          )}
          <div className="gaze-debug-row">
            <span className="gaze-debug-label">Calibrated</span>
            <span style={{ color: calibration.calibrated ? '#2ecc71' : '#f39c12' }}>
              {calibration.calibrated ? `Yes (${Object.keys(calibration.samples).length} pts)` : 'No'}
            </span>
          </div>
          <div className="gaze-debug-row">
            <span className="gaze-debug-label">Pause delay</span>
            <span>{tolerance}ms</span>
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="gaze-debug-error">{error}</div>
      )}

      {/* Tips */}
      {gazeState === 'tracking' && debug.fps > 0 && debug.fps < 5 && (
        <div className="gaze-debug-tip">
          Low FPS. Try closing other tabs or enabling GPU acceleration.
        </div>
      )}
      {gazeState === 'tracking' && debug.predictions > 20 && (debug.nulls / debug.predictions) > 0.8 && (
        <div className="gaze-debug-tip">
          Face rarely detected. Improve lighting, face the camera, or move closer.
        </div>
      )}
      {gazeState === 'initializing' && (
        <div className="gaze-debug-tip" style={{ color: 'var(--text-secondary)' }}>
          Downloading face landmark model (~5 MB)...
        </div>
      )}

      {/* Controls */}
      <div className="gaze-debug-controls">
        {gazeState === 'tracking' && (
          <button className="gaze-debug-btn" onClick={() => setShowVideo((v) => !v)}>
            {showVideo ? 'Hide camera' : 'Show camera'}
          </button>
        )}
        {gazeState === 'tracking' && (
          <button className="gaze-debug-btn" onClick={onCalibrate}>
            Calibrate
          </button>
        )}
        <button className="gaze-debug-btn" onClick={onRestart}>
          {gazeState === 'error' ? 'Retry' : 'Restart'}
        </button>
      </div>
    </div>
  );
}
