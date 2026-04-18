import { useState, useCallback, useRef, useEffect } from 'react';
import type { CalibrationPoint, CalibrationData } from '../hooks/useGazeDetection';

interface GazeCalibrationProps {
  calibration: CalibrationData;
  onCapture: (point: CalibrationPoint) => boolean;
  onReset: () => void;
  onClose: () => void;
}

const POINTS: { id: CalibrationPoint; label: string; x: string; y: string }[] = [
  { id: 'center', label: 'Center',  x: '50%',  y: '50%'  },
  { id: 'left',   label: 'Left',    x: '10%',  y: '50%'  },
  { id: 'right',  label: 'Right',   x: '90%',  y: '50%'  },
  { id: 'top',    label: 'Top',     x: '50%',  y: '15%'  },
  { id: 'bottom', label: 'Bottom',  x: '50%',  y: '85%'  },
];

const POINT_ORDER: CalibrationPoint[] = ['center', 'left', 'right', 'top', 'bottom'];

type CaptureState = 'idle' | 'countdown' | 'capturing' | 'done';

export function GazeCalibration({ calibration, onCapture, onReset, onClose }: GazeCalibrationProps) {
  const [activePoint, setActivePoint] = useState<CalibrationPoint | null>(null);
  const [captureState, setCaptureState] = useState<CaptureState>('idle');
  const [countdown, setCountdown] = useState(0);
  const [captured, setCaptured] = useState<Set<CalibrationPoint>>(
    () => new Set(Object.keys(calibration.samples) as CalibrationPoint[])
  );
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedMode, setGuidedMode] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const capturePoint = useCallback((point: CalibrationPoint) => {
    setActivePoint(point);
    setCaptureState('countdown');
    setCountdown(3);

    // 3-2-1 countdown then capture
    let count = 3;
    const tick = () => {
      count--;
      if (count > 0) {
        setCountdown(count);
        timerRef.current = setTimeout(tick, 700);
      } else {
        setCaptureState('capturing');
        setCountdown(0);
        // Capture after a short hold (let user stabilize gaze)
        timerRef.current = setTimeout(() => {
          const success = onCapture(point);
          if (success) {
            setCaptured((prev) => new Set([...prev, point]));
          }
          setCaptureState('done');
          timerRef.current = setTimeout(() => {
            setCaptureState('idle');
            setActivePoint(null);
            // Advance guided mode
            if (guidedMode) {
              const nextStep = POINT_ORDER.indexOf(point) + 1;
              if (nextStep < POINT_ORDER.length) {
                setGuidedStep(nextStep);
              } else {
                setGuidedMode(false);
              }
            }
          }, 600);
        }, 500);
      }
    };
    timerRef.current = setTimeout(tick, 700);
  }, [onCapture, guidedMode]);

  const startGuided = useCallback(() => {
    setCaptured(new Set());
    onReset();
    setGuidedMode(true);
    setGuidedStep(0);
  }, [onReset]);

  const completedCount = captured.size;
  const allDone = completedCount === 5;

  return (
    <div className="gaze-cal-overlay">
      {/* Header */}
      <div className="gaze-cal-header">
        <div className="gaze-cal-title">Eye Tracking Calibration</div>
        <div className="gaze-cal-subtitle">
          {guidedMode
            ? `Step ${guidedStep + 1}/5 — Look at the pulsing dot and wait`
            : calibration.calibrated
              ? 'Calibrated. Click any dot to recalibrate, or start guided mode.'
              : 'Click each dot while looking directly at it.'}
        </div>
        <button className="gaze-cal-close" onClick={onClose}>&times;</button>
      </div>

      {/* Calibration dots */}
      {POINTS.map((pt) => {
        const isActive = activePoint === pt.id;
        const isCaptured = captured.has(pt.id);
        const isGuidedTarget = guidedMode && POINT_ORDER[guidedStep] === pt.id && !isActive;
        const isClickable = captureState === 'idle' && (!guidedMode || POINT_ORDER[guidedStep] === pt.id);

        return (
          <div
            key={pt.id}
            className={`gaze-cal-point ${isActive ? 'gaze-cal-point--active' : ''} ${isCaptured ? 'gaze-cal-point--captured' : ''} ${isGuidedTarget ? 'gaze-cal-point--guided' : ''}`}
            style={{ left: pt.x, top: pt.y }}
            onClick={isClickable ? () => capturePoint(pt.id) : undefined}
          >
            {/* Outer ring */}
            <div className="gaze-cal-ring" />
            {/* Inner dot */}
            <div className="gaze-cal-dot" />
            {/* Countdown number */}
            {isActive && captureState === 'countdown' && (
              <div className="gaze-cal-countdown">{countdown}</div>
            )}
            {/* Capturing indicator */}
            {isActive && captureState === 'capturing' && (
              <div className="gaze-cal-capturing" />
            )}
            {/* Done checkmark */}
            {isActive && captureState === 'done' && (
              <div className="gaze-cal-check">&#10003;</div>
            )}
            {/* Label */}
            <div className="gaze-cal-label">{pt.label}</div>
          </div>
        );
      })}

      {/* Bottom controls */}
      <div className="gaze-cal-controls">
        <div className="gaze-cal-progress">
          {POINT_ORDER.map((pt) => (
            <div
              key={pt}
              className={`gaze-cal-pip ${captured.has(pt) ? 'gaze-cal-pip--done' : ''} ${activePoint === pt ? 'gaze-cal-pip--active' : ''}`}
            />
          ))}
          <span className="gaze-cal-progress-text">{completedCount}/5</span>
        </div>
        <div className="gaze-cal-buttons">
          <button
            className="gaze-cal-btn"
            onClick={startGuided}
            disabled={captureState !== 'idle'}
          >
            {allDone ? 'Redo guided' : 'Guided calibration'}
          </button>
          {calibration.calibrated && (
            <button
              className="gaze-cal-btn gaze-cal-btn--secondary"
              onClick={() => { onReset(); setCaptured(new Set()); }}
              disabled={captureState !== 'idle'}
            >
              Reset
            </button>
          )}
          <button
            className="gaze-cal-btn gaze-cal-btn--primary"
            onClick={onClose}
          >
            {calibration.calibrated ? 'Done' : 'Skip'}
          </button>
        </div>
      </div>
    </div>
  );
}
