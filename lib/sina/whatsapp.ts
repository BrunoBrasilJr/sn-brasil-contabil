import { business, services } from '../content';
import { containsSensitiveData } from './privacy';
import { shortText } from './text';
import type { SinaState } from './types';

export const directWhatsApp = `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent('Olá! Vim pelo site da SN Brasil Contábil e gostaria de falar com a equipe.')}`;

export function whatsAppSummary(state: SinaState): string {
  const service = services.find(item => item.slug === state.service);
  const details = [...state.notes, ...Object.values(state.answers)]
    .filter(text => !containsSensitiveData(text)).map(text => shortText(text))
    .filter((text, index, all) => text && all.indexOf(text) === index).slice(-4);
  return ['Olá! Vim pelo site da SN Brasil Contábil e conversei com a Sina.',
    service ? `Assunto: ${service.title}.` : undefined,
    details.length ? `Contexto: ${shortText(details.join('; '), 450)}` : undefined,
    'Gostaria de continuar o atendimento.'].filter(Boolean).join('\n\n');
}

export function whatsAppHref(state: SinaState): string {
  return `https://wa.me/${business.whatsappNumber}?text=${encodeURIComponent(whatsAppSummary(state))}`;
}
