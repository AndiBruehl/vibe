export type CaptionPart = { text: string; href?: string; external?: boolean };

export function captionParts(text: string): CaptionPart[] {
  const parts: CaptionPart[] = [];
  const pattern = /https?:\/\/[^\s<>"']+|www\.[^\s<>"']+|@[^\s@/<>"']+/giu;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    const start = match.index!;
    const raw = match[0];
    if (start > 0 && !/[\s([{]/u.test(text[start - 1])) continue;
    let label = raw.replace(/[.,!?;:]+$/u, '');
    for (const [open, close] of [['(', ')'], ['[', ']'], ['{', '}']]) {
      while (label.endsWith(close) && label.split(close).length > label.split(open).length) label = label.slice(0, -1);
    }
    label = label.replace(/[.,!?;:]+$/u, '');
    let href: string;
    const external = !label.startsWith('@');
    if (external) {
      try {
        const url = new URL(/^www\./i.test(label) ? `https://${label}` : label);
        if (!['http:', 'https:'].includes(url.protocol) || !url.hostname || url.username || url.password) continue;
        href = url.href;
      } catch { continue; }
    } else {
      if (label.length < 2) continue;
      href = `/profile/${encodeURIComponent(label.slice(1))}`;
    }
    if (start > offset) parts.push({ text: text.slice(offset, start) });
    parts.push({ text: label, href, external });
    offset = start + label.length;
  }
  if (offset < text.length) parts.push({ text: text.slice(offset) });
  return parts;
}
