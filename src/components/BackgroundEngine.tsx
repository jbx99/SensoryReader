import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import type { BackgroundConfig, PlaybackStatus } from '../types';
import { DraggableBox } from './DraggableBox';

interface BackgroundEngineProps {
  config: BackgroundConfig;
  playbackStatus: PlaybackStatus;
  children: React.ReactNode;
}

function extractYoutubeId(url: string): string | null {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export function BackgroundEngine({ config, playbackStatus, children }: BackgroundEngineProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ytRef = useRef<HTMLIFrameElement>(null);
  const engineRef = useRef<HTMLDivElement>(null);
  const [videoPaused, setVideoPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(50); // 0-100

  const youtubeId = useMemo(() => extractYoutubeId(config.youtubeUrl), [config.youtubeUrl]);

  // Sync local video with reader playback
  useEffect(() => {
    if (!videoRef.current || videoPaused) return;
    if (playbackStatus === 'playing') {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [playbackStatus, videoPaused]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = config.videoPlaybackRate;
    }
  }, [config.videoPlaybackRate]);

  // Sync muted/volume state to local video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
      videoRef.current.volume = volume / 100;
    }
  }, [muted, volume]);

  // YouTube postMessage controls
  const ytCommand = useCallback((func: string, args?: unknown) => {
    if (!ytRef.current?.contentWindow) return;
    ytRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func, args: args ? [args] : [] }),
      '*'
    );
  }, []);

  // Sync muted/volume state to YouTube
  useEffect(() => {
    if (config.mode === 'youtube') {
      ytCommand(muted ? 'mute' : 'unMute');
      ytCommand('setVolume', volume);
    }
  }, [muted, volume, config.mode, ytCommand]);

  const handleVideoPlayPause = useCallback(() => {
    if (config.mode === 'video' && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
        setVideoPaused(false);
      } else {
        videoRef.current.pause();
        setVideoPaused(true);
      }
    } else if (config.mode === 'youtube') {
      if (videoPaused) {
        ytCommand('playVideo');
        setVideoPaused(false);
      } else {
        ytCommand('pauseVideo');
        setVideoPaused(true);
      }
    }
  }, [config.mode, videoPaused, ytCommand]);

  const handleVideoRestart = useCallback(() => {
    if (config.mode === 'video' && videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
      setVideoPaused(false);
    } else if (config.mode === 'youtube') {
      ytCommand('seekTo', 0);
      ytCommand('playVideo');
      setVideoPaused(false);
    }
  }, [config.mode, ytCommand]);

  const handleVideoSeek = useCallback((delta: number) => {
    if (config.mode === 'video' && videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime + delta);
    } else if (config.mode === 'youtube') {
      ytCommand('seekTo', delta);
    }
  }, [config.mode, ytCommand]);

  const handleToggleMute = useCallback(() => {
    setMuted((m) => !m);
  }, []);

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (newVolume > 0 && muted) setMuted(false);
    if (newVolume === 0) setMuted(true);
  }, [muted]);

  const showVideoControls = config.mode === 'video' || (config.mode === 'youtube' && youtubeId);

  return (
    <div className="background-engine" ref={engineRef}>
      {config.mode === 'solid' && (
        <div
          className="background-layer background-layer--solid"
          style={{ backgroundColor: config.solidColor }}
        />
      )}

      {config.mode === 'image' && config.imageUrl && (
        <div
          className="background-layer background-layer--image"
          style={{
            backgroundImage: `url(${config.imageUrl})`,
            filter: `blur(${config.imageBlur}px) brightness(${config.imageBrightness})`,
          }}
        />
      )}

      {config.mode === 'video' && config.videoUrl && (
        <video
          ref={videoRef}
          className="background-layer background-layer--video"
          src={config.videoUrl}
          loop
          muted={muted}
          playsInline
          style={{ opacity: config.videoOpacity }}
        />
      )}

      {config.mode === 'youtube' && youtubeId && (
        <iframe
          ref={ytRef}
          className="background-layer background-layer--youtube"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&loop=1&playlist=${youtubeId}&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3&enablejsapi=1`}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Background video"
        />
      )}

      {/* Background overlay — tinted glass between background and content */}
      <div
        className="background-overlay"
        style={{
          backgroundColor: config.overlayColor,
          opacity: config.overlayOpacity,
          borderRadius: `${config.overlayBorderRadius}px`,
        }}
      />

      {/* Video/YouTube playback controls — draggable */}
      {showVideoControls && (
        <DraggableBox
          initial={{ x: -2, y: -2, width: 0, height: 0 }}
          minWidth={100}
          minHeight={30}
          containerRef={engineRef}
          className="video-controls-wrapper"
          resizable={false}
        >
        <div className="video-controls">
          <button
            className="video-controls__btn"
            onClick={() => handleVideoSeek(-10)}
            title="Rewind 10s"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 4v6h6M3.51 15a9 9 0 105.73-8.38L1 10"/></svg>
            <span>10</span>
          </button>
          <button
            className="video-controls__btn"
            onClick={handleVideoPlayPause}
            title={videoPaused ? 'Play video' : 'Pause video'}
          >
            {videoPaused ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            )}
          </button>
          <button
            className="video-controls__btn"
            onClick={handleVideoRestart}
            title="Restart video"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M20.49 15a9 9 0 11-5.73-8.38L23 10"/></svg>
          </button>
          <button
            className="video-controls__btn"
            onClick={() => handleVideoSeek(10)}
            title="Forward 10s"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            <span>10</span>
          </button>

          <div className="video-controls__divider" />

          <button
            className={`video-controls__btn ${!muted ? 'video-controls__btn--active' : ''}`}
            onClick={handleToggleMute}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></svg>
            )}
          </button>
          <input
            type="range"
            className="video-controls__volume"
            min={0}
            max={100}
            value={muted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            title={`Volume: ${muted ? 0 : volume}%`}
          />
        </div>
        </DraggableBox>
      )}

      <div className="background-content">
        {children}
      </div>
    </div>
  );
}
