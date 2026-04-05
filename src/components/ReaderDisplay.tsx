import type { Chunk, TypographyConfig, DisplayConfig } from '../types';

interface ReaderDisplayProps {
  chunk: Chunk | null;
  typography: TypographyConfig;
  display: DisplayConfig;
}

export function ReaderDisplay({ chunk, typography, display }: ReaderDisplayProps) {
  const fontWeightMap = {
    regular: 400,
    medium: 500,
    bold: 700,
  } as const;

  const textStyle: React.CSSProperties = {
    fontFamily: typography.fontFamily,
    fontSize: `${typography.fontSize}px`,
    fontWeight: fontWeightMap[typography.fontWeight],
    letterSpacing: `${typography.letterSpacing}em`,
    textTransform: typography.textTransform === 'none' ? undefined : typography.textTransform,
    opacity: display.textOpacity,
  };

  if (!chunk) {
    return (
      <div className="reader-display">
        <div className="reader-orp-container" style={textStyle}>
          <span className="reader-orp-before" />
          <span className="reader-orp-pivot reader-word--placeholder">&middot;</span>
          <span className="reader-orp-after" />
        </div>
      </div>
    );
  }

  const text = chunk.displayText;
  const pivot = chunk.orpCharIndex;
  const before = text.slice(0, pivot);
  const orpChar = text[pivot] ?? '';
  const after = text.slice(pivot + 1);

  const isEmphasis = chunk.tokens.some((t) => t.isEmphasis);
  const emphasisClass = isEmphasis
    ? typography.emphasisStyles.map((s) => `emphasis--${s}`).join(' ')
    : '';

  return (
    <div className="reader-display">
      <div className="reader-orp-tick" style={{ borderColor: typography.orpHighlightColor }} />
      <div
        className={`reader-orp-container ${emphasisClass}`}
        style={textStyle}
      >
        <span className="reader-orp-before">{before}</span>
        <span
          className="reader-orp-pivot"
          style={{ color: typography.orpHighlightColor }}
        >
          {orpChar}
        </span>
        <span className="reader-orp-after">{after}</span>
      </div>
    </div>
  );
}
