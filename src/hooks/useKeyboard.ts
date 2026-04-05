import { useEffect } from 'react';

interface KeyboardActions {
  onTogglePlayback: () => void;
  onRewind: () => void;
  onSkipSentence: () => void;
  onNudgeWpm: (delta: number) => void;
  onToggleFullscreen?: () => void;
  onToggleConfig?: () => void;
}

export function useKeyboard(actions: KeyboardActions) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't capture when typing in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          actions.onTogglePlayback();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          actions.onRewind();
          break;
        case 'ArrowRight':
          e.preventDefault();
          actions.onSkipSentence();
          break;
        case 'ArrowUp':
          e.preventDefault();
          actions.onNudgeWpm(25);
          break;
        case 'ArrowDown':
          e.preventDefault();
          actions.onNudgeWpm(-25);
          break;
        case 'Equal':
        case 'NumpadAdd':
          e.preventDefault();
          actions.onNudgeWpm(25);
          break;
        case 'Minus':
        case 'NumpadSubtract':
          e.preventDefault();
          actions.onNudgeWpm(-25);
          break;
        case 'KeyF':
          if (!e.metaKey && !e.ctrlKey) {
            e.preventDefault();
            actions.onToggleFullscreen?.();
          }
          break;
        case 'Escape':
          actions.onToggleConfig?.();
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
}
