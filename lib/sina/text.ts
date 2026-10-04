export function normalize(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Small misspellings are evidence, never a reason to force a service match.
function distance(a: string, b: string): number {
  let row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const next = [i];
    for (let j = 1; j <= b.length; j++) {
      next[j] = Math.min(next[j - 1] + 1, row[j] + 1, row[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    row = next;
  }
  return row[b.length];
}

export function expressionScore(text: string, expression: string): number {
  const phrase = normalize(expression);
  if (` ${text} `.includes(` ${phrase} `)) return 1;
  const wanted = phrase.split(' ');
  const tokens = text.split(' ');
  if (wanted.some(word => word.length < 5)) return 0;
  return wanted.every(word => tokens.some(token => Math.abs(word.length - token.length) <= 1 &&
    distance(word, token) <= (word.length >= 10 ? 2 : 1))) ? 0.75 : 0;
}

export function shortText(text: string, length = 180): string {
  const value = text.replace(/\s+/g, ' ').trim();
  return value.length > length ? `${value.slice(0, length - 1).trim()}…` : value;
}
