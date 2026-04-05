/** Compute ORP pivot index: roughly floor(length / 4) + 1, clamped */
export function computeOrpIndex(word: string): number {
  if (word.length <= 1) return 0;
  if (word.length <= 3) return 1;
  return Math.floor(word.length / 4) + 1;
}

/** For a chunk of words joined with spaces, compute ORP index within the joined string */
export function computeChunkOrpIndex(words: string[]): number {
  if (words.length === 0) return 0;
  if (words.length === 1) return computeOrpIndex(words[0]);

  // For multi-word chunks, use the ORP of the full joined text
  // so the pivot lands near the visual center
  const joined = words.join(' ');
  return computeOrpIndex(joined);
}
