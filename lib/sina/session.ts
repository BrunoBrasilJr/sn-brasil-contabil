import { services } from '../content';
import { containsSensitiveData } from './privacy';
import { getFlow } from './flows';
import type { SinaState } from './types';

const key = 'sn:sina:session:v1';
const lifetime = 60 * 60 * 1000;

export function restoreSession(storage: Pick<Storage, 'getItem'>, pathname: string): SinaState | undefined {
  try {
    const raw = storage.getItem(key);
    if (!raw || raw.length > 30000) return undefined;
    const { time, state } = JSON.parse(raw);
    if (!Number.isFinite(time) || Date.now() - time > lifetime || time > Date.now() + 1000 || !state || state.version !== 1 ||
      typeof state.origin !== 'string' || !/^\/[a-z0-9/-]*$/.test(state.origin) ||
      !Array.isArray(state.messages) || state.messages.length > 40 || !state.messages.every((m: unknown) => typeof m === 'object' && m !== null &&
        typeof (m as { text?: unknown }).text === 'string' && ['sina', 'visitor'].includes((m as { role: string }).role) &&
        Number.isFinite((m as { id: number }).id) && !containsSensitiveData((m as { text: string }).text)) ||
      !Array.isArray(state.notes) || !state.notes.every((note: unknown) => typeof note === 'string' && !containsSensitiveData(note)) ||
      !state.answers || typeof state.answers !== 'object' || Array.isArray(state.answers) ||
      !Object.values(state.answers).every(answer => typeof answer === 'string' && !containsSensitiveData(answer)) ||
      typeof state.handoff !== 'boolean' || !Number.isInteger(state.misses) || state.misses < 0 ||
      (state.clarifying !== undefined && (typeof state.clarifying !== 'string' || containsSensitiveData(state.clarifying))) ||
      !Array.isArray(state.choices) || !state.choices.every((c: unknown) => typeof c === 'object' && c !== null &&
        typeof (c as { label: unknown }).label === 'string' && typeof (c as { value: unknown }).value === 'string')) return undefined;
    if (state.service && !services.some(service => service.slug === state.service)) return undefined;
    if (state.question && (!state.service || !getFlow(state.service)?.questions.some(question => question.id === state.question))) return undefined;
    // An untouched welcome is page-specific; an actual conversation retains its origin.
    if (!state.messages.some((message: { role: string }) => message.role === 'visitor') && pathname !== state.origin) return undefined;
    return state;
  } catch { return undefined; }
}

export function saveSession(storage: Pick<Storage, 'setItem'>, state: SinaState): void {
  try { storage.setItem(key, JSON.stringify({ time: Date.now(), state })); } catch { /* A blocked storage must not block attendance. */ }
}

export function clearSession(storage: Pick<Storage, 'removeItem'>): void {
  try { storage.removeItem(key); } catch { /* The in-memory reset remains available. */ }
}
