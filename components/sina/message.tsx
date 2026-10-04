import { memo } from 'react';
import type { SinaMessage } from '@/lib/sina/types';

export const SinaMessageBubble = memo(function SinaMessageBubble({ message, writing, characters }: {
  message: SinaMessage; writing: boolean; characters: number;
}) {
  return <div className={`sina-message sina-message-${message.role}${writing ? ' sina-message-writing' : ''}`}>
    <span className="sr-only">{message.role === 'visitor' ? 'Você: ' : 'Sina: '}</span>
    {writing ? <p className="sina-written">
      <span className="sina-text-reserve" aria-hidden="true">{message.text}</span>
      <span className="sina-text-live" aria-hidden="true">{Array.from(message.text).slice(0, characters).join('')}<i className="sina-caret" /></span>
      <span className="sr-only">{message.text}</span>
    </p> : <p>{message.text}</p>}
  </div>;
});

export function SinaTyping() {
  return <div className="sina-typing" role="status" aria-live="polite" aria-label="Sina está digitando">
    <span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" />
    <span className="sr-only">Sina está digitando</span>
  </div>;
}
