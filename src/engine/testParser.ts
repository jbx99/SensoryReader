/**
 * Interactive test markers in text use the format:
 *
 *   [?Question text?Option A?Option B?Option C?2?]
 *
 * Where the trailing number (1-based) is the index of the correct option.
 * 2-4 options supported. The marker is removed from the displayed text and
 * replaced with a special placeholder word that fires a quiz when reached.
 *
 * Example:
 *   "The sky is blue. [?What color is the sky??Red?Blue?Green?2?] Now continue..."
 */

export interface TestQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number; // 0-based
  position: number; // word index in the cleaned text
}

export interface ParsedText {
  text: string;        // text with markers removed
  tests: TestQuestion[]; // test data with positions
}

const TEST_REGEX = /\[\?(.+?)\?\]/g;

export function parseTestMarkers(rawText: string): ParsedText {
  const tests: TestQuestion[] = [];
  let counter = 0;

  // First pass: extract markers, replace with placeholder
  const cleaned = rawText.replace(TEST_REGEX, (_match, inner: string) => {
    const parts = inner.split('?').map(s => s.trim()).filter(Boolean);
    if (parts.length < 4) return ''; // need question + 2 options + correct

    const correctRaw = parts[parts.length - 1];
    const correctIdx = parseInt(correctRaw, 10) - 1;
    if (isNaN(correctIdx)) return '';

    const question = parts[0];
    const options = parts.slice(1, -1);

    if (correctIdx < 0 || correctIdx >= options.length) return '';
    if (options.length < 2) return '';

    tests.push({
      id: `q${counter++}`,
      question,
      options,
      correctIndex: correctIdx,
      position: -1, // will be set in second pass
    });

    // Replace with a placeholder word that the tokenizer can detect
    return ` __QUIZ_${counter - 1}__ `;
  });

  // Second pass: find positions of placeholders in word array
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  let testIdx = 0;
  for (let i = 0; i < words.length; i++) {
    const m = words[i].match(/^__QUIZ_(\d+)__$/);
    if (m) {
      const id = parseInt(m[1], 10);
      if (tests[id]) {
        tests[id].position = i;
      }
      testIdx++;
    }
  }

  return { text: cleaned, tests };
}

/** Strip all test markers from text without recording them (for when testing is disabled) */
export function stripTestMarkers(rawText: string): string {
  return rawText.replace(TEST_REGEX, ' ').replace(/\s+/g, ' ').trim();
}

/** Check if a word is a quiz placeholder */
export function isQuizPlaceholder(word: string): number | null {
  const m = word.match(/^__QUIZ_(\d+)__$/);
  return m ? parseInt(m[1], 10) : null;
}
