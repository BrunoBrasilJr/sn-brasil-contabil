import type { SinaMessage } from './types';

export const firstReplyPause = 430;
export const nextReplyPause = 160;

export function writingDuration(text: string): number {
  return Math.min(1400, Math.max(360, Array.from(text).length * 9));
}

export function visibleCharacters(text: string, elapsed: number): number {
  const length = Array.from(text).length;
  return Math.min(length, Math.max(0, Math.ceil(length * elapsed / writingDuration(text))));
}

export function deliveryPlan(messages: SinaMessage[], completed: ReadonlySet<number>): { complete: number[]; pending: SinaMessage[] } {
  const lastVisitor = messages.reduce((index, message, i) => message.role === 'visitor' ? i : index, -1);
  const complete = messages.filter((message, index) => completed.has(message.id) || index <= lastVisitor || message.role === 'visitor').map(message => message.id);
  const ready = new Set(complete);
  return { complete, pending: messages.filter(message => !ready.has(message.id) && message.role === 'sina') };
}
