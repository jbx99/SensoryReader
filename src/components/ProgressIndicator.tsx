import type { DisplayConfig, TestQuestion } from '../types';

interface ProgressIndicatorProps {
  currentIndex: number;
  totalTokens: number;
  displayConfig: DisplayConfig;
  tests?: TestQuestion[];
}

export function ProgressIndicator({
  currentIndex,
  totalTokens,
  displayConfig,
  tests = [],
}: ProgressIndicatorProps) {
  if (displayConfig.progressBar === 'none') return null;

  const progress = totalTokens > 0 ? currentIndex / totalTokens : 0;
  const showTests = displayConfig.testingEnabled && tests.length > 0;

  // Find the next upcoming quiz
  const nextQuiz = showTests ? tests.find((t) => t.position > currentIndex) : null;

  if (displayConfig.progressBar === 'dot') {
    return (
      <div className="progress-dot">
        <div className="progress-dot__indicator" style={{ left: `${progress * 100}%` }} />
        {showTests && tests.map((t) => (
          <div
            key={t.id}
            className={`progress-dot__quiz ${nextQuiz && t.id === nextQuiz.id ? 'progress-dot__quiz--next' : ''} ${t.position <= currentIndex ? 'progress-dot__quiz--passed' : ''}`}
            style={{ left: `${(t.position / totalTokens) * 100}%` }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="progress-bar">
      <div className="progress-bar__fill" style={{ width: `${progress * 100}%` }} />
      {showTests && tests.map((t) => (
        <div
          key={t.id}
          className={`progress-bar__quiz ${nextQuiz && t.id === nextQuiz.id ? 'progress-bar__quiz--next' : ''} ${t.position <= currentIndex ? 'progress-bar__quiz--passed' : ''}`}
          style={{ left: `${(t.position / totalTokens) * 100}%` }}
          title={t.question}
        />
      ))}
    </div>
  );
}
