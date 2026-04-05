import type { Token, SpeedConfig } from '../types';

/** Base delay in ms for a given WPM */
export function baseDelay(wpm: number): number {
  return 60000 / wpm;
}

/** Adjusted delay accounting for punctuation, long words, and ramp-up */
export function adjustedDelay(
  token: Token,
  config: SpeedConfig,
  elapsedMs: number
): number {
  let delay = baseDelay(config.wpm);

  // Punctuation pause multiplier
  if (token.punctuationAfter) {
    const multiplier = config.punctuationMultipliers[token.punctuationAfter] ?? 1;
    delay *= multiplier;
  }

  // Adaptive slowdown for long words
  if (config.adaptiveSlowdown) {
    const len = token.word.replace(/[^a-zA-Z]/g, '').length;
    if (len >= 10) {
      delay *= 1.4;
    } else if (len >= 7) {
      delay *= 1.2;
    }
  }

  // Ramp-up: start 20% slower, accelerate to target over 10 seconds
  if (config.rampUp && elapsedMs < 10000) {
    const rampFactor = 1.2 - 0.2 * (elapsedMs / 10000);
    delay *= rampFactor;
  }

  return delay;
}
