/** Strip HTML tags, collapse whitespace, trim */
export function cleanText(raw: string): string {
  return raw
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Generate a simple hash for document identification */
export function contentHash(text: string): string {
  const sample = text.slice(0, 1000);
  let hash = 5381;
  for (let i = 0; i < sample.length; i++) {
    hash = ((hash << 5) + hash + sample.charCodeAt(i)) | 0;
  }
  return Math.abs(hash).toString(36);
}
