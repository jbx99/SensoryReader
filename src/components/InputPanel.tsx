import { useState, useRef } from 'react';
import type { DocumentRecord } from '../types';
import { cleanText } from '../input/parseText';
import { SAMPLE_LIBRARY, fetchSampleText } from '../data/sampleLibrary';
import type { SampleText } from '../data/sampleLibrary';

interface InputPanelProps {
  onLoadText: (text: string, title: string) => void;
  recentDocuments: DocumentRecord[];
  onResumeDocument: (doc: DocumentRecord) => void;
}

export function InputPanel({ onLoadText, recentDocuments, onResumeDocument }: InputPanelProps) {
  const [pasteText, setPasteText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState<string | false>(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handlePaste = () => {
    const cleaned = cleanText(pasteText);
    if (cleaned) {
      onLoadText(cleaned, `Pasted text (${cleaned.split(/\s+/).length} words)`);
      setPasteText('');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setLoading('Reading file...');

    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const { extractTextFromPdf } = await import('../input/parsePdf');
        const text = await extractTextFromPdf(file);
        onLoadText(cleanText(text), file.name);
      } else {
        const text = await file.text();
        onLoadText(cleanText(text), file.name);
      }
    } catch (err) {
      setError(`Failed to read file: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUrl = async () => {
    if (!urlInput.trim()) return;
    setError(null);
    setLoading('Fetching URL...');

    try {
      const { fetchArticle } = await import('../input/fetchUrl');
      const text = await fetchArticle(urlInput.trim());
      if (text) {
        onLoadText(text, urlInput.trim());
        setUrlInput('');
      } else {
        setError('No text content found at this URL');
      }
    } catch (err) {
      setError(`Failed to fetch URL: ${err instanceof Error ? err.message : 'CORS or network error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSampleClick = async (sample: SampleText) => {
    setError(null);
    setLoading(`Fetching "${sample.title}"...`);

    try {
      const text = await fetchSampleText(sample);
      if (text) {
        const title = sample.author
          ? `${sample.title} — ${sample.author}`
          : sample.title;
        onLoadText(cleanText(text), title);
      } else {
        setError(`Could not fetch "${sample.title}". This may be due to CORS restrictions.`);
      }
    } catch (err) {
      setError(`Failed to fetch: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="input-panel">
      <h1 className="input-panel__title">SensoryReader</h1>
      <p className="input-panel__subtitle">Speed reading with optimal recognition point alignment</p>

      {/* Sample Library */}
      <div className="input-section">
        <h3>Sample Library</h3>
        <div className="sample-grid">
          {SAMPLE_LIBRARY.map((sample) => (
            <button
              key={sample.id}
              className="sample-card"
              onClick={() => handleSampleClick(sample)}
              disabled={!!loading}
            >
              <span className="sample-card__title">{sample.title}</span>
              {sample.author && (
                <span className="sample-card__author">{sample.author}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="input-section">
        <h3>Paste Text</h3>
        <textarea
          className="input-textarea"
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder="Paste your text here..."
          rows={6}
        />
        <button className="input-btn" onClick={handlePaste} disabled={!pasteText.trim()}>
          Load Text
        </button>
      </div>

      <div className="input-section">
        <h3>Upload File</h3>
        <input
          ref={fileRef}
          type="file"
          accept=".txt,.text,.pdf,.md"
          onChange={handleFileUpload}
          className="input-file"
        />
        <div
          className="input-dropzone"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('input-dropzone--active'); }}
          onDragLeave={(e) => { e.currentTarget.classList.remove('input-dropzone--active'); }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('input-dropzone--active');
            const file = e.dataTransfer.files[0];
            if (file && fileRef.current) {
              const dt = new DataTransfer();
              dt.items.add(file);
              fileRef.current.files = dt.files;
              fileRef.current.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }}
        >
          <span className="input-dropzone__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          </span>
          <span className="input-dropzone__text">Click or drag to upload</span>
          <span className="input-dropzone__formats">PDF, TXT, MD</span>
        </div>
      </div>

      <div className="input-section">
        <h3>Fetch URL</h3>
        <div className="input-url-row">
          <input
            type="url"
            className="input-url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com/article"
            onKeyDown={(e) => e.key === 'Enter' && handleUrl()}
          />
          <button className="input-btn" onClick={handleUrl} disabled={!urlInput.trim()}>
            Fetch
          </button>
        </div>
      </div>

      {loading && <p className="input-loading">{loading}</p>}
      {error && <p className="input-error">{error}</p>}

      {recentDocuments.length > 0 && (
        <div className="input-section">
          <h3>Recent</h3>
          <ul className="input-history">
            {recentDocuments.map((doc) => (
              <li key={doc.contentHash}>
                <button
                  className="input-history__item"
                  onClick={() => onResumeDocument(doc)}
                >
                  <span className="input-history__title">{doc.title}</span>
                  <span className="input-history__meta">
                    {doc.wordCount} words · {Math.round((doc.position / doc.wordCount) * 100)}%
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
