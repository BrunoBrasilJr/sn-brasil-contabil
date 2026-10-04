import { services } from '../content';
import { getFlow } from './flows';
import { detectIntent } from './intents';
import { getKnowledge, needsProfessionalReview } from './knowledge';
import { containsSensitiveData } from './privacy';
import { normalize, shortText } from './text';
import type { SinaChoice, SinaEngine, SinaInput, SinaState } from './types';

export const serviceChoices = (): SinaChoice[] => [...services.map(service => ({ label: service.short, value: `service:${service.slug}` })), { label: 'Outro assunto', value: 'other' }];
export function pageService(pathname: string): string | undefined {
  const match = pathname.replace(/\/$/, '').match(/^\/servicos\/([^/]+)$/);
  return match && services.some(service => service.slug === match[1]) ? match[1] : undefined;
}

function say(state: SinaState, text: string, role: 'sina' | 'visitor' = 'sina'): void {
  const id = (state.messages[state.messages.length - 1]?.id || 0) + 1;
  state.messages.push({ id, role, text });
  state.messages = state.messages.slice(-40);
}
function handoff(state: SinaState, text: string): SinaState {
  state.question = undefined;
  state.clarifying = undefined;
  state.choices = [];
  state.handoff = true;
  say(state, text);
  return state;
}
function askNext(state: SinaState, reaction?: string): SinaState {
  const flow = state.service ? getFlow(state.service) : undefined;
  const question = flow?.questions.find(item => !state.answers[item.id]);
  state.handoff = false;
  state.question = question?.id;
  state.choices = (question?.options || []).map((label, index) => ({ label, value: `answer:${question!.id}:${index}` }));
  if (!question) return handoff(state, 'já tenho um contexto para a equipe. você pode continuar pelo WhatsApp e complementar o que precisar por lá.');
  say(state, `${reaction ? `${reaction} ` : ''}${question.text}`);
  return state;
}
function absorb(state: SinaState, text: string): void {
  const normalized = normalize(text);
  const flow = state.service ? getFlow(state.service) : undefined;
  for (const question of flow?.questions || []) {
    const found = question.recognize?.find(item => item.pattern.test(normalized));
    if (found && !state.answers[question.id]) state.answers[question.id] = found.answer;
  }
}
function startService(state: SinaState, slug: string, text?: string): SinaState {
  const flow = getFlow(slug);
  if (!flow) return state;
  const changed = state.service !== slug;
  const supplied = text || state.clarifying;
  state.clarifying = undefined;
  if (changed) { state.answers = {}; state.notes = []; }
  state.service = slug;
  state.misses = 0;
  if (supplied) { state.notes.push(shortText(supplied)); absorb(state, supplied); }
  return askNext(state, flow.opening);
}

function start(pathname: string): SinaState {
  const state: SinaState = { version: 1, origin: pathname, answers: {}, notes: [], messages: [], choices: serviceChoices(), handoff: false, misses: 0 };
  say(state, 'oi, eu sou a Sina');
  const slug = pageService(pathname);
  if (slug) {
    const service = services.find(item => item.slug === slug)!;
    say(state, `vi que você está olhando ${service.short.toLowerCase()}.`);
    return startService(state, slug);
  }
  say(state, 'me conta o que você precisa resolver');
  return state;
}

function reply(previous: SinaState, input: SinaInput): SinaState {
  const text = input.text.trim().slice(0, 600);
  if (!text) return previous;
  const state: SinaState = { ...previous, answers: { ...previous.answers }, notes: [...previous.notes], messages: [...previous.messages], choices: [] };
  if (containsSensitiveData(text)) {
    say(state, 'mensagem com dados sensíveis omitida', 'visitor');
    return handoff(state, 'para proteger seus dados, não envie senhas, documentos completos ou dados bancários aqui. essa mensagem não foi guardada. fale com a equipe para combinar o canal adequado.');
  }
  say(state, text, 'visitor');
  const plain = normalize(text);
  if (/\b(?:humano|pessoa de verdade|atendente|falar com (?:a )?equipe|diretamente com (?:a )?equipe|whatsapp)\b/.test(plain)) {
    return handoff(state, 'claro. você pode falar diretamente com a equipe, sem responder mais nada.');
  }
  if (input.choice?.startsWith('service:')) return startService(state, input.choice.slice(8));
  state.clarifying = undefined;
  if (input.choice === 'other') {
    state.service = undefined; state.question = undefined; state.answers = {}; state.notes = []; state.handoff = false;
    say(state, 'me conta o assunto. se eu não souber, te encaminho para a equipe confirmar.');
    return state;
  }
  if (needsProfessionalReview(text)) {
    const match = detectIntent(text, state.service);
    if (match.kind === 'clear') {
      const slug = match.matches[0].service;
      if (state.service !== slug) { state.answers = {}; state.notes = []; }
      state.service = slug;
    }
    state.notes.push(shortText(text));
    return handoff(state, 'isso depende da sua situação e precisa de uma análise da equipe. posso levar sua dúvida para eles, sem antecipar um resultado.');
  }
  const knowledge = getKnowledge(text);
  if (knowledge) {
    if (knowledge.id === 'price') {
      const match = detectIntent(text, state.service);
      if (match.kind === 'clear') {
        if (state.service !== match.matches[0].service) { state.answers = {}; state.notes = []; }
        state.service = match.matches[0].service;
      }
      state.notes.push(shortText(text));
    }
    say(state, knowledge.text);
    state.choices = state.service && state.question ? [{ label: 'Continuar sobre esse serviço', value: 'resume' }] : serviceChoices();
    if (knowledge.id === 'price' || knowledge.id === 'hours') state.handoff = true;
    return state;
  }
  if (input.choice === 'resume') return askNext(state);
  const intent = detectIntent(text, state.service || pageService(state.origin));
  if (intent.kind === 'ambiguous' && !input.choice?.startsWith('answer:')) {
    say(state, 'quero entender qual assunto vem primeiro. é sobre qual destes serviços?');
    state.choices = intent.matches.map(match => ({ label: services.find(service => service.slug === match.service)!.short, value: `service:${match.service}` }));
    state.choices.push({ label: 'Outro assunto', value: 'other' });
    state.notes.push(shortText(text));
    state.clarifying = text;
    return state;
  }
  if (intent.kind === 'clear' && intent.matches[0].service !== state.service) return startService(state, intent.matches[0].service, text);
  const flow = state.service ? getFlow(state.service) : undefined;
  const question = flow?.questions.find(item => item.id === state.question);
  if (question) {
    if (/^(?:oi|ola|bom dia|boa tarde|boa noite|obrigad[oa]|nao entendi)$/.test(plain)) return askNext(state, 'sem pressa.');
    if (/\b(?:outro assunto|mudar de assunto|agora quero|agora preciso|quero (?:um |uma )?(?:site|emprestimo|projeto)|preciso (?:de )?(?:um |uma )?(?:site|emprestimo|projeto))\b/.test(plain) && intent.kind === 'unknown') {
      state.service = undefined; state.answers = {}; state.notes = [shortText(text)];
      state.question = undefined;
      return handoff(state, 'não tenho certeza se a SN atende esse assunto. você pode falar com a equipe para confirmar.');
    }
    const selected = input.choice?.match(/^answer:([^:]+):(\d+)$/);
    if (selected && selected[1] === question.id && question.options?.[Number(selected[2])]) {
      state.answers[question.id] = question.options[Number(selected[2])];
    } else {
      state.answers[question.id] = shortText(text);
      absorb(state, text);
    }
    state.misses = 0;
    return askNext(state, 'entendi.');
  }
  if (intent.kind === 'clear') return startService(state, intent.matches[0].service, text);
  if (/^(?:oi|ola|bom dia|boa tarde|boa noite)$/.test(plain)) {
    say(state, 'oi. me conta o que você precisa resolver, ou escolha um assunto abaixo.');
    state.choices = serviceChoices();
    return state;
  }
  state.misses += 1;
  state.notes.push(shortText(text));
  if (state.misses >= 2) return handoff(state, 'não quero te orientar errado. não tenho certeza se a SN atende esse assunto. a equipe pode confirmar pelo WhatsApp.');
  say(state, 'ainda não consegui identificar o assunto. você pode contar um pouco mais ou escolher um serviço abaixo?');
  state.choices = serviceChoices();
  state.handoff = false;
  return state;
}

// The UI depends on this contract, so another engine can be plugged in later.
export const localEngine: SinaEngine = { start, reply };
