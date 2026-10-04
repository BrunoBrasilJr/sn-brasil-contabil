'use client';

import { Component, lazy, Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import { directWhatsApp } from '@/lib/sina/whatsapp';
import { SinaIcon } from './icon';
import './sina.css';

const SinaPanel = lazy(() => import('./panel'));

function Recovery({ failed = false, isOpen = false, returnFocus }: { failed?: boolean; isOpen?: boolean; returnFocus?: () => void }) {
  return <Dialog.Portal><Dialog.Overlay className="sina-overlay" /><Dialog.Content className="sina-panel sina-recovery"
    onCloseAutoFocus={event => { event.preventDefault(); if (failed || !isOpen) returnFocus?.(); }}>
    <Dialog.Title>Sina</Dialog.Title>
    <Dialog.Description>{failed ? 'não consegui abrir a Sina agora. você pode falar diretamente com a equipe.' : 'abrindo a Sina…'}</Dialog.Description>
    <a className="sina-continue" href={directWhatsApp} target="_blank" rel="noopener noreferrer">Falar diretamente com a equipe</a>
    <Dialog.Close className="sina-close" aria-label="Fechar Sina"><X size={20} /></Dialog.Close>
  </Dialog.Content></Dialog.Portal>;
}

class SinaBoundary extends Component<{ children: ReactNode; returnFocus: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Recovery failed returnFocus={this.props.returnFocus} /> : this.props.children; }
}

export function SinaLauncher({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [ready, setReady] = useState(false);
  const launcher = useRef<HTMLAnchorElement>(null);
  const lastPath = useRef(pathname);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 600px)');
    const update = () => setMobile(media.matches);
    update(); setReady(true); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  function changeOpen(value: boolean) { if (value) setLoaded(true); setOpen(value); }
  useEffect(() => { if (lastPath.current !== pathname) { setOpen(false); lastPath.current = pathname; } }, [pathname]);
  return <Dialog.Root open={open} onOpenChange={changeOpen} modal={mobile}>
    <a ref={launcher} href={directWhatsApp} target="_blank" rel="noopener noreferrer" className="floating-whatsapp sina-launcher"
      role="button" aria-label="Falar com a Sina" aria-haspopup="dialog" aria-expanded={open}
      data-sina-ready={ready || undefined}
      onClick={event => { event.preventDefault(); changeOpen(!open); }}
      onKeyDown={event => { if (event.key === ' ') { event.preventDefault(); changeOpen(!open); } }}>
      <span>Falar com a Sina</span><SinaIcon />
    </a>
    {loaded && <SinaBoundary returnFocus={() => launcher.current?.focus({ preventScroll: true })}><Suspense fallback={<Recovery isOpen={open} returnFocus={() => launcher.current?.focus({ preventScroll: true })} />}><SinaPanel pathname={pathname} open={open} mobile={mobile}
      returnFocus={() => launcher.current?.focus({ preventScroll: true })} /></Suspense></SinaBoundary>}
  </Dialog.Root>;
}
