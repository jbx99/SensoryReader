import { useRef, useEffect, useCallback, useState } from 'react';

// MediaPipe types — the actual module is dynamically imported to avoid
// pulling ~5 MB into the initial bundle and crashing page load.
interface NormalizedLandmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface FaceLandmarkerInstance {
  detectForVideo(video: HTMLVideoElement, timestamp: number): { faceLandmarks: NormalizedLandmark[][] };
  close(): void;
}

export type GazeState = 'inactive' | 'initializing' | 'tracking' | 'error';

export type GazeDirection = 'center' | 'left' | 'right' | 'up' | 'down' | 'away';

export type CalibrationPoint = 'center' | 'left' | 'right' | 'top' | 'bottom';

export interface CalibrationSample {
  h: number; // raw horizontal iris ratio
  v: number; // raw vertical iris ratio
}

export interface CalibrationData {
  samples: Partial<Record<CalibrationPoint, CalibrationSample>>;
  // Derived thresholds after calibration
  centerH: number;
  centerV: number;
  rangeH: number;  // how far the iris moves horizontally
  rangeV: number;  // how far the iris moves vertically
  calibrated: boolean;
}

export interface GazeDebugInfo {
  fps: number;
  predictions: number;
  nulls: number;
  lastFace: { x: number; y: number; w: number; h: number } | null;
  gazeDirection: GazeDirection;
  irisOffset: { x: number; y: number } | null;   // raw -1..1
  irisNormalized: { x: number; y: number } | null; // calibrated -1..1
  eyeOpenness: { left: number; right: number } | null;
  method: 'FaceLandmarker' | null;
}

interface GazeDetectionResult {
  gazeState: GazeState;
  gazePresent: boolean;
  gazeDirection: GazeDirection;
  start: () => void;
  stop: () => void;
  error: string | null;
  debug: GazeDebugInfo;
  videoElement: HTMLVideoElement | null;
  // Calibration
  calibration: CalibrationData;
  captureCalibrationPoint: (point: CalibrationPoint) => boolean;
  resetCalibration: () => void;
  currentRawIris: () => { h: number; v: number } | null;
}

// MediaPipe Face Mesh landmark indices
const LANDMARKS = {
  leftIris: 468,
  rightIris: 473,
  leftEyeInner: 133,
  leftEyeOuter: 33,
  rightEyeInner: 362,
  rightEyeOuter: 263,
  leftEyeTop: 159,
  leftEyeBottom: 145,
  rightEyeTop: 386,
  rightEyeBottom: 374,
} as const;

const DEFAULT_CALIBRATION: CalibrationData = {
  samples: {},
  centerH: 0,
  centerV: 0,
  rangeH: 0.6,  // default threshold before calibration
  rangeV: 0.5,
  calibrated: false,
};

const STORAGE_KEY = 'sensoryreader-gaze-calibration';

function loadCalibration(): CalibrationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as CalibrationData;
      if (data.calibrated) return data;
    }
  } catch { /* ignore */ }
  return { ...DEFAULT_CALIBRATION };
}

function saveCalibration(data: CalibrationData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

function computeCalibration(samples: Partial<Record<CalibrationPoint, CalibrationSample>>): CalibrationData {
  const center = samples.center;
  if (!center) {
    return { ...DEFAULT_CALIBRATION, samples };
  }

  const centerH = center.h;
  const centerV = center.v;

  // Compute range from edge samples (how far iris moves from center)
  let maxDeltaH = 0.3; // minimum reasonable range
  let maxDeltaV = 0.25;

  if (samples.left) {
    maxDeltaH = Math.max(maxDeltaH, Math.abs(samples.left.h - centerH));
  }
  if (samples.right) {
    maxDeltaH = Math.max(maxDeltaH, Math.abs(samples.right.h - centerH));
  }
  if (samples.top) {
    maxDeltaV = Math.max(maxDeltaV, Math.abs(samples.top.v - centerV));
  }
  if (samples.bottom) {
    maxDeltaV = Math.max(maxDeltaV, Math.abs(samples.bottom.v - centerV));
  }

  // Add 20% margin so you don't have to look to the extreme edge
  const rangeH = maxDeltaH * 1.2;
  const rangeV = maxDeltaV * 1.2;

  const data: CalibrationData = {
    samples,
    centerH,
    centerV,
    rangeH,
    rangeV,
    calibrated: true,
  };

  saveCalibration(data);
  return data;
}

function computeIrisRatio(
  iris: NormalizedLandmark,
  inner: NormalizedLandmark,
  outer: NormalizedLandmark
): number {
  const eyeWidth = inner.x - outer.x;
  if (Math.abs(eyeWidth) < 0.001) return 0;
  const irisPos = (iris.x - outer.x) / eyeWidth;
  return (irisPos - 0.5) * 2;
}

function computeIrisVertical(
  iris: NormalizedLandmark,
  top: NormalizedLandmark,
  bottom: NormalizedLandmark
): number {
  const eyeHeight = bottom.y - top.y;
  if (Math.abs(eyeHeight) < 0.001) return 0;
  const irisPos = (iris.y - top.y) / eyeHeight;
  return (irisPos - 0.5) * 2;
}

function computeEyeOpenness(top: NormalizedLandmark, bottom: NormalizedLandmark): number {
  return Math.abs(bottom.y - top.y);
}

function classifyGaze(
  hRatio: number,
  vRatio: number,
  eyeOpen: boolean,
  cal: CalibrationData
): GazeDirection {
  if (!eyeOpen) return 'away';

  // Normalize against calibration: shift by center, scale by range
  const normH = (hRatio - cal.centerH) / cal.rangeH;
  const normV = (vRatio - cal.centerV) / cal.rangeV;

  // Threshold: >1 means beyond calibrated range = looking away from screen
  if (Math.abs(normH) > 1.0) return normH < 0 ? 'left' : 'right';
  if (normV < -1.0) return 'up';
  if (normV > 1.0) return 'down';
  return 'center';
}

export function useGazeDetection(
  enabled: boolean,
  toleranceMs: number
): GazeDetectionResult {
  const [gazeState, setGazeState] = useState<GazeState>('inactive');
  const [gazePresent, setGazePresent] = useState(true);
  const [gazeDirection, setGazeDirection] = useState<GazeDirection>('center');
  const [error, setError] = useState<string | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [calibration, setCalibration] = useState<CalibrationData>(loadCalibration);
  const [debug, setDebug] = useState<GazeDebugInfo>({
    fps: 0,
    predictions: 0,
    nulls: 0,
    lastFace: null,
    gazeDirection: 'center',
    irisOffset: null,
    irisNormalized: null,
    eyeOpenness: null,
    method: null,
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<FaceLandmarkerInstance | null>(null);
  const rafRef = useRef(0);
  const lostTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toleranceRef = useRef(toleranceMs);
  toleranceRef.current = toleranceMs;
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const calibrationRef = useRef(calibration);
  calibrationRef.current = calibration;

  // Live iris values for calibration capture
  const liveIrisRef = useRef<{ h: number; v: number } | null>(null);

  // Debug counters
  const predictionCountRef = useRef(0);
  const nullCountTotalRef = useRef(0);
  const fpsFrameCountRef = useRef(0);
  const consecutiveNullRef = useRef(0);
  const lastDebugRef = useRef<Partial<GazeDebugInfo>>({});

  const NULL_THRESHOLD = 3;
  const EYE_CLOSED_THRESHOLD = 0.012;

  const clearLostTimer = useCallback(() => {
    if (lostTimerRef.current) {
      clearTimeout(lostTimerRef.current);
      lostTimerRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearLostTimer();
    if (fpsTimerRef.current) {
      clearInterval(fpsTimerRef.current);
      fpsTimerRef.current = null;
    }
    if (landmarkerRef.current) {
      landmarkerRef.current.close();
      landmarkerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.remove();
      videoRef.current = null;
    }
    setVideoElement(null);
  }, [clearLostTimer]);

  const stop = useCallback(() => {
    cleanup();
    setGazeState('inactive');
    setGazePresent(true);
    setGazeDirection('center');
    setError(null);
    setDebug({ fps: 0, predictions: 0, nulls: 0, lastFace: null, gazeDirection: 'center', irisOffset: null, irisNormalized: null, eyeOpenness: null, method: null });
    consecutiveNullRef.current = 0;
    predictionCountRef.current = 0;
    nullCountTotalRef.current = 0;
    fpsFrameCountRef.current = 0;
    liveIrisRef.current = null;
  }, [cleanup]);

  const handlePresence = useCallback(
    (present: boolean, direction: GazeDirection) => {
      if (present) {
        consecutiveNullRef.current = 0;
        clearLostTimer();
        setGazePresent(true);
        setGazeDirection(direction);
      } else {
        consecutiveNullRef.current++;
        nullCountTotalRef.current++;
        if (consecutiveNullRef.current >= NULL_THRESHOLD && !lostTimerRef.current) {
          lostTimerRef.current = setTimeout(() => {
            setGazePresent(false);
            setGazeDirection('away');
            lostTimerRef.current = null;
          }, toleranceRef.current);
        }
      }
    },
    [clearLostTimer]
  );

  const start = useCallback(async () => {
    if (gazeState === 'initializing' || gazeState === 'tracking') return;

    setGazeState('initializing');
    setError(null);
    consecutiveNullRef.current = 0;
    predictionCountRef.current = 0;
    nullCountTotalRef.current = 0;
    fpsFrameCountRef.current = 0;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mediapipe = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs') as any;
      const { FilesetResolver, FaceLandmarker } = mediapipe;

      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
      });

      landmarkerRef.current = faceLandmarker as unknown as FaceLandmarkerInstance;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.playsInline = true;
      video.muted = true;
      video.style.display = 'none';
      document.body.appendChild(video);
      videoRef.current = video;
      setVideoElement(video);

      await video.play();

      let lastTimestamp = -1;

      const detect = () => {
        if (!videoRef.current || !landmarkerRef.current || videoRef.current.readyState < 2) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }

        const now = performance.now();
        if (now <= lastTimestamp) {
          rafRef.current = requestAnimationFrame(detect);
          return;
        }
        lastTimestamp = now;

        fpsFrameCountRef.current++;
        predictionCountRef.current++;

        try {
          const result = landmarkerRef.current.detectForVideo(videoRef.current, now);

          if (result.faceLandmarks && result.faceLandmarks.length > 0) {
            const lm = result.faceLandmarks[0];

            const leftH = computeIrisRatio(
              lm[LANDMARKS.leftIris], lm[LANDMARKS.leftEyeInner], lm[LANDMARKS.leftEyeOuter]
            );
            const rightH = computeIrisRatio(
              lm[LANDMARKS.rightIris], lm[LANDMARKS.rightEyeInner], lm[LANDMARKS.rightEyeOuter]
            );
            const leftV = computeIrisVertical(
              lm[LANDMARKS.leftIris], lm[LANDMARKS.leftEyeTop], lm[LANDMARKS.leftEyeBottom]
            );
            const rightV = computeIrisVertical(
              lm[LANDMARKS.rightIris], lm[LANDMARKS.rightEyeTop], lm[LANDMARKS.rightEyeBottom]
            );

            const hRatio = (leftH + rightH) / 2;
            const vRatio = (leftV + rightV) / 2;

            // Store live iris for calibration capture
            liveIrisRef.current = { h: hRatio, v: vRatio };

            const leftOpen = computeEyeOpenness(lm[LANDMARKS.leftEyeTop], lm[LANDMARKS.leftEyeBottom]);
            const rightOpen = computeEyeOpenness(lm[LANDMARKS.rightEyeTop], lm[LANDMARKS.rightEyeBottom]);
            const eyesOpen = leftOpen > EYE_CLOSED_THRESHOLD || rightOpen > EYE_CLOSED_THRESHOLD;

            const cal = calibrationRef.current;
            const direction = classifyGaze(hRatio, vRatio, eyesOpen, cal);

            // Compute normalized iris position using calibration
            const normH = cal.calibrated ? (hRatio - cal.centerH) / cal.rangeH : hRatio;
            const normV = cal.calibrated ? (vRatio - cal.centerV) / cal.rangeV : vRatio;

            let minX = 1, minY = 1, maxX = 0, maxY = 0;
            for (const p of lm) {
              if (p.x < minX) minX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.x > maxX) maxX = p.x;
              if (p.y > maxY) maxY = p.y;
            }
            const vw = videoRef.current.videoWidth;
            const vh = videoRef.current.videoHeight;

            lastDebugRef.current = {
              lastFace: {
                x: Math.round(minX * vw),
                y: Math.round(minY * vh),
                w: Math.round((maxX - minX) * vw),
                h: Math.round((maxY - minY) * vh),
              },
              gazeDirection: direction,
              irisOffset: { x: Math.round(hRatio * 100) / 100, y: Math.round(vRatio * 100) / 100 },
              irisNormalized: { x: Math.round(normH * 100) / 100, y: Math.round(normV * 100) / 100 },
              eyeOpenness: {
                left: Math.round(leftOpen * 1000) / 1000,
                right: Math.round(rightOpen * 1000) / 1000,
              },
            };

            const lookingAtScreen = direction === 'center';
            handlePresence(lookingAtScreen, direction);
          } else {
            liveIrisRef.current = null;
            lastDebugRef.current = {
              lastFace: null,
              gazeDirection: 'away',
              irisOffset: null,
              irisNormalized: null,
              eyeOpenness: null,
            };
            handlePresence(false, 'away');
          }
        } catch {
          handlePresence(false, 'away');
        }

        rafRef.current = requestAnimationFrame(detect);
      };

      rafRef.current = requestAnimationFrame(detect);

      fpsTimerRef.current = setInterval(() => {
        setDebug({
          fps: fpsFrameCountRef.current,
          predictions: predictionCountRef.current,
          nulls: nullCountTotalRef.current,
          method: 'FaceLandmarker',
          lastFace: lastDebugRef.current.lastFace ?? null,
          gazeDirection: lastDebugRef.current.gazeDirection ?? 'center',
          irisOffset: lastDebugRef.current.irisOffset ?? null,
          irisNormalized: lastDebugRef.current.irisNormalized ?? null,
          eyeOpenness: lastDebugRef.current.eyeOpenness ?? null,
        });
        fpsFrameCountRef.current = 0;
      }, 1000);

      setGazeState('tracking');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to initialize eye tracking';

      if (message.includes('Permission') || message.includes('NotAllowed')) {
        setError('Camera access denied. Allow camera permissions and try again.');
      } else if (message.includes('NotFound') || message.includes('DevicesNotFound')) {
        setError('No camera found. Eye tracking requires a webcam.');
      } else if (message.includes('NotReadable') || message.includes('TrackStartError')) {
        setError('Camera is in use by another app. Close it and try again.');
      } else {
        setError(message);
      }

      setGazeState('error');
      cleanup();
    }
  }, [gazeState, cleanup, handlePresence]);

  // Capture a calibration sample at the current iris position.
  // Averages multiple frames for stability.
  const captureCalibrationPoint = useCallback((point: CalibrationPoint): boolean => {
    const iris = liveIrisRef.current;
    if (!iris) return false;

    const newSamples = { ...calibrationRef.current.samples, [point]: { h: iris.h, v: iris.v } };
    const newCal = computeCalibration(newSamples);
    calibrationRef.current = newCal;
    setCalibration(newCal);
    return true;
  }, []);

  const resetCalibration = useCallback(() => {
    const fresh = { ...DEFAULT_CALIBRATION };
    calibrationRef.current = fresh;
    setCalibration(fresh);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }, []);

  const currentRawIris = useCallback(() => {
    return liveIrisRef.current;
  }, []);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && gazeState === 'inactive') {
      start();
    } else if (!enabled && gazeState !== 'inactive') {
      stop();
    }
  }, [enabled, gazeState, start, stop]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearLostTimer();
      if (fpsTimerRef.current) clearInterval(fpsTimerRef.current);
      if (landmarkerRef.current) {
        landmarkerRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.remove();
      }
    };
  }, [clearLostTimer]);

  return {
    gazeState, gazePresent, gazeDirection, start, stop, error, debug, videoElement,
    calibration, captureCalibrationPoint, resetCalibration, currentRawIris,
  };
}
