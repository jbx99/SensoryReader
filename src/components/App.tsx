import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { ReaderConfig, Preset, DocumentRecord } from '../types';
import { DEFAULT_PRESETS } from '../presets/defaults';
import { useReaderEngine } from '../hooks/useReaderEngine';
import { useKeyboard } from '../hooks/useKeyboard';
import { useFullscreen } from '../hooks/useFullscreen';
import { usePersistence } from '../hooks/usePersistence';
import { contentHash } from '../input/parseText';
import { addToHistory, getHistory, cacheText, getCachedText } from '../input/recentHistory';
import { WELCOME_TEXT } from '../data/welcomeText';
import { ReaderDisplay } from './ReaderDisplay';
import { PlaybackControls } from './PlaybackControls';
import { ProgressIndicator } from './ProgressIndicator';
import { BackgroundEngine } from './BackgroundEngine';
import { ConfigPanel } from './ConfigPanel';
import { DraggableBox } from './DraggableBox';

export function App() {
  const [activePresetId, setActivePresetId] = useState('welcome');
  const [allPresets, setAllPresets] = useState<Preset[]>(DEFAULT_PRESETS);
  const [configOverrides, setConfigOverrides] = useState<ReaderConfig | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarAutoHide, setSidebarAutoHide] = useState(true);
  const [sidebarOpacity, setSidebarOpacity] = useState(0.55);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [, setCurrentDocHash] = useState<string | null>(null);
  const [mouseIdle, setMouseIdle] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const persistence = usePersistence();
  const [docVersion, setDocVersion] = useState(0);
  const recentDocs = useMemo(() => getHistory(), [docVersion]);

  const activePreset = allPresets.find((p) => p.id === activePresetId) ?? allPresets[0];
  const config = configOverrides ?? activePreset.config;

  // Sync screenMode config with browser fullscreen API
  useEffect(() => {
    if (config.display.screenMode === 'fullscreen' && !isFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (config.display.screenMode !== 'fullscreen' && isFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }, [config.display.screenMode, isFullscreen]);

  // When the engine changes WPM (nudge, slider, arrows), propagate to config
  const handleEngineConfigChange = useCallback((updated: ReaderConfig) => {
    setConfigOverrides(updated);
  }, []);

  const engine = useReaderEngine(config, handleEngineConfigChange);

  // Load welcome text on mount
  const welcomeLoaded = useRef(false);
  useEffect(() => {
    if (!welcomeLoaded.current) {
      engine.load(WELCOME_TEXT);
      welcomeLoaded.current = true;
    }
  }, [engine]);

  // Mouse idle detection — hide controls after 3s, show on move
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleMove = () => {
      setMouseIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setMouseIdle(true), 3000);
    };

    handleMove();
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      clearTimeout(timer);
    };
  }, []);

  const handleLoadText = useCallback(
    (text: string, title: string) => {
      const hash = contentHash(text);
      engine.load(text);
      setCurrentDocHash(hash);
      cacheText(hash, text);
      setDocVersion((v) => v + 1);

      const doc: DocumentRecord = {
        contentHash: hash,
        title,
        position: persistence.getPosition(hash),
        presetId: activePresetId,
        lastOpened: Date.now(),
        wordCount: text.split(/\s+/).length,
      };
      persistence.addDocument(doc);
      addToHistory(doc);

      const saved = persistence.getPosition(hash);
      if (saved > 0) engine.seekTo(saved);
    },
    [engine, persistence, activePresetId]
  );

  const handleResumeDocument = useCallback(
    (doc: DocumentRecord) => {
      const cached = getCachedText(doc.contentHash);
      if (!cached) return;

      engine.load(cached);
      setCurrentDocHash(doc.contentHash);

      const savedPreset = allPresets.find((p) => p.id === doc.presetId);
      if (savedPreset) {
        setActivePresetId(savedPreset.id);
        setConfigOverrides(null);
      }

      if (doc.position > 0) {
        setTimeout(() => engine.seekTo(doc.position), 0);
      }

      addToHistory({ ...doc, lastOpened: Date.now() });
    },
    [engine, allPresets]
  );

  const handleSelectPreset = useCallback((preset: Preset) => {
    setActivePresetId(preset.id);
    setConfigOverrides(null);
  }, []);

  const handleConfigChange = useCallback((newConfig: ReaderConfig) => {
    setConfigOverrides(newConfig);
  }, []);

  const handlePresetsChange = useCallback((presets: Preset[]) => {
    setAllPresets(presets);
    persistence.setSavedPresets(presets.filter((p) => !p.builtIn));
  }, [persistence]);

  const keyboardActions = useMemo(
    () => ({
      onTogglePlayback: engine.togglePlayback,
      onRewind: () => engine.rewind(5),
      onSkipSentence: engine.skipSentence,
      onNudgeWpm: engine.nudgeWpm,
      onToggleFullscreen: toggleFullscreen,
      onToggleConfig: () => setSidebarOpen((v) => !v),
    }),
    [engine, toggleFullscreen]
  );

  useKeyboard(keyboardActions);

  // Auto-hide: when enabled and playback starts, close the sidebar (same as clicking toggle)
  useEffect(() => {
    if (sidebarAutoHide && engine.status === 'playing') {
      setSidebarOpen(false);
    }
  }, [sidebarAutoHide, engine.status]);

  // Reader screen
  const showControls = controlsVisible && !mouseIdle;

  return (
    <div className={`app app--reader ${isFullscreen ? 'app--fullscreen' : ''} ${config.display.screenMode === 'focus-strip' ? 'app--focus-strip' : ''}`}>
      {/* Left sidebar — settings & presets */}
      <div
        className={`sidebar-wrapper ${sidebarOpen ? 'sidebar-wrapper--open' : ''}`}
        style={{
          '--sidebar-bg-alpha': sidebarOpacity,
        } as React.CSSProperties}
      >
        <ConfigPanel
          config={config}
          onChange={handleConfigChange}
          presets={allPresets}
          activePresetId={activePresetId}
          onSelectPreset={handleSelectPreset}
          onPresetsChange={handlePresetsChange}
          sidebarAutoHide={sidebarAutoHide}
          onSidebarAutoHideChange={setSidebarAutoHide}
          sidebarOpacity={sidebarOpacity}
          onSidebarOpacityChange={setSidebarOpacity}
          onLoadText={handleLoadText}
          recentDocuments={recentDocs}
          onResumeDocument={handleResumeDocument}
        />
      </div>

      {/* Main reader area */}
      <div className="reader-main">
        <BackgroundEngine config={config.background} playbackStatus={engine.status}>
          {/* Top toolbar — always has a trigger to reappear */}
          <div className={`reader-toolbar ${showControls ? '' : 'reader-toolbar--hidden'}`}>
            <button
              className={`toolbar-btn ${sidebarOpen ? 'toolbar-btn--active' : ''}`}
              onClick={() => setSidebarOpen((v) => !v)}
              title="Toggle settings"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button className="toolbar-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/></svg>
            </button>

            <div className="toolbar-title">
              {engine.status === 'playing' ? `${engine.effectiveWpm} WPM` : 'Paused'}
            </div>
          </div>

          {/* Hover trigger: thin strip at top that reveals toolbar */}
          {!showControls && (
            <div
              className="toolbar-trigger"
              onMouseEnter={() => setControlsVisible(true)}
            />
          )}

          {/* Progress bar */}
          <ProgressIndicator
            currentIndex={engine.currentIndex}
            totalTokens={engine.totalTokens}
            displayConfig={config.display}
          />

          {/* Reader stage — draggable text and controls */}
          <div
            ref={stageRef}
            className={`reader-stage ${sidebarOpen ? 'reader-stage--sidebar-open' : ''}`}
          >
            {/* Draggable text overlay */}
            <DraggableBox
              initial={{ x: -1, y: -1, width: 700, height: 120 }}
              minWidth={300}
              minHeight={80}
              containerRef={stageRef}
              className={`draggable-text-box shape--${config.display.panelShape}`}
              resizable={true}
              extraStyle={{
                backgroundColor: `${config.display.textBackground.color}${Math.round(config.display.textBackground.opacity * 255).toString(16).padStart(2, '0')}`,
                backdropFilter: config.display.textBackground.blur > 0 ? `blur(${config.display.textBackground.blur}px)` : undefined,
                WebkitBackdropFilter: config.display.textBackground.blur > 0 ? `blur(${config.display.textBackground.blur}px)` : undefined,
                opacity: config.display.panelOpacity,
              }}
            >
              <ReaderDisplay
                chunk={engine.currentChunk}
                typography={config.typography}
                display={config.display}
              />
            </DraggableBox>
          </div>

          {/* Draggable playback controls */}
          <DraggableBox
            initial={{ x: -1, y: -3, width: 0, height: 0 }}
            minWidth={360}
            minHeight={80}
            containerRef={stageRef}
            className={`draggable-controls-box ${showControls ? '' : 'draggable-controls-box--hidden'}`}
            resizable={false}
          >
            <PlaybackControls
              status={engine.status}
              currentIndex={engine.currentIndex}
              totalTokens={engine.totalTokens}
              effectiveWpm={engine.effectiveWpm}
              onTogglePlayback={engine.togglePlayback}
              onRewind={() => engine.rewind(5)}
              onSkipSentence={engine.skipSentence}
              onSeek={engine.seekTo}
              onNudgeWpm={engine.nudgeWpm}
              onSetWpm={engine.setWpm}
            />
          </DraggableBox>

          {/* Hover trigger: thin strip at bottom that reveals controls */}
          {!showControls && (
            <div
              className="controls-trigger"
              onMouseEnter={() => setControlsVisible(true)}
            />
          )}
        </BackgroundEngine>
      </div>
    </div>
  );
}
