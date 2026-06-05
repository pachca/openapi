const DEFAULT_MAX_LENGTH = 160;

export function formatMetaDescription(
  input: string | null | undefined,
  maxLength: number = DEFAULT_MAX_LENGTH
): string | undefined {
  if (!input) return undefined;

  const lines = input.split('\n');
  const kept: string[] = [];
  let inCodeBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    if (!trimmed) continue;
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('<')) continue;

    kept.push(trimmed);
  }

  if (kept.length === 0) return undefined;

  const clean = kept
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  if (!clean) return undefined;
  return truncate(clean, maxLength);
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  const sliced = text.slice(0, maxLength);
  const lastSpace = sliced.lastIndexOf(' ');
  const cut = lastSpace > maxLength * 0.6 ? sliced.slice(0, lastSpace) : sliced;
  return cut.replace(/[.,;:!?—\-\s]+$/u, '') + '…';
}
