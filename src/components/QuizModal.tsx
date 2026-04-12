import { useState, useEffect } from 'react';
import type { TestQuestion } from '../types';

interface QuizModalProps {
  question: TestQuestion;
  onAnswer: (correct: boolean) => void;
  onDismiss: () => void;
}

export function QuizModal({ question, onAnswer, onDismiss }: QuizModalProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  // Auto-dismiss 1.5s after answering
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(() => {
      onDismiss();
    }, 1500);
    return () => clearTimeout(t);
  }, [revealed, onDismiss]);

  const handleSelect = (idx: number) => {
    if (revealed) return;
    setSelected(idx);
    setRevealed(true);
    onAnswer(idx === question.correctIndex);
  };

  const handleSkip = () => {
    onDismiss();
  };

  return (
    <div className="quiz-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onDismiss(); }}>
      <div className="quiz-modal">
        <div className="quiz-modal__label">Quick Check</div>
        <h2 className="quiz-modal__question">{question.question}</h2>

        <div className="quiz-modal__options">
          {question.options.map((opt, i) => {
            const isSelected = selected === i;
            const isCorrect = i === question.correctIndex;
            let cls = 'quiz-option';
            if (revealed) {
              if (isCorrect) cls += ' quiz-option--correct';
              else if (isSelected) cls += ' quiz-option--wrong';
              else cls += ' quiz-option--dim';
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleSelect(i)}
                disabled={revealed}
              >
                <span className="quiz-option__letter">{String.fromCharCode(65 + i)}</span>
                <span className="quiz-option__text">{opt}</span>
                {revealed && isCorrect && (
                  <svg className="quiz-option__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                )}
                {revealed && isSelected && !isCorrect && (
                  <svg className="quiz-option__icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                )}
              </button>
            );
          })}
        </div>

        {!revealed && (
          <button className="quiz-modal__skip" onClick={handleSkip}>
            Skip
          </button>
        )}
      </div>
    </div>
  );
}
