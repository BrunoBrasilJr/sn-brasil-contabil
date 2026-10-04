import { business, sectors, services } from '../content';
import { normalize } from './text';

type Fact = { id: string; matches: (text: string) => boolean; answer: () => string };
const facts: Fact[] = [
  { id: 'location', matches: text => /\b(?:endereco|localizacao|onde fica|onde voces ficam|como chegar)\b/.test(text), answer: () => `a SN fica na ${business.address}, ${business.neighborhood}. CEP ${business.cep}.` },
  { id: 'contact', matches: text => /\b(?:telefone|email|e mail|contato de voces|numero de voces|qual o whatsapp)\b/.test(text), answer: () => `você pode falar pelo WhatsApp ${business.whatsapp}, pelos telefones ${business.phone} e ${business.phone2}, ou pelo e-mail ${business.email}.` },
  { id: 'hours', matches: text => /\b(?:horario|abrem|fecham|atendem aos sabados)\b/.test(text), answer: () => 'o horário de atendimento não está informado no site. a equipe pode confirmar para você.' },
  { id: 'sectors', matches: text => /\b(?:segmentos|quem voces atendem|quem atendem|tipos de empresa|atendem industria|atendem construcao|atendem engenharia)\b/.test(text), answer: () => `o site apresenta atendimento para ${sectors.filter(sector => sector.name !== 'Outras atividades').map(sector => sector.name.toLowerCase()).join(', ')}. para outras atividades, a equipe pode confirmar o atendimento.` },
  { id: 'services', matches: text => /\b(?:quais servicos|servicos oferecidos|o que voces fazem|lista de servicos)\b/.test(text), answer: () => `estes são os serviços publicados pela SN: ${services.map(service => service.short).join(', ')}. qual deles você quer conhecer?` },
  { id: 'experience', matches: text => /\b(?:experiencia|historia da sn|sobre a sn|quem e a sn|ha quanto tempo (?:a sn|o escritorio))\b/.test(text), answer: () => 'a SN Brasil Contábil atua em São Paulo e tem mais de 25 anos de experiência, conforme a apresentação do escritório no site.' },
  { id: 'price', matches: text => /\b(?:preco|valor|quanto custa|custo|orcamento|proposta|prazo|demora)\b/.test(text), answer: () => 'a proposta depende do escopo do atendimento. a equipe precisa entender sua necessidade para confirmar valores e prazos.' },
];

export function getKnowledge(message: string): { id: string; text: string } | undefined {
  const text = normalize(message);
  const fact = facts.find(item => item.matches(text));
  return fact ? { id: fact.id, text: fact.answer() } : undefined;
}

export function needsProfessionalReview(message: string): boolean {
  return /\b(?:qual (?:o )?(?:melhor|ideal) regime|qual regime|simples nacional|lucro presumido|lucro real|quanto (?:vou|devo|tenho que) pagar|quanto pago de imposto|calcular? (?:o )?imposto|aliquota|tenho direito|posso (?:me )?aposentar|quando (?:vou|posso) (?:me )?aposentar|quanto (?:vou|posso) recuperar|garantir|garante|parecer juridico|interpretar (?:a )?lei|qual (?:a )?lei)\b/.test(normalize(message));
}
