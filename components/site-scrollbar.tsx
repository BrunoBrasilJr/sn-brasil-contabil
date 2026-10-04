'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

export function SiteScrollbar() {
  const track = useRef<HTMLDivElement>(null);
  const dragOffset = useRef<number | null>(null);
  const [metrics, setMetrics] = useState({ height: 64, top: 0, progress: 0, visible: false, locked: false });
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const total = document.documentElement.scrollHeight;
      const available = track.current?.clientHeight || viewport;
      const height = Math.min(available, Math.max(64, available * viewport / total));
      const maximum = Math.max(0, total - viewport);
      const progress = maximum ? Math.min(1, Math.max(0, window.scrollY / maximum)) : 0;
      setMetrics({ height, top: progress * (available - height), progress: Math.round(progress * 100), visible: maximum > 2, locked: document.body.hasAttribute('data-scroll-locked') });
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    const lock = new MutationObserver(schedule);
    lock.observe(document.body, { attributes: true, attributeFilter: ['data-scroll-locked'] });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.documentElement.classList.add('custom-scrollbar-ready');
    update();
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resize.disconnect();
      lock.disconnect();
      document.documentElement.classList.remove('custom-scrollbar-ready');
    };
  }, []);

  const scrollToPointer = (clientY: number, offset: number) => {
    if (!track.current) return;
    const rect = track.current.getBoundingClientRect();
    const travel = rect.height - metrics.height;
    const progress = travel > 0 ? Math.min(1, Math.max(0, (clientY - rect.top - offset) / travel)) : 0;
    window.scrollTo({ top: progress * (document.documentElement.scrollHeight - window.innerHeight), behavior: 'instant' });
  };
  const start = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || metrics.locked) return;
    event.preventDefault();
    const thumb = (event.target as HTMLElement).closest('.site-scrollbar-thumb');
    const offset = thumb ? event.clientY - thumb.getBoundingClientRect().top : metrics.height / 2;
    dragOffset.current = offset;
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (!thumb) scrollToPointer(event.clientY, offset);
  };
  const finish = () => { dragOffset.current = null; setDragging(false); };
  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    const maximum = document.documentElement.scrollHeight - window.innerHeight;
    const positions: Record<string, number> = {
      ArrowDown: window.scrollY + 80, ArrowUp: window.scrollY - 80,
      PageDown: window.scrollY + window.innerHeight * .85, PageUp: window.scrollY - window.innerHeight * .85,
      Home: 0, End: maximum,
    };
    if (!(event.key in positions)) return;
    event.preventDefault();
    window.scrollTo({ top: Math.min(maximum, Math.max(0, positions[event.key])), behavior: 'instant' });
  };

  return <div ref={track} className={`site-scrollbar ${dragging ? 'is-dragging' : ''}`} hidden={!metrics.visible || metrics.locked} onPointerDown={start} onPointerMove={event => { if (dragOffset.current !== null) scrollToPointer(event.clientY, dragOffset.current); }} onPointerUp={finish} onPointerCancel={finish} onLostPointerCapture={finish}>
    <div className="site-scrollbar-thumb" role="scrollbar" aria-label="Rolagem da página" aria-controls="conteudo" aria-orientation="vertical" aria-valuemin={0} aria-valuemax={100} aria-valuenow={metrics.progress} tabIndex={0} onKeyDown={keyboard} style={{ height: metrics.height, transform: `translateY(${metrics.top}px)` }} />
  </div>;
}
