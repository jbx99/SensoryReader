import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/** PDF text extraction using pdf.js — preserves word and line structure */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    // Build text preserving line structure using Y positions
    let lastY: number | null = null;
    let lastEndX = 0;
    const parts: string[] = [];

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;

      const tx = item.transform[4];
      const ty = item.transform[5];
      const itemWidth = item.width ?? 0;

      if (lastY !== null) {
        const yDiff = Math.abs(ty - lastY);
        if (yDiff > 2) {
          parts.push('\n');
        } else {
          const gap = tx - lastEndX;
          if (gap > 2) {
            parts.push(' ');
          }
        }
      }

      parts.push(item.str);
      lastY = ty;
      lastEndX = tx + itemWidth;
    }

    const pageText = parts.join('');
    if (pageText.trim()) {
      pages.push(pageText.trim());
    }
  }

  return pages.join('\n\n');
}
