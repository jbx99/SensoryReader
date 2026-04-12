import { useState, useRef } from 'react';
import type { ReaderConfig, Preset, DocumentRecord, PunctuationType, EmphasisStyle } from '../types';
import { duplicatePreset, createPreset, exportPreset, importPreset } from '../presets/presetsManager';
import { InputPanel } from './InputPanel';

interface ConfigPanelProps {
  config: ReaderConfig;
  onChange: (config: ReaderConfig) => void;
  presets: Preset[];
  activePresetId: string;
  onSelectPreset: (preset: Preset) => void;
  onPresetsChange: (presets: Preset[]) => void;
  sidebarAutoHide: boolean;
  onSidebarAutoHideChange: (v: boolean) => void;
  sidebarOpacity: number;
  onSidebarOpacityChange: (v: number) => void;
  onLoadText: (text: string, title: string) => void;
  recentDocuments: DocumentRecord[];
  onResumeDocument: (doc: DocumentRecord) => void;
}

const FONT_OPTIONS = [
  'Georgia, serif',
  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  '"Source Serif 4", Georgia, serif',
  '"JetBrains Mono", monospace',
  '"Atkinson Hyperlegible", sans-serif',
  '"OpenDyslexic", "Comic Sans MS", sans-serif',
];

const FONT_LABELS: Record<string, string> = {
  'Georgia, serif': 'Georgia',
  '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif': 'System Sans',
  '"Source Serif 4", Georgia, serif': 'Source Serif',
  '"JetBrains Mono", monospace': 'JetBrains Mono',
  '"Atkinson Hyperlegible", sans-serif': 'Atkinson Hyperlegible',
  '"OpenDyslexic", "Comic Sans MS", sans-serif': 'OpenDyslexic',
};

const PUNCT_TYPES: PunctuationType[] = [
  'comma', 'period', 'semicolon', 'colon', 'question', 'exclamation', 'dash',
];

const EMPHASIS_OPTIONS: EmphasisStyle[] = [
  'size-boost', 'bold', 'italic', 'color-flash', 'glow',
];

type Tab = 'library' | 'presets' | 'text' | 'visual';

export function ConfigPanel({
  config,
  onChange,
  presets,
  activePresetId,
  onSelectPreset,
  onPresetsChange,
  sidebarAutoHide,
  onSidebarAutoHideChange,
  sidebarOpacity,
  onSidebarOpacityChange,
  onLoadText,
  recentDocuments,
  onResumeDocument,
}: ConfigPanelProps) {
  const [tab, setTab] = useState<Tab>('presets');
  const importRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof ReaderConfig>(
    section: K,
    patch: Partial<ReaderConfig[K]>
  ) => {
    onChange({
      ...config,
      [section]: { ...config[section], ...patch },
    });
  };

  const handleSaveNew = () => {
    const name = prompt('Preset name:');
    if (!name) return;
    const preset = createPreset(name, config);
    onPresetsChange([...presets, preset]);
    onSelectPreset(preset);
  };

  const handleDuplicate = (preset: Preset) => {
    const dup = duplicatePreset(preset);
    onPresetsChange([...presets, dup]);
    onSelectPreset(dup);
  };

  const handleRename = (preset: Preset) => {
    const name = prompt('Rename preset:', preset.name);
    if (!name || name === preset.name) return;
    onPresetsChange(presets.map((p) =>
      p.id === preset.id ? { ...p, name } : p
    ));
  };

  const handleSaveOver = (preset: Preset) => {
    if (preset.builtIn) return;
    onPresetsChange(presets.map((p) =>
      p.id === preset.id ? { ...p, config: structuredClone(config) } : p
    ));
  };

  const handleDelete = (preset: Preset) => {
    if (preset.builtIn) return;
    onPresetsChange(presets.filter((p) => p.id !== preset.id));
  };

  const handleExport = (preset: Preset) => {
    const json = exportPreset(preset);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${preset.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then((json) => {
      try {
        const preset = importPreset(json);
        onPresetsChange([...presets, preset]);
        onSelectPreset(preset);
      } catch {
        alert('Invalid preset file');
      }
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'library', label: 'Library' },
    { id: 'presets', label: 'Presets' },
    { id: 'text', label: 'Text' },
    { id: 'visual', label: 'Visual' },
  ];

  return (
    <div className="sidebar">
      {/* Sidebar appearance controls */}
      <div className="sidebar__appearance">
        <label className="sidebar__appearance-toggle" title="Auto-hide when idle">
          <input
            type="checkbox"
            checked={sidebarAutoHide}
            onChange={(e) => onSidebarAutoHideChange(e.target.checked)}
          />
          Auto-hide
        </label>
        <div className="sidebar__appearance-opacity">
          <span>Opacity</span>
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.05}
            value={sidebarOpacity}
            onChange={(e) => onSidebarOpacityChange(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="sidebar__tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`sidebar__tab ${tab === t.id ? 'sidebar__tab--active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="sidebar__content">
        {/* === Library Tab === */}
        {tab === 'library' && (
          <div className="sidebar__section sidebar__section--library">
            <InputPanel
              onLoadText={onLoadText}
              recentDocuments={recentDocuments}
              onResumeDocument={onResumeDocument}
            />
          </div>
        )}

        {/* === Presets Tab === */}
        {tab === 'presets' && (
          <div className="sidebar__section">
            <div className="preset-list">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className={`preset-item ${preset.id === activePresetId ? 'preset-item--active' : ''}`}
                >
                  <button
                    className="preset-item__select"
                    onClick={() => onSelectPreset(preset)}
                  >
                    <span className="preset-item__name">{preset.name}</span>
                    {preset.builtIn && <span className="preset-item__badge">built-in</span>}
                  </button>
                  <div className="preset-item__actions">
                    <button onClick={() => handleRename(preset)} title="Rename">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </button>
                    {!preset.builtIn && (
                      <button onClick={() => handleSaveOver(preset)} title="Save current settings to this preset">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                      </button>
                    )}
                    <button onClick={() => handleDuplicate(preset)} title="Duplicate">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
                    </button>
                    <button onClick={() => handleExport(preset)} title="Export">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                    </button>
                    {!preset.builtIn && (
                      <button onClick={() => handleDelete(preset)} title="Delete">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="preset-actions">
              <button className="sidebar-btn" onClick={handleSaveNew}>
                + Save Current
              </button>
              <button className="sidebar-btn" onClick={() => importRef.current?.click()}>
                Import
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </div>
          </div>
        )}

        {/* === Text Tab (Speed + Typography) === */}
        {tab === 'text' && (
          <div className="sidebar__section">
            <p className="ctrl-section-label">Speed</p>

            <div className="ctrl-group">
              <label className="ctrl-label">
                WPM
                <span className="ctrl-value">{config.speed.wpm}</span>
              </label>
              <input
                type="range"
                min={100}
                max={1000}
                step={25}
                value={config.speed.wpm}
                onChange={(e) => update('speed', { wpm: Number(e.target.value) })}
              />
              <div className="ctrl-marks">
                <span>100</span><span>250</span><span>400</span><span>600</span><span>1000</span>
              </div>
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">
                Chunk Size
                <span className="ctrl-value">{config.speed.chunkSize} word{config.speed.chunkSize > 1 ? 's' : ''}</span>
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={1}
                value={config.speed.chunkSize}
                onChange={(e) =>
                  update('speed', { chunkSize: Number(e.target.value) as 1 | 2 | 3 })
                }
              />
            </div>

            <label className="ctrl-toggle">
              <input
                type="checkbox"
                checked={config.speed.adaptiveSlowdown}
                onChange={(e) => update('speed', { adaptiveSlowdown: e.target.checked })}
              />
              <span>Adaptive slowdown</span>
            </label>

            <label className="ctrl-toggle">
              <input
                type="checkbox"
                checked={config.speed.rampUp}
                onChange={(e) => update('speed', { rampUp: e.target.checked })}
              />
              <span>Ramp-up mode</span>
            </label>

            <details className="ctrl-details">
              <summary>Punctuation pauses</summary>
              <div className="ctrl-details__body">
                {PUNCT_TYPES.map((pt) => (
                  <div className="ctrl-group ctrl-group--compact" key={pt}>
                    <label className="ctrl-label">
                      {pt}
                      <span className="ctrl-value">{config.speed.punctuationMultipliers[pt]}x</span>
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      step={0.1}
                      value={config.speed.punctuationMultipliers[pt]}
                      onChange={(e) =>
                        update('speed', {
                          punctuationMultipliers: {
                            ...config.speed.punctuationMultipliers,
                            [pt]: Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </details>

            <hr className="ctrl-divider" />
            <p className="ctrl-section-label">Typography</p>

            <div className="ctrl-group">
              <label className="ctrl-label">Font</label>
              <select
                value={config.typography.fontFamily}
                onChange={(e) => update('typography', { fontFamily: e.target.value })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>{FONT_LABELS[f] ?? f}</option>
                ))}
              </select>
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">
                Size
                <span className="ctrl-value">{config.typography.fontSize}px</span>
              </label>
              <input
                type="range"
                min={18}
                max={96}
                value={config.typography.fontSize}
                onChange={(e) => update('typography', { fontSize: Number(e.target.value) })}
              />
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">Weight</label>
              <select
                value={config.typography.fontWeight}
                onChange={(e) =>
                  update('typography', {
                    fontWeight: e.target.value as 'regular' | 'medium' | 'bold',
                  })
                }
              >
                <option value="regular">Regular</option>
                <option value="medium">Medium</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">ORP Color</label>
              <input
                type="color"
                value={config.typography.orpHighlightColor}
                onChange={(e) => update('typography', { orpHighlightColor: e.target.value })}
              />
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">
                Letter Spacing
                <span className="ctrl-value">{config.typography.letterSpacing}em</span>
              </label>
              <input
                type="range"
                min={0}
                max={0.2}
                step={0.01}
                value={config.typography.letterSpacing}
                onChange={(e) => update('typography', { letterSpacing: Number(e.target.value) })}
              />
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">Transform</label>
              <select
                value={config.typography.textTransform}
                onChange={(e) =>
                  update('typography', {
                    textTransform: e.target.value as 'none' | 'uppercase' | 'lowercase',
                  })
                }
              >
                <option value="none">None</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
              </select>
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">Emphasis Styles</label>
              <div className="ctrl-chips">
                {EMPHASIS_OPTIONS.map((style) => (
                  <label
                    key={style}
                    className={`ctrl-chip ${config.typography.emphasisStyles.includes(style) ? 'ctrl-chip--active' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={config.typography.emphasisStyles.includes(style)}
                      onChange={(e) => {
                        const styles = e.target.checked
                          ? [...config.typography.emphasisStyles, style]
                          : config.typography.emphasisStyles.filter((s) => s !== style);
                        update('typography', { emphasisStyles: styles });
                      }}
                    />
                    {style}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* === Visual Tab (Background + Display) === */}
        {tab === 'visual' && (
          <div className="sidebar__section">
            <p className="ctrl-section-label">Background</p>

            <div className="ctrl-group">
              <label className="ctrl-label">Mode</label>
              <div className="ctrl-segmented">
                {(['solid', 'image', 'youtube'] as const).map((mode) => (
                  <button
                    key={mode}
                    className={`ctrl-segmented__btn ${config.background.mode === mode ? 'ctrl-segmented__btn--active' : ''}`}
                    onClick={() => update('background', { mode })}
                  >
                    {mode === 'youtube' ? 'YouTube' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {config.background.mode === 'solid' && (
              <div className="ctrl-group">
                <label className="ctrl-label">Color</label>
                <input
                  type="color"
                  value={config.background.solidColor}
                  onChange={(e) => update('background', { solidColor: e.target.value })}
                />
              </div>
            )}

            {config.background.mode === 'image' && (
              <>
                <div className="ctrl-group">
                  <label className="ctrl-label">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="ctrl-file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) update('background', { imageUrl: URL.createObjectURL(file) });
                    }}
                  />
                </div>
                <div className="ctrl-group">
                  <label className="ctrl-label">
                    Blur
                    <span className="ctrl-value">{config.background.imageBlur}px</span>
                  </label>
                  <input type="range" min={0} max={30} value={config.background.imageBlur}
                    onChange={(e) => update('background', { imageBlur: Number(e.target.value) })} />
                </div>
                <div className="ctrl-group">
                  <label className="ctrl-label">
                    Brightness
                    <span className="ctrl-value">{config.background.imageBrightness}</span>
                  </label>
                  <input type="range" min={0.1} max={1.5} step={0.05} value={config.background.imageBrightness}
                    onChange={(e) => update('background', { imageBrightness: Number(e.target.value) })} />
                </div>
              </>
            )}

            {config.background.mode === 'youtube' && (
              <div className="ctrl-group">
                <label className="ctrl-label">YouTube URL</label>
                <input
                  type="text"
                  className="ctrl-input"
                  placeholder="https://youtube.com/watch?v=..."
                  value={config.background.youtubeUrl}
                  onChange={(e) => update('background', { youtubeUrl: e.target.value })}
                />
                <span className="ctrl-hint">Paste any YouTube URL or video ID</span>
              </div>
            )}

            <div className="ctrl-group">
              <label className="ctrl-label">Overlay Color</label>
              <input
                type="color"
                value={config.background.overlayColor}
                onChange={(e) => update('background', { overlayColor: e.target.value })}
              />
            </div>
            <div className="ctrl-group">
              <label className="ctrl-label">
                Overlay Opacity
                <span className="ctrl-value">{config.background.overlayOpacity}</span>
              </label>
              <input type="range" min={0} max={1} step={0.05} value={config.background.overlayOpacity}
                onChange={(e) => update('background', { overlayOpacity: Number(e.target.value) })} />
            </div>

            <hr className="ctrl-divider" />
            <p className="ctrl-section-label">Display</p>

            <div className="ctrl-group">
              <label className="ctrl-label">Screen Mode</label>
              <select
                value={config.display.screenMode}
                onChange={(e) =>
                  update('display', {
                    screenMode: e.target.value as 'windowed' | 'fullscreen' | 'focus-strip',
                  })
                }
              >
                <option value="windowed">Windowed</option>
                <option value="fullscreen">Fullscreen</option>
                <option value="focus-strip">Focus Strip</option>
              </select>
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">Panel Shape</label>
              <div className="ctrl-segmented">
                {(['none', 'rectangle', 'pill', 'circle', 'star'] as const).map((shape) => (
                  <button
                    key={shape}
                    className={`ctrl-segmented__btn ${config.display.panelShape === shape ? 'ctrl-segmented__btn--active' : ''}`}
                    onClick={() => update('display', { panelShape: shape })}
                  >
                    {shape.charAt(0).toUpperCase() + shape.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">
                Panel Opacity
                <span className="ctrl-value">{config.display.panelOpacity}</span>
              </label>
              <input type="range" min={0} max={1} step={0.05} value={config.display.panelOpacity}
                onChange={(e) => update('display', { panelOpacity: Number(e.target.value) })} />
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">Progress</label>
              <div className="ctrl-segmented">
                {(['bar', 'dot', 'none'] as const).map((style) => (
                  <button
                    key={style}
                    className={`ctrl-segmented__btn ${config.display.progressBar === style ? 'ctrl-segmented__btn--active' : ''}`}
                    onClick={() => update('display', { progressBar: style })}
                  >
                    {style.charAt(0).toUpperCase() + style.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <label className="ctrl-toggle">
              <input
                type="checkbox"
                checked={config.display.guideLine}
                onChange={(e) => update('display', { guideLine: e.target.checked })}
              />
              <span>Reading guide line</span>
            </label>

            <label className="ctrl-toggle">
              <input
                type="checkbox"
                checked={config.display.testingEnabled}
                onChange={(e) => update('display', { testingEnabled: e.target.checked })}
              />
              <span>Interactive testing</span>
            </label>
            <span className="ctrl-hint">Pop quiz on inline test markers like <code>[?Q?A?B?C?2?]</code></span>

            <hr className="ctrl-divider" />

            <div className="ctrl-group">
              <label className="ctrl-label">
                Text Opacity
                <span className="ctrl-value">{config.display.textOpacity}</span>
              </label>
              <input type="range" min={0.1} max={1} step={0.05} value={config.display.textOpacity}
                onChange={(e) => update('display', { textOpacity: Number(e.target.value) })} />
            </div>

            <hr className="ctrl-divider" />
            <p className="ctrl-section-label">Text Background</p>

            <div className="ctrl-group">
              <label className="ctrl-label">Color</label>
              <input
                type="color"
                value={config.display.textBackground.color}
                onChange={(e) => update('display', {
                  textBackground: { ...config.display.textBackground, color: e.target.value },
                })}
              />
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">
                Opacity
                <span className="ctrl-value">{config.display.textBackground.opacity}</span>
              </label>
              <input type="range" min={0} max={1} step={0.05} value={config.display.textBackground.opacity}
                onChange={(e) => update('display', {
                  textBackground: { ...config.display.textBackground, opacity: Number(e.target.value) },
                })} />
            </div>

            <div className="ctrl-group">
              <label className="ctrl-label">
                Backdrop Blur
                <span className="ctrl-value">{config.display.textBackground.blur}px</span>
              </label>
              <input type="range" min={0} max={30} value={config.display.textBackground.blur}
                onChange={(e) => update('display', {
                  textBackground: { ...config.display.textBackground, blur: Number(e.target.value) },
                })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
