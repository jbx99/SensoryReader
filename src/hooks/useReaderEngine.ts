import { useRef, useState, useCallback, useEffect } from 'react';
import type { Token, Chunk, PlaybackStatus, ReaderConfig } from '../types';
import { tokenize, groupIntoChunks } from '../engine/tokenizer';
import { adjustedDelay } from '../engine/timing';

export interface ReaderEngine {
  load: (text: string) => void;
  play: () => void;
  pause: () => void;
  togglePlayback: () => void;
  rewind: (seconds: number) => void;
  skipSentence: () => void;
  seekTo: (index: number) => void;
  nudgeWpm: (delta: number) => void;
  setWpm: (wpm: number) => void;
  currentChunk: Chunk | null;
  tokens: Token[];
  currentIndex: number;
  status: PlaybackStatus;
  effectiveWpm: number;
  totalTokens: number;
}

export function useReaderEngine(
  config: ReaderConfig,
  onConfigChange?: (config: ReaderConfig) => void,
  onQuizReached?: (quizId: number) => void
): ReaderEngine {
  const tokensRef = useRef<Token[]>([]);
  const chunksRef = useRef<Chunk[]>([]);
  const indexRef = useRef(0);
  const statusRef = useRef<PlaybackStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef = useRef(0);
  const configRef = useRef(config);
  const onConfigChangeRef = useRef(onConfigChange);
  const onQuizReachedRef = useRef(onQuizReached);
  configRef.current = config;
  onConfigChangeRef.current = onConfigChange;
  onQuizReachedRef.current = onQuizReached;

  // These trigger re-renders
  const [currentChunk, setCurrentChunk] = useState<Chunk | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<PlaybackStatus>('idle');
  const [totalTokens, setTotalTokens] = useState(0);
  const [tokens, setTokens] = useState<Token[]>([]);

  // WPM is always derived from config — single source of truth
  const effectiveWpm = config.speed.wpm;

  // Rebuild chunks immediately when chunkSize changes
  useEffect(() => {
    if (tokensRef.current.length === 0) return;
    const newChunks = groupIntoChunks(tokensRef.current, config.speed.chunkSize);
    chunksRef.current = newChunks;
    const chunkIndex = Math.floor(indexRef.current / config.speed.chunkSize);
    if (chunkIndex < newChunks.length) {
      setCurrentChunk(newChunks[chunkIndex]);
    }
  }, [config.speed.chunkSize]);

  const updateChunk = useCallback(() => {
    const chunks = chunksRef.current;
    const chunkSize = configRef.current.speed.chunkSize;
    const chunkIndex = Math.floor(indexRef.current / chunkSize);
    if (chunkIndex < chunks.length) {
      const chunk = chunks[chunkIndex];
      // Skip displaying chunks that contain only quiz placeholders
      const hasNonQuiz = chunk.tokens.some((t) => t.quizId === undefined);
      if (hasNonQuiz) {
        setCurrentChunk(chunk);
        setCurrentIndex(indexRef.current);
      }
    }
  }, []);

  const scheduleNext = useCallback(() => {
    const allTokens = tokensRef.current;
    const cfg = configRef.current.speed;
    const testingOn = configRef.current.display.testingEnabled;

    if (indexRef.current >= allTokens.length) {
      statusRef.current = 'paused';
      setStatus('paused');
      return;
    }

    // Skip past quiz placeholders if testing is disabled
    if (!testingOn) {
      while (indexRef.current < allTokens.length && allTokens[indexRef.current].quizId !== undefined) {
        indexRef.current++;
      }
      if (indexRef.current >= allTokens.length) {
        statusRef.current = 'paused';
        setStatus('paused');
        return;
      }
    }

    const token = allTokens[indexRef.current];

    // If testing is enabled and we hit a quiz token, pause and fire callback
    if (testingOn && token.quizId !== undefined) {
      statusRef.current = 'paused';
      setStatus('paused');
      onQuizReachedRef.current?.(token.quizId);
      // Advance past the quiz token so resume continues from the next word
      indexRef.current++;
      return;
    }

    const elapsed = Date.now() - startTimeRef.current;
    const delay = adjustedDelay(token, cfg, elapsed);

    timerRef.current = setTimeout(() => {
      indexRef.current += configRef.current.speed.chunkSize;
      if (indexRef.current > allTokens.length) {
        indexRef.current = allTokens.length;
      }
      updateChunk();

      if (statusRef.current === 'playing') {
        scheduleNext();
      }
    }, delay);
  }, [updateChunk]);

  const load = useCallback((text: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const newTokens = tokenize(text);
    tokensRef.current = newTokens;
    indexRef.current = 0;
    statusRef.current = 'paused';

    const chunks = groupIntoChunks(newTokens, configRef.current.speed.chunkSize);
    chunksRef.current = chunks;

    setTokens(newTokens);
    setTotalTokens(newTokens.length);
    setStatus('paused');
    setCurrentIndex(0);
    if (chunks.length > 0) {
      setCurrentChunk(chunks[0]);
    }
  }, []);

  const play = useCallback(() => {
    if (tokensRef.current.length === 0) return;
    if (indexRef.current >= tokensRef.current.length) {
      indexRef.current = 0;
      updateChunk();
    }

    chunksRef.current = groupIntoChunks(tokensRef.current, configRef.current.speed.chunkSize);

    statusRef.current = 'playing';
    setStatus('playing');
    startTimeRef.current = Date.now();
    scheduleNext();
  }, [scheduleNext, updateChunk]);

  const pause = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    statusRef.current = 'paused';
    setStatus('paused');
  }, []);

  const togglePlayback = useCallback(() => {
    if (statusRef.current === 'playing') {
      pause();
    } else {
      play();
    }
  }, [play, pause]);

  const rewind = useCallback((seconds: number) => {
    const wordsBack = Math.round((configRef.current.speed.wpm / 60) * seconds);
    indexRef.current = Math.max(0, indexRef.current - wordsBack);

    chunksRef.current = groupIntoChunks(tokensRef.current, configRef.current.speed.chunkSize);
    updateChunk();

    if (statusRef.current === 'playing') {
      if (timerRef.current) clearTimeout(timerRef.current);
      scheduleNext();
    }
  }, [updateChunk, scheduleNext]);

  const skipSentence = useCallback(() => {
    const allTokens = tokensRef.current;
    if (allTokens.length === 0) return;

    const currentSentence = allTokens[Math.min(indexRef.current, allTokens.length - 1)].sentenceIndex;
    let nextIndex = indexRef.current;
    while (nextIndex < allTokens.length && allTokens[nextIndex].sentenceIndex === currentSentence) {
      nextIndex++;
    }
    indexRef.current = Math.min(nextIndex, allTokens.length - 1);

    chunksRef.current = groupIntoChunks(tokensRef.current, configRef.current.speed.chunkSize);
    updateChunk();

    if (statusRef.current === 'playing') {
      if (timerRef.current) clearTimeout(timerRef.current);
      scheduleNext();
    }
  }, [updateChunk, scheduleNext]);

  const seekTo = useCallback((index: number) => {
    indexRef.current = Math.max(0, Math.min(index, tokensRef.current.length - 1));
    chunksRef.current = groupIntoChunks(tokensRef.current, configRef.current.speed.chunkSize);
    updateChunk();

    if (statusRef.current === 'playing') {
      if (timerRef.current) clearTimeout(timerRef.current);
      scheduleNext();
    }
  }, [updateChunk, scheduleNext]);

  // Update WPM through the config callback — keeps everything in sync
  const applyWpm = useCallback((newWpm: number) => {
    const clamped = Math.max(100, Math.min(1000, newWpm));
    const updated = {
      ...configRef.current,
      speed: { ...configRef.current.speed, wpm: clamped },
    };
    configRef.current = updated;
    onConfigChangeRef.current?.(updated);
  }, []);

  const nudgeWpm = useCallback((delta: number) => {
    applyWpm(configRef.current.speed.wpm + delta);
  }, [applyWpm]);

  const setWpm = useCallback((wpm: number) => {
    applyWpm(wpm);
  }, [applyWpm]);

  return {
    load,
    play,
    pause,
    togglePlayback,
    rewind,
    skipSentence,
    seekTo,
    nudgeWpm,
    setWpm,
    currentChunk,
    tokens,
    currentIndex,
    status,
    effectiveWpm,
    totalTokens,
  };
}
