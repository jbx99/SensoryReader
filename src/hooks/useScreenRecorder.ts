import { useState, useRef, useCallback } from 'react';

export type RecordingState = 'idle' | 'countdown' | 'recording' | 'done';

export interface ScreenRecorder {
  state: RecordingState;
  elapsed: number;
  maxDuration: number;
  videoUrl: string | null;
  start: (duration: number) => void;
  stop: () => void;
  discard: () => void;
  download: () => void;
}

export function useScreenRecorder(): ScreenRecorder {
  const [state, setState] = useState<RecordingState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [maxDuration, setMaxDuration] = useState(15);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const mediaStream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>('video/webm');
  const tickTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);

  /** Pick the best MIME type for GitHub README compatibility */
  function pickMimeType(): string {
    // GitHub supports both MP4 and WebM. MP4 is more universally compatible.
    const candidates = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4;codecs=avc1',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) return type;
    }
    return 'video/webm';
  }

  const cleanup = useCallback(() => {
    if (tickTimer.current) { clearInterval(tickTimer.current); tickTimer.current = null; }
    if (countdownTimer.current) { clearTimeout(countdownTimer.current); countdownTimer.current = null; }
    if (recorder.current && recorder.current.state !== 'inactive') {
      recorder.current.stop();
    }
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach(t => t.stop());
      mediaStream.current = null;
    }
    recorder.current = null;
  }, []);

  const finishRecording = useCallback(() => {
    cleanup();
    const blob = new Blob(chunks.current, { type: mimeTypeRef.current });
    chunks.current = [];
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);
    setState('done');
  }, [cleanup]);

  const start = useCallback(async (duration: number) => {
    // Clean up any previous recording
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    chunks.current = [];
    setMaxDuration(duration);
    setElapsed(0);

    try {
      // Capture the current tab
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          frameRate: 30,
        },
        audio: true,
        preferCurrentTab: true,
      } as any);

      mediaStream.current = stream;

      // If user cancels the share dialog
      stream.getVideoTracks()[0].onended = () => {
        if (state === 'recording' || state === 'countdown') {
          finishRecording();
        }
      };

      // 3-2-1 countdown
      setState('countdown');
      let count = 3;
      setElapsed(count);

      const countdownTick = () => {
        count--;
        if (count > 0) {
          setElapsed(count);
          countdownTimer.current = setTimeout(countdownTick, 1000);
        } else {
          // Start recording — pick best MIME type for embedding
          const mimeType = pickMimeType();
          mimeTypeRef.current = mimeType;
          const rec = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 2_500_000, // 2.5 Mbps — good quality, GitHub-friendly size
          });

          rec.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.current.push(e.data);
          };

          rec.onstop = () => {
            finishRecording();
          };

          recorder.current = rec;
          rec.start(100); // collect data every 100ms
          startTimeRef.current = Date.now();
          setState('recording');
          setElapsed(0);

          // Tick timer for elapsed display
          tickTimer.current = setInterval(() => {
            const secs = Math.floor((Date.now() - startTimeRef.current) / 1000);
            setElapsed(secs);
            if (secs >= duration) {
              rec.stop();
            }
          }, 250);
        }
      };

      countdownTimer.current = setTimeout(countdownTick, 1000);
    } catch (err) {
      // User denied screen capture
      cleanup();
      setState('idle');
    }
  }, [videoUrl, state, cleanup, finishRecording]);

  const stop = useCallback(() => {
    if (recorder.current && recorder.current.state === 'recording') {
      recorder.current.stop();
    } else {
      cleanup();
      setState('idle');
    }
  }, [cleanup]);

  const discard = useCallback(() => {
    if (videoUrl) { URL.revokeObjectURL(videoUrl); setVideoUrl(null); }
    chunks.current = [];
    setState('idle');
    setElapsed(0);
  }, [videoUrl]);

  const download = useCallback(() => {
    if (!videoUrl) return;
    const ext = mimeTypeRef.current.includes('mp4') ? 'mp4' : 'webm';
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `sensoryreader-clip-${Date.now()}.${ext}`;
    a.click();
  }, [videoUrl]);

  return { state, elapsed, maxDuration, videoUrl, start, stop, discard, download };
}
