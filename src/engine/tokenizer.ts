import type { Token, Chunk, PunctuationType } from '../types';
import { computeOrpIndex, computeChunkOrpIndex } from './orp';
import { isQuizPlaceholder } from './testParser';

const PUNCTUATION_MAP: Record<string, PunctuationType> = {
  ',': 'comma',
  '.': 'period',
  ';': 'semicolon',
  ':': 'colon',
  '?': 'question',
  '!': 'exclamation',
  '—': 'dash',
  '-': 'dash',
};

function detectPunctuation(word: string): PunctuationType | null {
  const lastChar = word[word.length - 1];
  return PUNCTUATION_MAP[lastChar] ?? null;
}

function isEmphasisWord(word: string, prevWord: string | null): boolean {
  const cleaned = word.replace(/[^a-zA-Z]/g, '');
  // Long words (7+ chars)
  if (cleaned.length >= 7) return true;
  // Proper nouns (capitalized, not sentence start — approximation)
  if (cleaned.length > 0 && cleaned[0] === cleaned[0].toUpperCase() && cleaned[0] !== cleaned[0].toLowerCase()) {
    if (prevWord && !prevWord.match(/[.!?]$/)) return true;
  }
  // Word following a colon
  if (prevWord && prevWord.endsWith(':')) return true;
  return false;
}

export function tokenize(text: string): Token[] {
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const tokens: Token[] = [];
  let sentenceIndex = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const prevWord = i > 0 ? words[i - 1] : null;
    const punctuation = detectPunctuation(word);
    const quizId = isQuizPlaceholder(word);

    tokens.push({
      word: quizId !== null ? '' : word, // quiz placeholders display as nothing
      index: i,
      sentenceIndex,
      orpIndex: quizId !== null ? 0 : computeOrpIndex(word),
      isEmphasis: quizId !== null ? false : isEmphasisWord(word, prevWord),
      punctuationAfter: punctuation,
      ...(quizId !== null ? { quizId } : {}),
    });

    if (punctuation === 'period' || punctuation === 'question' || punctuation === 'exclamation') {
      sentenceIndex++;
    }
  }

  return tokens;
}

export function groupIntoChunks(tokens: Token[], size: 1 | 2 | 3): Chunk[] {
  const chunks: Chunk[] = [];
  for (let i = 0; i < tokens.length; i += size) {
    const group = tokens.slice(i, Math.min(i + size, tokens.length));
    const words = group.map((t) => t.word);
    chunks.push({
      tokens: group,
      displayText: words.join(' '),
      orpCharIndex: computeChunkOrpIndex(words),
    });
  }
  return chunks;
}
