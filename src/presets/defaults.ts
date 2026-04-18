import type { Preset, ReaderConfig, SpeedConfig } from '../types';

const BASE_PUNCTUATION: SpeedConfig['punctuationMultipliers'] = {
  comma: 1.5,
  period: 2.0,
  semicolon: 1.5,
  colon: 1.5,
  question: 2.0,
  exclamation: 2.0,
  dash: 1.3,
};

const BASE_CONFIG: ReaderConfig = {
  speed: {
    wpm: 300,
    chunkSize: 1,
    punctuationMultipliers: BASE_PUNCTUATION,
    adaptiveSlowdown: true,
    rampUp: false,
  },
  typography: {
    fontFamily: 'Georgia, serif',
    fontSize: 48,
    fontWeight: 'regular',
    orpHighlightColor: '#e74c3c',
    letterSpacing: 0.02,
    textTransform: 'none',
    emphasisStyles: ['bold'],
  },
  background: {
    mode: 'solid',
    solidColor: '#1a1a2e',
    imageUrl: null,
    imageBlur: 0,
    imageBrightness: 1,
    videoUrl: null,
    videoOpacity: 0.5,
    videoPlaybackRate: 1,
    youtubeUrl: 'https://youtube.com/watch?v=vTfD20dbxho',
    overlayColor: '#000000',
    overlayOpacity: 0.7,
    overlayBorderRadius: 12,
  },
  display: {
    panelShape: 'rectangle',
    panelOpacity: 0.85,
    screenMode: 'windowed',
    progressBar: 'bar',
    guideLine: false,
    overlayPosition: { x: 50, y: 50 },
    textOpacity: 1,
    textBackground: {
      color: '#000000',
      opacity: 0.7,
      paddingX: 72,
      paddingY: 20,
      borderRadius: 12,
      blur: 12,
      widthMode: 'fixed',
      fixedWidth: 900,
    },
    testingEnabled: false,
    gazeDetectionEnabled: false,
    gazePauseTolerance: 500,
  },
};

export const DEFAULT_PRESETS: Preset[] = [
  {
    id: 'welcome',
    name: 'Welcome',
    builtIn: true,
    config: {
      ...BASE_CONFIG,
      speed: { ...BASE_CONFIG.speed, wpm: 250, rampUp: true, adaptiveSlowdown: true },
      typography: {
        ...BASE_CONFIG.typography,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 44,
        fontWeight: 'medium',
        orpHighlightColor: '#e74c3c',
      },
      background: {
        ...BASE_CONFIG.background,
        mode: 'youtube',
        youtubeUrl: 'https://www.youtube.com/watch?v=3vH-XwMDh-0',
        solidColor: '#0f0f1a',
        overlayOpacity: 0.2,
      },
      display: {
        ...BASE_CONFIG.display,
        panelShape: 'rectangle',
        textBackground: {
          ...BASE_CONFIG.display.textBackground,
          opacity: 0.8,
          blur: 16,
        },
      },
    },
  },
  {
    id: 'focus',
    name: 'Focus',
    builtIn: true,
    config: {
      ...BASE_CONFIG,
      speed: { ...BASE_CONFIG.speed, wpm: 300, rampUp: false },
      typography: {
        ...BASE_CONFIG.typography,
        fontFamily: 'Georgia, serif',
        fontSize: 52,
        orpHighlightColor: '#e74c3c',
      },
      background: {
        ...BASE_CONFIG.background,
        solidColor: '#1a1a2e',
      },
    },
  },
  {
    id: 'sprint',
    name: 'Sprint',
    builtIn: true,
    config: {
      ...BASE_CONFIG,
      speed: {
        ...BASE_CONFIG.speed,
        wpm: 600,
        adaptiveSlowdown: false,
        punctuationMultipliers: {
          comma: 1.0,
          period: 1.2,
          semicolon: 1.0,
          colon: 1.0,
          question: 1.2,
          exclamation: 1.2,
          dash: 1.0,
        },
      },
      typography: {
        ...BASE_CONFIG.typography,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        fontSize: 44,
        emphasisStyles: [],
      },
      display: {
        ...BASE_CONFIG.display,
        progressBar: 'dot',
        panelShape: 'none',
      },
    },
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    builtIn: true,
    config: {
      ...BASE_CONFIG,
      speed: { ...BASE_CONFIG.speed, wpm: 250, rampUp: true },
      typography: {
        ...BASE_CONFIG.typography,
        fontSize: 64,
        fontWeight: 'bold',
        letterSpacing: 0.05,
      },
      background: {
        ...BASE_CONFIG.background,
        mode: 'youtube',
        solidColor: '#0d0d0d',
        overlayOpacity: 0.5,
      },
      display: {
        ...BASE_CONFIG.display,
        panelShape: 'pill',
        textBackground: {
          ...BASE_CONFIG.display.textBackground,
          opacity: 0.6,
          blur: 16,
        },
      },
    },
  },
  {
    id: 'dyslexia',
    name: 'Dyslexia-friendly',
    builtIn: true,
    config: {
      ...BASE_CONFIG,
      speed: { ...BASE_CONFIG.speed, wpm: 260, adaptiveSlowdown: true },
      typography: {
        ...BASE_CONFIG.typography,
        fontFamily: '"OpenDyslexic", "Comic Sans MS", sans-serif',
        fontSize: 48,
        fontWeight: 'medium',
        letterSpacing: 0.08,
        orpHighlightColor: '#2ecc71',
        emphasisStyles: ['bold', 'size-boost'],
      },
      background: {
        ...BASE_CONFIG.background,
        solidColor: '#fdf6e3',
        overlayColor: '#fdf6e3',
        overlayOpacity: 0.95,
      },
    },
  },
  {
    id: 'night',
    name: 'Night Mode',
    builtIn: true,
    config: {
      ...BASE_CONFIG,
      speed: { ...BASE_CONFIG.speed, wpm: 300 },
      typography: {
        ...BASE_CONFIG.typography,
        fontFamily: 'Georgia, serif',
        fontSize: 48,
        orpHighlightColor: '#e67e22',
      },
      background: {
        ...BASE_CONFIG.background,
        solidColor: '#1c1410',
        overlayColor: '#2c1f14',
        overlayOpacity: 0.9,
      },
    },
  },
  {
    id: 'study',
    name: 'Study',
    builtIn: true,
    config: {
      ...BASE_CONFIG,
      speed: { ...BASE_CONFIG.speed, wpm: 250, adaptiveSlowdown: true, rampUp: false },
      typography: {
        ...BASE_CONFIG.typography,
        fontFamily: '"Atkinson Hyperlegible", -apple-system, sans-serif',
        fontSize: 46,
        fontWeight: 'medium',
        orpHighlightColor: '#3498db',
      },
      background: {
        ...BASE_CONFIG.background,
        mode: 'solid',
        solidColor: '#0d1b2a',
        overlayOpacity: 0.5,
      },
      display: {
        ...BASE_CONFIG.display,
        panelShape: 'rectangle',
        textBackground: {
          ...BASE_CONFIG.display.textBackground,
          color: '#0a1520',
          opacity: 0.9,
        },
        testingEnabled: true,
      },
    },
  },
  {
    id: 'custom',
    name: 'Custom',
    builtIn: true,
    config: { ...BASE_CONFIG },
  },
];

export function getDefaultConfig(): ReaderConfig {
  return structuredClone(BASE_CONFIG);
}
