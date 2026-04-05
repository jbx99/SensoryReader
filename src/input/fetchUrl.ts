/** Fetch article text from a URL. CORS-limited in pure SPA context. */
export async function fetchArticle(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();

  // Basic article extraction: try to find <article> or main content
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Remove scripts, styles, nav, footer
  doc.querySelectorAll('script, style, nav, footer, header, aside').forEach((el) => el.remove());

  // Try <article> first, then <main>, then fall back to <body>
  const article = doc.querySelector('article') ?? doc.querySelector('main') ?? doc.body;

  return article?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}
