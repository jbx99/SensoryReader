import { useState, useMemo } from 'react';

interface EditTextModalProps {
  initialText: string;
  initialTitle: string;
  onSave: (text: string, title: string) => void;
  onCancel: () => void;
}

interface QuizDraft {
  question: string;
  options: string[];
  correctIndex: number;
}

const QUIZ_REGEX = /\[\?(.+?)\?\]/g;

/** Extract quizzes from text into editable drafts */
function extractQuizzes(text: string): { quizzes: QuizDraft[]; segments: string[] } {
  const quizzes: QuizDraft[] = [];
  const segments: string[] = [];
  let lastIdx = 0;
  let match;
  QUIZ_REGEX.lastIndex = 0;
  while ((match = QUIZ_REGEX.exec(text)) !== null) {
    segments.push(text.slice(lastIdx, match.index));
    const parts = match[1].split('?').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 4) {
      const correctRaw = parts[parts.length - 1];
      const correctIdx = parseInt(correctRaw, 10) - 1;
      const question = parts[0];
      const options = parts.slice(1, -1);
      if (!isNaN(correctIdx) && correctIdx >= 0 && correctIdx < options.length) {
        quizzes.push({ question, options, correctIndex: correctIdx });
      }
    }
    lastIdx = match.index + match[0].length;
  }
  segments.push(text.slice(lastIdx));
  return { quizzes, segments };
}

/** Reassemble text from segments + quiz drafts */
function reassembleText(segments: string[], quizzes: QuizDraft[]): string {
  let result = '';
  for (let i = 0; i < segments.length; i++) {
    result += segments[i];
    if (i < quizzes.length) {
      const q = quizzes[i];
      const opts = q.options.filter(o => o.trim()).map(o => o.trim()).join('?');
      result += `[?${q.question.trim()}?${opts}?${q.correctIndex + 1}?]`;
    }
  }
  return result;
}

export function EditTextModal({ initialText, initialTitle, onSave, onCancel }: EditTextModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [text, setText] = useState(initialText);
  const [showQuizHelper, setShowQuizHelper] = useState(false);

  const { quizzes, segments } = useMemo(() => extractQuizzes(text), [text]);
  const [draftQuizzes, setDraftQuizzes] = useState<QuizDraft[]>(quizzes);

  // When raw text changes, sync drafts
  const handleTextChange = (newText: string) => {
    setText(newText);
    const extracted = extractQuizzes(newText);
    setDraftQuizzes(extracted.quizzes);
  };

  const updateQuizDraft = (idx: number, patch: Partial<QuizDraft>) => {
    const newQuizzes = draftQuizzes.map((q, i) => i === idx ? { ...q, ...patch } : q);
    setDraftQuizzes(newQuizzes);
    setText(reassembleText(segments, newQuizzes));
  };

  const updateOption = (qIdx: number, optIdx: number, value: string) => {
    const q = draftQuizzes[qIdx];
    const newOpts = q.options.map((o, i) => i === optIdx ? value : o);
    updateQuizDraft(qIdx, { options: newOpts });
  };

  const addOption = (qIdx: number) => {
    const q = draftQuizzes[qIdx];
    if (q.options.length >= 4) return;
    updateQuizDraft(qIdx, { options: [...q.options, 'New option'] });
  };

  const removeOption = (qIdx: number, optIdx: number) => {
    const q = draftQuizzes[qIdx];
    if (q.options.length <= 2) return;
    const newOpts = q.options.filter((_, i) => i !== optIdx);
    let newCorrect = q.correctIndex;
    if (optIdx < newCorrect) newCorrect--;
    if (newCorrect >= newOpts.length) newCorrect = newOpts.length - 1;
    updateQuizDraft(qIdx, { options: newOpts, correctIndex: newCorrect });
  };

  const removeQuiz = (qIdx: number) => {
    const newSegments = [...segments];
    if (qIdx + 1 < newSegments.length) {
      newSegments[qIdx] = newSegments[qIdx] + newSegments[qIdx + 1];
      newSegments.splice(qIdx + 1, 1);
    }
    const newQuizzes = draftQuizzes.filter((_, i) => i !== qIdx);
    setDraftQuizzes(newQuizzes);
    setText(reassembleText(newSegments, newQuizzes));
  };

  const appendQuiz = () => {
    const marker = '[?Your question here??Option A?Option B?Option C?1?]';
    const newText = text.trim() + ' ' + marker + ' ';
    handleTextChange(newText);
  };

  const handleSave = () => {
    if (text.trim()) {
      onSave(text.trim(), title.trim() || 'Untitled');
    }
  };

  return (
    <div className="edit-modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="edit-modal">
        <div className="edit-modal__header">
          <h2>Edit Text</h2>
          <button className="edit-modal__close" onClick={onCancel}>×</button>
        </div>

        <div className="edit-modal__body">
          <label className="edit-field">
            <span className="edit-field__label">Title</span>
            <input
              type="text"
              className="edit-field__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </label>

          <label className="edit-field">
            <span className="edit-field__label">
              Text
              <span className="edit-field__hint">Use <code>[?Question?A?B?C?2?]</code> for quizzes</span>
            </span>
            <textarea
              className="edit-field__textarea"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={10}
              placeholder="Paste or type your text here..."
            />
          </label>

          <div className="edit-quiz-section">
            <div className="edit-quiz-section__header">
              <button
                className="edit-quiz-toggle"
                onClick={() => setShowQuizHelper(!showQuizHelper)}
              >
                {showQuizHelper ? '▼' : '▶'} Quizzes ({draftQuizzes.length})
              </button>
              <button className="edit-quiz-add" onClick={appendQuiz}>+ Add Quiz</button>
            </div>

            {showQuizHelper && (
              <div className="edit-quiz-list">
                {draftQuizzes.length === 0 && (
                  <p className="edit-quiz-empty">No quizzes yet. Add one or include <code>[?...?]</code> markers in your text.</p>
                )}
                {draftQuizzes.map((q, qIdx) => (
                  <div key={qIdx} className="edit-quiz-item">
                    <div className="edit-quiz-item__header">
                      <span className="edit-quiz-item__num">Q{qIdx + 1}</span>
                      <button className="edit-quiz-item__delete" onClick={() => removeQuiz(qIdx)} title="Delete">×</button>
                    </div>
                    <input
                      type="text"
                      className="edit-field__input"
                      value={q.question}
                      onChange={(e) => updateQuizDraft(qIdx, { question: e.target.value })}
                      placeholder="Question text"
                    />
                    <div className="edit-quiz-options">
                      {q.options.map((opt, optIdx) => (
                        <div key={optIdx} className="edit-quiz-option">
                          <input
                            type="radio"
                            name={`correct-${qIdx}`}
                            checked={q.correctIndex === optIdx}
                            onChange={() => updateQuizDraft(qIdx, { correctIndex: optIdx })}
                            title="Mark as correct"
                          />
                          <input
                            type="text"
                            className="edit-field__input"
                            value={opt}
                            onChange={(e) => updateOption(qIdx, optIdx, e.target.value)}
                            placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                          />
                          {q.options.length > 2 && (
                            <button
                              className="edit-quiz-option__remove"
                              onClick={() => removeOption(qIdx, optIdx)}
                              title="Remove option"
                            >×</button>
                          )}
                        </div>
                      ))}
                      {q.options.length < 4 && (
                        <button className="edit-quiz-option-add" onClick={() => addOption(qIdx)}>
                          + Add option
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="edit-modal__footer">
          <button className="edit-btn" onClick={onCancel}>Cancel</button>
          <button className="edit-btn edit-btn--primary" onClick={handleSave}>Save & Load</button>
        </div>
      </div>
    </div>
  );
}
