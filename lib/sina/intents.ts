import { services } from '../content';
import { expressionScore, normalize } from './text';

type Signal = [expression: string, weight: number];
// These are aliases for the shared catalogue, not a second service list.
const signals: Record<string, Signal[]> = {
  contabilidade: [['contabilidade', 8], ['contador', 7], ['assessoria contabil', 9], ['trocar de contador', 11], ['mudar de contabilidade', 11], ['escrituracao', 7], ['demonstrativos', 6], ['balanco', 6]],
  'abertura-de-empresa': [['abrir empresa', 11], ['abrir minha empresa', 11], ['abertura de empresa', 11], ['abrir um cnpj', 11], ['abrir cnpj', 11], ['formalizar', 8], ['formalizacao', 8], ['tirar do papel', 8], ['comecar um negocio', 8], ['novo negocio', 7]],
  'fiscal-e-tributario': [['fiscal', 7], ['tributario', 7], ['imposto', 7], ['impostos', 7], ['nota fiscal', 8], ['notas fiscais', 8], ['declaracoes', 7], ['apuracao', 7], ['obrigacoes fiscais', 10]],
  'departamento-pessoal': [['departamento pessoal', 11], ['folha de pagamento', 11], ['folha', 8], ['funcionarios', 7], ['admissao', 7], ['desligamento', 7], ['ferias', 7], ['contratar', 7], ['primeira contratacao', 9]],
  'regularizacao-e-encerramento': [['regularizar', 9], ['regularizacao', 9], ['pendencia', 8], ['pendencias', 8], ['cnpj inapto', 11], ['encerrar empresa', 11], ['fechar empresa', 11], ['dar baixa', 9], ['encerramento', 9], ['empresa inativa', 8]],
  'certificado-digital': [['certificado digital', 12], ['certificado', 9], ['assinatura digital', 9], ['assinar digitalmente', 9], ['autenticacao digital', 9], ['e cpf', 8], ['e cnpj', 8], ['renovar certificado', 12]],
  'creditos-tributarios': [['creditos tributarios', 14], ['credito tributario', 14], ['recuperar impostos', 13], ['recuperacao de tributos', 13], ['imposto pago a mais', 13], ['tributos pagos a mais', 13], ['recuperar tributos', 13]],
  aposentadoria: [['aposentadoria', 11], ['aposentar', 11], ['aposentar me', 11], ['inss', 7], ['tempo de contribuicao', 11], ['historico de contribuicao', 11], ['requerimento administrativo', 8]],
};

export type IntentMatch = { service: string; score: number };
export function detectIntent(message: string, context?: string): { kind: 'clear' | 'ambiguous' | 'unknown'; matches: IntentMatch[] } {
  const text = normalize(message);
  const matches = services.map(service => {
    const evidence = [...(signals[service.slug] || []), [service.short, 9] as Signal]
      .map(([phrase, weight]) => {
        // Negated requests should not outweigh the subject the visitor actually wants.
        const negated = new RegExp(`\\bnao (?:quero |preciso |e |eh |sobre |mais ){0,3}${normalize(phrase)}\\b`).test(text);
        return negated ? 0 : expressionScore(text, phrase) * weight;
      }).sort((a, b) => b - a);
    const score = (evidence[0] || 0) + (evidence[1] || 0) * 0.15;
    return { service: service.slug, score: score > 0 && context === service.slug ? score + 0.8 : score };
  }).filter(match => match.score > 0).sort((a, b) => b.score - a.score);
  if (!matches.length || matches[0].score < 5) return { kind: 'unknown', matches: [] };
  if (matches[1] && matches[0].score - matches[1].score < 2.5) return { kind: 'ambiguous', matches: matches.slice(0, 3) };
  return { kind: 'clear', matches: matches.slice(0, 1) };
}
