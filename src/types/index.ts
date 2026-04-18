// === Engine types ===

export interface Token {
  word: string;
  index: number;
  sentenceIndex: number;
  orpIndex: number;
  isEmphasis: boolean;
  punctuationAfter: PunctuationType | null;
  quizId?: number;  // if this token is a quiz placeholder, its quiz ID
}

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  position: number;
}

export type PunctuationType =
  | 'comma'
  | 'period'
  | 'semicolon'
  | 'colon'
  | 'question'
  | 'exclamation'
  | 'dash';

export interface Chunk {
  tokens: Token[];
  displayText: string;
  orpCharIndex: number;
}

// === Configuration types ===

export interface SpeedConfig {
  wpm: number;
  chunkSize: 1 | 2 | 3;
  punctuationMultipliers: Record<PunctuationType, number>;
  adaptiveSlowdown: boolean;
  rampUp: boolean;
}

export interface TypographyConfig {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'regular' | 'medium' | 'bold';
  orpHighlightColor: string;
  letterSpacing: number;
  textTransform: 'none' | 'uppercase' | 'lowercase';
  emphasisStyles: EmphasisStyle[];
}

export type EmphasisStyle = 'size-boost' | 'bold' | 'italic' | 'color-flash' | 'glow';

export interface BackgroundConfig {
  mode: 'solid' | 'image' | 'video' | 'youtube';
  solidColor: string;
  imageUrl: string | null;
  imageBlur: number;
  imageBrightness: number;
  videoUrl: string | null;
  videoOpacity: number;
  videoPlaybackRate: number;
  youtubeUrl: string;
  overlayColor: string;
  overlayOpacity: number;
  overlayBorderRadius: number;
}

export interface OverlayPosition {
  x: number;   // percentage from left (0-100)
  y: number;   // percentage from top (0-100)
}

export interface TextBackgroundConfig {
  color: string;
  opacity: number;
  paddingX: number;       // horizontal padding in px
  paddingY: number;       // vertical padding in px
  borderRadius: number;
  blur: number;           // backdrop blur in px
  widthMode: 'variable' | 'fixed';  // variable = padding-based, fixed = set width
  fixedWidth: number;     // fixed width in px (used when widthMode is 'fixed')
}

export interface DisplayConfig {
  panelShape: 'none' | 'pill' | 'rectangle' | 'circle' | 'star';
  panelOpacity: number;
  screenMode: 'windowed' | 'fullscreen' | 'focus-strip';
  progressBar: 'dot' | 'bar' | 'none';
  guideLine: boolean;
  overlayPosition: OverlayPosition;
  textOpacity: number;       // 0-1
  textBackground: TextBackgroundConfig;
  testingEnabled: boolean;   // pop quiz on test markers
  gazeDetectionEnabled: boolean;   // auto-pause when user looks away
  gazePauseTolerance: number;      // ms before pausing on lost gaze
}

export interface ReaderConfig {
  speed: SpeedConfig;
  typography: TypographyConfig;
  background: BackgroundConfig;
  display: DisplayConfig;
}

export interface Preset {
  id: string;
  name: string;
  builtIn: boolean;
  config: ReaderConfig;
}

// === Playback state ===

export type PlaybackStatus = 'idle' | 'playing' | 'paused';

export interface ReaderState {
  tokens: Token[];
  currentIndex: number;
  status: PlaybackStatus;
  currentWpm: number;
}

// === Persistence ===

export interface DocumentRecord {
  contentHash: string;
  title: string;
  position: number;
  presetId: string;
  lastOpened: number;
  wordCount: number;
}

export interface UsageStats {
  totalWordsRead: number;
  averageWpm: number;
  sessions: number;
}
