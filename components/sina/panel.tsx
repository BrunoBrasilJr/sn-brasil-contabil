'use client';

import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Dialog } from 'radix-ui';
import { ArrowUp, ExternalLink, RotateCcw, X } from 'lucide-react';
import { localEngine } from '@/lib/sina/engine';
import { clearSession, restoreSession, saveSession } from '@/lib/sina/session';
import { directWhatsApp, whatsAppHref, whatsAppSummary } from '@/lib/sina/whatsapp';
import type { SinaChoice, SinaState } from '@/lib/sina/types';
import { SinaIcon } from './icon';
import { SinaMessageBubble, SinaTyping } from './message';
import { useConversationMotion } from './use-conversation-motion';

export default function SinaPanel({ pathname, open, mobile, returnFocus }: { pathname: string; open: boolean; mobile: boolean; returnFocus: () => void }) {
  const [state, setState] = useState<SinaState>(() => localEngine.start(pathname));
  const [draft, setDraft] = useState('');
  const [failed, setFailed] = useState(false);
  const [restored, setRestored] = useState(false);
  const [resumed, setResumed] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const content = useRef<HTMLDivElement>(null);
  const history = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const follow = useRef(true);
  const motion = useConversationMotion({ messages: state.messages, open, ready: restored, resumed, epoch });

  useEffect(() => {
    try {
      const saved = restoreSession(window.sessionStorage, pathname);
      if (saved) { setState(saved); setResumed(true); }
    } catch { /* Private browsing can disable storage. */ }
    setRestored(true);
  }, []); // Restore once; changing pages must not erase a real conversation.
  useEffect(() => {
    if (!restored) return;
    try { saveSession(window.sessionStorage, state); } catch { /* Continue in memory. */ }
  }, [state, restored]);
  useEffect(() => {
    if (restored && !state.messages.some(message => message.role === 'visitor') && state.origin !== pathname) {
      setState(localEngine.start(pathname)); setEpoch(current => current + 1);
    }
  }, [pathname, restored, state]);
  useLayoutEffect(() => {
    if (history.current && open && follow.current) history.current.scrollTop = history.current.scrollHeight;
  }, [motion.messages.length, motion.phase, open, restored]);
  useEffect(() => {
    if (!open || !mobile) return;
    const viewport = window.visualViewport;
    function resize() {
      content.current?.style.setProperty('--sina-viewport-height', `${viewport?.height || window.innerHeight}px`);
      content.current?.style.setProperty('--sina-viewport-top', `${viewport?.offsetTop || 0}px`);
    }
    resize(); viewport?.addEventListener('resize', resize); viewport?.addEventListener('scroll', resize);
    return () => { viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize); };
  }, [open, mobile]);

  function send(text: string, choice?: string) {
    if (!text.trim()) return;
    follow.current = true;
    try { setState(localEngine.reply(state, { text, choice })); setDraft(''); }
    catch { setFailed(true); setDraft(''); history.current?.focus({ preventScroll: true }); return; }
    // Focus stays in the conversation when a quick option disappears.
    if (choice && mobile) history.current?.focus({ preventScroll: true });
    else input.current?.focus({ preventScroll: true });
  }
  function submit(event: FormEvent) { event.preventDefault(); send(draft); }
  function inputKey(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); send(draft); }
  }
  function reset() {
    try { clearSession(window.sessionStorage); } catch { /* Reset still works without storage. */ }
    follow.current = true;
    setState(localEngine.start(pathname)); setDraft(''); setFailed(false); setEpoch(current => current + 1);
    if (mobile) history.current?.focus({ preventScroll: true });
    else input.current?.focus({ preventScroll: true });
  }
  function choose(choice: SinaChoice) { send(choice.label, choice.value); }

  return <Dialog.Portal><Dialog.Overlay className="sina-overlay" /><Dialog.Content ref={content} className="sina-panel"
    onOpenAutoFocus={event => { event.preventDefault(); if (mobile) close.current?.focus(); else input.current?.focus({ preventScroll: true }); }}
    onCloseAutoFocus={event => { event.preventDefault(); returnFocus(); }}>
    <header className="sina-header">
      <div className="sina-mark"><SinaIcon size={26} /></div>
      <div className="sina-heading"><Dialog.Title>Sina</Dialog.Title><Dialog.Description>assistente virtual da SN Brasil Contábil</Dialog.Description></div>
      <div className="sina-header-actions"><button type="button" className="sina-icon-button" onClick={reset} aria-label="Recomeçar conversa com a Sina" title="Recomeçar"><RotateCcw size={17} /></button>
        <Dialog.Close ref={close} className="sina-icon-button" aria-label="Fechar Sina"><X size={21} /></Dialog.Close></div>
    </header>
    <div ref={history} className="sina-history" tabIndex={0} aria-label="Histórico da conversa"
      onScroll={() => { const element = history.current; if (element) follow.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80; }}>
      <div role="log" aria-live="polite" aria-relevant="additions" aria-busy={motion.busy} aria-label="Mensagens da Sina">
        {motion.messages.map(message => <SinaMessageBubble message={message} key={`${epoch}:${message.id}`}
          writing={motion.active === message.id} characters={motion.active === message.id ? motion.characters : 0} />)}
      </div>
      {!failed && motion.phase === 'waiting' && <SinaTyping />}
      {!failed && !motion.busy && state.choices.length > 0 && <div className="sina-options" aria-label="Opções de resposta">
        {state.choices.map(choice => <button type="button" key={choice.value} onClick={() => choose(choice)}>{choice.label}</button>)}
      </div>}
      {((state.handoff && !motion.busy) || failed) && <div className="sina-handoff">
        {failed && <p>não consegui continuar por aqui. você pode falar diretamente com a equipe.</p>}
        <a className="sina-continue" href={failed ? directWhatsApp : whatsAppHref(state)} target="_blank" rel="noopener noreferrer">Continuar pelo WhatsApp <ExternalLink size={15} aria-hidden="true" /></a>
        {!failed && <details className="sina-summary"><summary>Ver mensagem para a equipe</summary><p>{whatsAppSummary(state)}</p></details>}
      </div>}
    </div>
    <footer className="sina-footer">
      <a href={directWhatsApp} target="_blank" rel="noopener noreferrer" className="sina-human">Falar diretamente com a equipe <ExternalLink size={13} aria-hidden="true" /></a>
      <form className="sina-composer" onSubmit={submit}>
        <label className="sr-only" htmlFor="sina-message">Sua mensagem para a Sina</label>
        <textarea id="sina-message" ref={input} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={inputKey}
          placeholder="Escreva sua mensagem" rows={1} maxLength={600} autoComplete="off" disabled={failed} />
        <button type="submit" aria-label="Enviar mensagem" disabled={!draft.trim() || failed}><ArrowUp size={20} aria-hidden="true" /></button>
      </form>
      <p className="sina-privacy">só o assunto, sem senhas ou documentos completos.</p>
    </footer>
  </Dialog.Content></Dialog.Portal>;
}
