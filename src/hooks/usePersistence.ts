import type { DocumentRecord, UsageStats, Preset } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { useCallback } from 'react';

const DOCS_KEY = 'sensoryreader_docs';
const STATS_KEY = 'sensoryreader_stats';
const PRESETS_KEY = 'sensoryreader_presets';

const DEFAULT_STATS: UsageStats = {
  totalWordsRead: 0,
  averageWpm: 0,
  sessions: 0,
};

export function usePersistence() {
  const [documents, setDocuments] = useLocalStorage<DocumentRecord[]>(DOCS_KEY, []);
  const [stats, setStats] = useLocalStorage<UsageStats>(STATS_KEY, DEFAULT_STATS);
  const [savedPresets, setSavedPresets] = useLocalStorage<Preset[]>(PRESETS_KEY, []);

  const savePosition = useCallback(
    (contentHash: string, position: number, presetId: string) => {
      const updated = documents.map((d) =>
        d.contentHash === contentHash
          ? { ...d, position, presetId, lastOpened: Date.now() }
          : d
      );
      const exists = updated.some((d) => d.contentHash === contentHash);
      if (!exists) return; // doc must be added via addDocument first
      setDocuments(updated);
    },
    [documents, setDocuments]
  );

  const addDocument = useCallback(
    (doc: DocumentRecord) => {
      const filtered = documents.filter((d) => d.contentHash !== doc.contentHash);
      setDocuments([doc, ...filtered]);
    },
    [documents, setDocuments]
  );

  const getPosition = useCallback(
    (contentHash: string): number => {
      return documents.find((d) => d.contentHash === contentHash)?.position ?? 0;
    },
    [documents]
  );

  const updateStats = useCallback(
    (wordsRead: number, wpm: number) => {
      const newSessions = stats.sessions + 1;
      const totalWords = stats.totalWordsRead + wordsRead;
      const avgWpm = Math.round(
        (stats.averageWpm * stats.sessions + wpm) / newSessions
      );
      setStats({
        totalWordsRead: totalWords,
        averageWpm: avgWpm,
        sessions: newSessions,
      });
    },
    [stats, setStats]
  );

  return {
    documents,
    savedPresets,
    setSavedPresets,
    stats,
    savePosition,
    addDocument,
    getPosition,
    updateStats,
  };
}
