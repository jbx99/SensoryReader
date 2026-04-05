export interface SampleText {
  id: string;
  title: string;
  author: string;
  gutenbergId: number | null;
  url: string;
}

/**
 * Sample texts from the content/stoic_library folder.
 * Gutenberg plain text is fetched at: https://www.gutenberg.org/cache/epub/{id}/pg{id}.txt
 * Non-Gutenberg sources are included with direct URLs.
 */
export const SAMPLE_LIBRARY: SampleText[] = [
  { id: 'welcome', title: 'Welcome Guide', author: 'SensoryReader', gutenbergId: null, url: 'builtin:welcome' },
  { id: 'meditations', title: 'Meditations', author: 'Marcus Aurelius', gutenbergId: 2680, url: 'https://www.gutenberg.org/ebooks/2680' },
  { id: 'enchiridion', title: 'Enchiridion', author: 'Epictetus', gutenbergId: null, url: 'https://classics.mit.edu/Epictetus/epicench.html' },
  { id: 'letters-stoic', title: 'Letters from a Stoic', author: 'Seneca', gutenbergId: 3794, url: 'https://www.gutenberg.org/ebooks/3794' },
  { id: 'the-prince', title: 'The Prince', author: 'Machiavelli', gutenbergId: 1232, url: 'https://www.gutenberg.org/ebooks/1232' },
  { id: 'discourses-livy', title: 'Discourses on Livy', author: 'Machiavelli', gutenbergId: 10827, url: 'https://www.gutenberg.org/ebooks/10827' },
  { id: 'confessions', title: 'Confessions', author: 'Augustine', gutenbergId: 3296, url: 'https://www.gutenberg.org/ebooks/3296' },
  { id: 'city-of-god', title: 'City of God', author: 'Augustine', gutenbergId: 45304, url: 'https://www.gutenberg.org/ebooks/45304' },
  { id: 'imitation-christ', title: 'The Imitation of Christ', author: 'Thomas à Kempis', gutenbergId: 1653, url: 'https://www.gutenberg.org/ebooks/1653' },
  { id: 'bible-kjv', title: 'King James Bible', author: '', gutenbergId: 10, url: 'https://www.gutenberg.org/ebooks/10' },
  { id: 'discourses', title: 'Discourses', author: 'Epictetus', gutenbergId: null, url: 'https://classics.mit.edu/Epictetus/discourses.html' },
];

/**
 * Fetch sample text. Uses Vite dev proxy (/gutenberg, /classics) to avoid CORS.
 * Returns null if fetch fails.
 */
export async function fetchSampleText(sample: SampleText): Promise<string | null> {
  // Built-in texts
  if (sample.url === 'builtin:welcome') {
    const { WELCOME_TEXT } = await import('./welcomeText');
    return WELCOME_TEXT;
  }

  if (!sample.gutenbergId) {
    // Non-Gutenberg (MIT Classics): route through /classics proxy
    try {
      const proxyPath = sample.url.replace('https://classics.mit.edu', '/classics');
      const res = await fetch(proxyPath);
      if (!res.ok) return null;
      const html = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      doc.querySelectorAll('script, style, nav, footer, header').forEach((el) => el.remove());
      const body = doc.querySelector('article') ?? doc.querySelector('main') ?? doc.body;
      return body?.textContent?.replace(/\s+/g, ' ').trim() ?? null;
    } catch {
      return null;
    }
  }

  // Gutenberg plain text via /gutenberg proxy
  const txtUrl = `/gutenberg/cache/epub/${sample.gutenbergId}/pg${sample.gutenbergId}.txt`;
  try {
    const res = await fetch(txtUrl);
    if (!res.ok) return null;
    const text = await res.text();

    // Strip Gutenberg header/footer (between *** markers)
    const startMarker = '*** START OF';
    const endMarker = '*** END OF';
    const startIdx = text.indexOf(startMarker);
    const endIdx = text.indexOf(endMarker);

    if (startIdx !== -1 && endIdx !== -1) {
      const afterStart = text.indexOf('\n', startIdx);
      return text.slice(afterStart + 1, endIdx).trim();
    }

    return text.trim();
  } catch {
    return null;
  }
}
