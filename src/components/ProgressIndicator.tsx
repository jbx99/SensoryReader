import type { DisplayConfig } from '../types';

interface ProgressIndicatorProps {
  currentIndex: number;
  totalTokens: number;
  displayConfig: DisplayConfig;
}

export function ProgressIndicator({
  currentIndex,
  totalTokens,
  displayConfig,
}: ProgressIndicatorProps) {
  if (displayConfig.progressBar === 'none') return null;

  const progress = totalTokens > 0 ? currentIndex / totalTokens : 0;

  if (displayConfig.progressBar === 'dot') {
    return (
      <div className="progress-dot">
        <div
          className="progress-dot__indicator"
          style={{ left: `${progress * 100}%` }}
        />
      </div>
    );
  }

  return (
    <div className="progress-bar">
      <div
        className="progress-bar__fill"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  );
}
