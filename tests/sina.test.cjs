const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
// Run the actual TypeScript engine without adding any runtime dependency.
require.extensions['.ts'] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }, fileName: filename,
  });
  module._compile(compiled.outputText, filename);
};
const { services, business } = require('../lib/content.ts');
const { localEngine, pageService, serviceChoices } = require('../lib/sina/engine.ts');
const { detectIntent } = require('../lib/sina/intents.ts');
const { normalize } = require('../lib/sina/text.ts');
const { containsSensitiveData } = require('../lib/sina/privacy.ts');
const { whatsAppSummary, whatsAppHref, directWhatsApp } = require('../lib/sina/whatsapp.ts');
const { restoreSession, saveSession, clearSession } = require('../lib/sina/session.ts');
const { deliveryPlan, writingDuration, visibleCharacters, firstReplyPause } = require('../lib/sina/motion.ts');
const input = (state, text) => localEngine.reply(state, { text });
const choose = (state, value) => {
  const choice = state.choices.find(item => item.value === value);
  assert.ok(choice, `missing option: ${value}`);
  return localEngine.reply(state, { text: choice.label, choice: choice.value });
};

test('message delivery keeps the visitor immediate and finishes older replies when interrupted', () => {
  const history = [
    { id: 1, role: 'sina', text: 'oi' },
    { id: 2, role: 'visitor', text: 'abertura' },
    { id: 3, role: 'sina', text: 'o que você pretende fazer?' },
  ];
  const first = deliveryPlan(history, new Set([1]));
  assert.deepEqual(first.complete, [1, 2]);
  assert.deepEqual(first.pending.map(m => m.id), [3]);
  const interrupted = deliveryPlan([...history, { id: 4, role: 'visitor', text: 'comércio' }, { id: 5, role: 'sina', text: 'já começou?' }], new Set([1, 2]));
  assert.deepEqual(interrupted.complete, [1, 2, 3, 4]);
  assert.deepEqual(interrupted.pending.map(m => m.id), [5]);
});

test('the writing effect is bounded, keeps complete Unicode characters and reaches the full text', () => {
  for (const text of ['oi', 'orientação para a sua empresa', 'a'.repeat(600), 'café e ação']) {
    const duration = writingDuration(text);
    assert.ok(duration >= 360 && duration <= 1400);
    assert.ok(firstReplyPause + duration < 2000);
    assert.equal(visibleCharacters(text, 0), 0);
    assert.equal(visibleCharacters(text, duration), Array.from(text).length);
    assert.ok(visibleCharacters(text, duration / 2) > 0);
    assert.ok(visibleCharacters(text, duration / 2) < Array.from(text).length);
  }
});

test('the published catalogue is the only source of service choices and page context', () => {
  assert.deepEqual(serviceChoices().filter(c => c.value.startsWith('service:')).map(c => c.value.slice(8)), services.map(s => s.slug));
  for (const service of services) {
    assert.equal(pageService(`/servicos/${service.slug}/`), service.slug);
    const state = localEngine.start(`/servicos/${service.slug}`);
    assert.equal(state.service, service.slug);
    assert.ok(state.messages.some(m => m.text.includes(service.short.toLowerCase())));
  }
  for (const path of ['/', '/escritorio', '/contato', '/segmentos', '/servicos', '/servicos/inventado', '/servicos/aposentadoria/extra']) {
    assert.equal(pageService(path), undefined);
    assert.equal(localEngine.start(path).service, undefined);
  }
});

for (const service of services) test(`${service.short}: short flow, correct service and a contextual WhatsApp message`, () => {
  let state = choose(localEngine.start('/'), `service:${service.slug}`);
  let questions = 0;
  while (!state.handoff && questions < 4) {
    assert.ok(state.question);
    state = choose(state, state.choices[0].value);
    questions++;
  }
  assert.ok(state.handoff);
  assert.ok(questions <= 2);
  const url = new URL(whatsAppHref(state));
  assert.equal(url.hostname, 'wa.me');
  assert.equal(url.pathname, `/${business.whatsappNumber}`);
  assert.equal(url.searchParams.get('text'), whatsAppSummary(state));
  assert.ok(url.searchParams.get('text').includes(service.title));
  assert.ok(url.searchParams.get('text').includes('conversei com a Sina'));
  for (const answer of Object.values(state.answers)) assert.ok(url.searchParams.get('text').includes(answer));
  assert.ok(url.searchParams.get('text').length < 850);
});

test('normalization preserves the visible original and recognizes small typos', () => {
  assert.equal(normalize('  ABERTURA, de EMPRESA!  '), 'abertura de empresa');
  const samples = [
    ['Quero abrir minha empresa', 'abertura-de-empresa'], ['preciso trocar de contador', 'contabilidade'],
    ['preciso de ajuda com notas fiscais', 'fiscal-e-tributario'], ['preciso de folha de pagamento', 'departamento-pessoal'],
    ['quero regulrizar uma empresa', 'regularizacao-e-encerramento'], ['preciso de certificado digital', 'certificado-digital'],
    ['quero recuperar impostos pagos a mais', 'creditos-tributarios'], ['quero falar sobre aposentadira', 'aposentadoria'],
    ['minha contabildade está desorganizada', 'contabilidade'],
  ];
  for (const [text, slug] of samples) {
    const state = input(localEngine.start('/'), text);
    assert.equal(state.service, slug, text);
    assert.ok(state.messages.some(m => m.role === 'visitor' && m.text === text));
  }
});

test('equal evidence asks for clarification, page context never invents evidence', () => {
  const state = input(localEngine.start('/'), 'preciso de ajuda com impostos e folha');
  assert.equal(state.service, undefined);
  assert.ok(state.choices.some(c => c.value === 'service:fiscal-e-tributario'));
  assert.ok(state.choices.some(c => c.value === 'service:departamento-pessoal'));
  assert.equal(detectIntent('abacaxi', 'contabilidade').kind, 'unknown');
  assert.equal(detectIntent('não é sobre impostos, preciso de folha', undefined).matches[0].service, 'departamento-pessoal');
});

test('unknown, repeated unknown and out-of-scope requests are not forced into a service', () => {
  let state = input(localEngine.start('/'), 'quero um empréstimo');
  assert.equal(state.service, undefined);
  assert.equal(state.handoff, false);
  state = input(state, 'é sobre crédito imobiliário');
  assert.equal(state.service, undefined);
  assert.equal(state.handoff, true);
  assert.match(state.messages.at(-1).text, /não tenho certeza/);
  state = input(localEngine.start('/servicos/certificado-digital'), 'agora quero um empréstimo');
  assert.ok(state.handoff);
  assert.equal(state.service, undefined);
  assert.ok(!whatsAppSummary(state).includes('Certificado digital'));
  assert.equal(Object.keys(state.answers).length, 0);
});

test('recognizes information already supplied and does not repeat questions', () => {
  let state = input(localEngine.start('/'), 'tenho 12 funcionários e preciso de folha de pagamento');
  assert.equal(state.service, 'departamento-pessoal');
  assert.ok(state.handoff);
  assert.equal(state.answers.team, 'Já tenho funcionários');
  assert.equal(state.answers.need, 'Folha de pagamento');
  assert.ok(whatsAppSummary(state).includes('12 funcionários'));
  state = input(localEngine.start('/'), 'quero regularizar a empresa que está sem movimento');
  assert.ok(state.handoff);
  state = input(localEngine.start('/'), 'quero abrir uma empresa de comércio, ainda estou planejando');
  assert.ok(state.handoff);
  assert.equal(state.answers.activity, 'Comércio');
  state = input(localEngine.start('/'), 'tenho 12 funcionários e preciso de ajuda com impostos e folha');
  assert.equal(state.service, undefined);
  state = choose(state, 'service:departamento-pessoal');
  assert.ok(state.handoff);
  assert.ok(whatsAppSummary(state).includes('12 funcionários'));
});

test('free answers and a change of topic are supported, old service answers do not contaminate the summary', () => {
  let state = choose(localEngine.start('/'), 'service:abertura-de-empresa');
  state = input(state, 'uma pequena livraria');
  assert.equal(state.answers.activity, 'uma pequena livraria');
  state = input(state, 'agora preciso de um certificado digital para minha empresa');
  assert.equal(state.service, 'certificado-digital');
  assert.equal(state.answers.holder, 'Para uma empresa');
  assert.equal(state.question, 'purpose');
  assert.ok(!whatsAppSummary(state).includes('livraria'));
});

test('human attendance is immediate at any step and direct link asks no questions', () => {
  let state = localEngine.start('/servicos/aposentadoria');
  state = input(state, 'quero falar com um humano');
  assert.ok(state.handoff);
  assert.equal(state.question, undefined);
  assert.equal(state.choices.length, 0);
  const url = new URL(directWhatsApp);
  assert.equal(url.pathname, `/${business.whatsappNumber}`);
  assert.ok(!url.searchParams.get('text').includes('Contexto:'));
});

test('institutional answers use published data and do not invent opening hours', () => {
  let state = localEngine.start('/');
  for (const [question, included] of [['onde vocês ficam?', business.address], ['qual o telefone?', business.phone], ['quais serviços vocês oferecem?', services[0].short], ['quem vocês atendem?', 'engenharia'], ['qual o horário?', 'não está informado'], ['qual a experiência da SN?', '25 anos']]) {
    state = input(state, question);
    assert.ok(state.messages.at(-1).text.includes(included), question);
  }
  state = input(localEngine.start('/'), 'quanto custa o certificado digital?');
  assert.equal(state.service, 'certificado-digital');
  assert.ok(state.handoff);
  assert.ok(!state.messages.at(-1).text.match(/R\$|\d+ dias/));
});

test('professional advice is handed off without diagnosis, rates or promises', () => {
  for (const text of ['qual o melhor regime para minha empresa?', 'posso me aposentar com 52 anos?', 'qual a alíquota do meu imposto?', 'tenho direito a esse benefício?', 'quanto posso recuperar de créditos tributários?', 'vale Simples Nacional ou lucro real?']) {
    const state = input(localEngine.start('/'), text);
    assert.ok(state.handoff, text);
    assert.match(state.messages.at(-1).text, /análise da equipe/);
  }
});

test('sensitive information is omitted from history, answers, persisted state and WhatsApp', () => {
  for (const text of ['meu CPF é 123.456.789-00', 'minha senha é abc123', 'token: segredoabc123', 'agência 1234 conta bancária 98765', '-----BEGIN PRIVATE KEY----- segredo', 'Bearer segredo-do-token', 'meu arquivo certificado.pfx']) {
    assert.ok(containsSensitiveData(text), text);
    const state = input(localEngine.start('/'), text);
    assert.ok(state.handoff);
    assert.ok(!JSON.stringify(state).includes(text));
    assert.ok(!whatsAppSummary(state).includes(text));
    const stored = new Map();
    saveSession({ setItem: (k, v) => stored.set(k, v) }, state);
    assert.ok(![...stored.values()].join().includes(text));
  }
  assert.equal(containsSensitiveData('preciso de certificado digital para assinar documentos'), false);
});

test('session restores actual conversation, respects route context, reset and malformed or unavailable storage', () => {
  const stored = new Map();
  const storage = { setItem: (k, v) => stored.set(k, v), getItem: k => stored.get(k), removeItem: k => stored.delete(k) };
  const state = input(localEngine.start('/'), 'quero abrir uma empresa');
  saveSession(storage, state);
  assert.deepEqual(restoreSession(storage, '/contato'), JSON.parse(JSON.stringify(state)));
  clearSession(storage);
  assert.equal(restoreSession(storage, '/'), undefined);
  saveSession(storage, localEngine.start('/'));
  assert.equal(restoreSession(storage, '/servicos/aposentadoria'), undefined);
  const key = [...stored.keys()][0];
  stored.set(key, '{bad json');
  assert.equal(restoreSession(storage, '/'), undefined);
  stored.set(key, JSON.stringify({ time: Date.now(), state: { ...state, service: 'servico-inventado' } }));
  assert.equal(restoreSession(storage, '/'), undefined);
  stored.set(key, JSON.stringify({ time: Date.now(), state: { ...state, notes: ['senha: segredo123'] } }));
  assert.equal(restoreSession(storage, '/'), undefined);
  assert.doesNotThrow(() => saveSession({ setItem: () => { throw new Error('blocked'); } }, state));
  assert.equal(restoreSession({ getItem: () => { throw new Error('blocked'); } }, '/'), undefined);
});
