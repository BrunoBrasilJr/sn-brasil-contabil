'use client';

import { useEffect, useRef, useState } from 'react';
import { deliveryPlan, firstReplyPause, nextReplyPause, visibleCharacters, writingDuration } from '@/lib/sina/motion';
import type { SinaMessage } from '@/lib/sina/types';

type Delivery = { complete: number[]; active?: number; characters: number; phase: 'idle' | 'waiting' | 'writing' };
const idle: Delivery = { complete: [], characters: 0, phase: 'idle' };

export function useConversationMotion({ messages, open, ready, resumed, epoch }: {
  messages: SinaMessage[]; open: boolean; ready: boolean; resumed: boolean; epoch: number;
}) {
  const [delivery, setDelivery] = useState<Delivery>(idle);
  const [reduced, setReduced] = useState(false);
  const completed = useRef(new Set<number>());
  const lastEpoch = useRef(epoch);
  const initialized = useRef(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let frame: number | undefined;
    if (lastEpoch.current !== epoch) {
      completed.current.clear(); lastEpoch.current = epoch; initialized.current = false;
    }
    if (!ready) return;
    const restoredHistory = !initialized.current && resumed && epoch === 0;
    initialized.current = true;

    function stop() {
      stopped = true;
      if (timer !== undefined) clearTimeout(timer);
      if (frame !== undefined) cancelAnimationFrame(frame);
    }
    function finish() {
      stop(); completed.current = new Set(messages.map(message => message.id));
      setDelivery({ ...idle, complete: [...completed.current] });
    }
    if (!open || reduced || restoredHistory || document.hidden) { finish(); return stop; }

    const plan = deliveryPlan(messages, completed.current);
    completed.current = new Set(plan.complete);
    if (!plan.pending.length) { setDelivery({ ...idle, complete: plan.complete }); return stop; }

    function next(index: number) {
      if (stopped) return;
      const message = plan.pending[index];
      if (!message) { setDelivery({ ...idle, complete: [...completed.current] }); return; }
      setDelivery({ complete: [...completed.current], phase: 'waiting', characters: 0 });
      timer = setTimeout(() => {
        if (stopped) return;
        const start = performance.now();
        const duration = writingDuration(message.text);
        function write(now: number) {
          if (stopped) return;
          const elapsed = now - start;
          if (elapsed >= duration) {
            completed.current.add(message.id);
            next(index + 1);
            return;
          }
          setDelivery({ complete: [...completed.current], active: message.id, phase: 'writing', characters: visibleCharacters(message.text, elapsed) });
          frame = requestAnimationFrame(write);
        }
        frame = requestAnimationFrame(write);
      }, index === 0 ? firstReplyPause : nextReplyPause);
    }
    next(0);
    const visibility = () => { if (document.hidden) finish(); };
    document.addEventListener('visibilitychange', visibility);
    return () => { stop(); document.removeEventListener('visibilitychange', visibility); };
  }, [messages, open, ready, resumed, epoch, reduced]);

  const sameEpoch = lastEpoch.current === epoch;
  const current = deliveryPlan(messages, new Set(sameEpoch ? delivery.complete : []));
  const visible = new Set(current.complete);
  const active = sameEpoch && current.pending.some(message => message.id === delivery.active) ? delivery.active : undefined;
  const waitingForDelivery = ready && open && current.pending.length > 0;
  return {
    messages: messages.filter(message => visible.has(message.id) || active === message.id),
    active,
    characters: delivery.characters,
    phase: delivery.phase === 'writing' && active !== undefined ? 'writing' : waitingForDelivery ? 'waiting' : delivery.phase,
    busy: !ready || waitingForDelivery || delivery.phase !== 'idle',
  };
}
