import type { DocumentRecord } from '../types';

const STORAGE_KEY = 'sensoryreader_history';
const MAX_HISTORY = 20;

export function getHistory(): DocumentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(doc: DocumentRecord): void {
  const history = getHistory().filter((d) => d.contentHash !== doc.contentHash);
  history.unshift(doc);
  if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// Text cache — stores document text keyed by content hash
const TEXT_CACHE_PREFIX = 'sensoryreader_text_';
const MAX_CACHED_TEXTS = 5;

export function cacheText(contentHash: string, text: string): void {
  try {
    // Evict old entries if we have too many
    const history = getHistory();
    const cachedHashes = history.map((d) => d.contentHash);
    const toKeep = new Set(cachedHashes.slice(0, MAX_CACHED_TEXTS));

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(TEXT_CACHE_PREFIX)) {
        const hash = key.slice(TEXT_CACHE_PREFIX.length);
        if (!toKeep.has(hash)) {
          localStorage.removeItem(key);
        }
      }
    }

    localStorage.setItem(TEXT_CACHE_PREFIX + contentHash, text);
  } catch {
    // localStorage full — silently fail
  }
}

export function getCachedText(contentHash: string): string | null {
  try {
    return localStorage.getItem(TEXT_CACHE_PREFIX + contentHash);
  } catch {
    return null;
  }
}
