import { normalize } from './text';

// Do not retain the original message when it contains identifiers or credentials.
export function containsSensitiveData(text: string): boolean {
  const plain = normalize(text);
  return /\b\d{3}[.\s]?\d{3}[.\s]?\d{3}[-\s]?\d{2}\b/.test(text) ||
    /\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[\/\s]?\d{4}[-\s]?\d{2}\b/.test(text) ||
    /\b(?:senha|password|token|chave privada)\s*(?:e\s+|eh\s+|=\s*|:\s*|do\s+\w+\s+)?\S{3,}/i.test(plain) ||
    /(?:-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----|\bBearer\s+\S+|\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.)/i.test(text) ||
    /\b(?:agencia|conta bancaria|numero do cartao|cvv)\s*(?:e\s+|eh\s+)?\d/.test(plain) ||
    /\b(?:certificado|arquivo)\b.{0,40}\.(?:pfx|p12|pem)\b/i.test(text) ||
    /\b\d{4}[ -]\d{4}[ -]\d{4}[ -]\d{4}\b/.test(text);
}

export function safeText(text: string, length = 600): string | undefined {
  if (containsSensitiveData(text)) return undefined;
  return text.trim().slice(0, length) || undefined;
}
