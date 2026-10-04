import { services } from '../content';
import type { SinaFlow } from './types';

const activityRecognize = [{ pattern: /(?:prestacao de servicos|presto servicos|prestar servicos)/, answer: 'Prestação de serviços' }, { pattern: /\bcomercio\b/, answer: 'Comércio' }, { pattern: /\bindustria\b/, answer: 'Indústria' }];
const activity = { id: 'activity', text: 'qual é a atividade da sua empresa?', options: ['Prestação de serviços', 'Comércio', 'Indústria', 'Outra atividade'], recognize: activityRecognize };
const configured: Record<string, SinaFlow> = {
  contabilidade: { opening: 'posso ajudar a organizar o primeiro contato sobre a contabilidade da sua empresa.', questions: [
    { id: 'situation', text: 'você já tem uma empresa em funcionamento?', options: ['Já tenho uma empresa', 'Estou começando'], recognize: [{ pattern: /(?:ja tenho (?:uma )?empresa|empresa ja (?:funciona|esta funcionando)|minha empresa|trocar|mudar de contabilidade)/, answer: 'Já tenho uma empresa' }, { pattern: /(?:estou comecando|ainda (?:nao tenho|vou abrir))/, answer: 'Estou começando' }] }, activity] },
  'abertura-de-empresa': { opening: 'vamos organizar os primeiros passos da abertura.', questions: [
    { id: 'activity', text: 'o que você pretende fazer no seu negócio?', options: ['Prestação de serviços', 'Comércio', 'Indústria', 'Ainda estou definindo'], recognize: activityRecognize },
    { id: 'stage', text: 'você ainda está planejando ou já começou a atividade?', options: ['Ainda estou planejando', 'Já comecei a atividade'], recognize: [{ pattern: /(?:ainda estou planejando|estou planejando|ainda (?:estou|to) definindo|quero comecar)/, answer: 'Ainda estou planejando' }, { pattern: /(?:ja comecei|ja trabalho|ja vendo|ja presto|ja estou trabalhando)/, answer: 'Já comecei a atividade' }] }] },
  'fiscal-e-tributario': { opening: 'a equipe pode olhar a rotina fiscal a partir do que sua empresa precisa.', questions: [
    { id: 'need', text: 'o que você quer verificar primeiro?', options: ['Documentos e notas fiscais', 'Impostos e declarações', 'Acompanhamento da rotina'], recognize: [{ pattern: /(?:nota fiscal|notas fiscais)/, answer: 'Documentos e notas fiscais' }, { pattern: /(?:impostos|declaracoes)/, answer: 'Impostos e declarações' }] }, activity] },
  'departamento-pessoal': { opening: 'vamos entender a rotina da sua equipe.', questions: [
    { id: 'team', text: 'você já tem funcionários ou está preparando a primeira contratação?', options: ['Já tenho funcionários', 'Vou contratar pela primeira vez'], recognize: [{ pattern: /(?:tenho (?:\d+ |alguns |uma equipe de \d+ )?funcionarios|ja tenho (?:uma )?equipe)/, answer: 'Já tenho funcionários' }, { pattern: /(?:primeira contratacao|primeiro funcionario|contratar pela primeira vez)/, answer: 'Vou contratar pela primeira vez' }] },
    { id: 'need', text: 'qual parte dessa rotina precisa de atenção agora?', options: ['Folha de pagamento', 'Admissão ou desligamento', 'Férias', 'Acompanhamento da rotina'], recognize: [{ pattern: /(?:folha de pagamento|folha)/, answer: 'Folha de pagamento' }, { pattern: /(?:admissao|desligamento)/, answer: 'Admissão ou desligamento' }, { pattern: /ferias/, answer: 'Férias' }] }] },
  'regularizacao-e-encerramento': { opening: 'a equipe precisa conhecer a situação antes de orientar as próximas etapas.', questions: [
    { id: 'need', text: 'você quer verificar uma pendência ou cuidar do encerramento?', options: ['Verificar uma pendência', 'Encerrar a empresa', 'Ainda não sei'], recognize: [{ pattern: /(?:pendencia|regularizar|regularizacao|inapto)/, answer: 'Verificar uma pendência' }, { pattern: /(?:encerrar|encerramento|fechar empresa|dar baixa)/, answer: 'Encerrar a empresa' }] },
    { id: 'situation', text: 'a empresa está funcionando ou está sem movimento?', options: ['Está funcionando', 'Está sem movimento', 'Preciso verificar'], recognize: [{ pattern: /(?:sem movimento|inativa|parada)/, answer: 'Está sem movimento' }, { pattern: /(?:esta funcionando|esta em atividade)/, answer: 'Está funcionando' }] }] },
  'certificado-digital': { opening: 'posso reunir o contexto para a equipe orientar seu certificado.', questions: [
    { id: 'holder', text: 'o certificado é para você ou para uma empresa?', options: ['Para mim', 'Para uma empresa'], recognize: [{ pattern: /(?:pessoa fisica|para mim|e cpf)/, answer: 'Para mim' }, { pattern: /(?:pessoa juridica|para (?:uma |minha )?empresa|e cnpj)/, answer: 'Para uma empresa' }] },
    { id: 'purpose', text: 'onde você pretende usar o certificado?', options: ['Assinar documentos', 'Acessar sistemas', 'Renovar um certificado', 'Ainda não sei'], recognize: [{ pattern: /(?:assinar documentos|assinatura digital)/, answer: 'Assinar documentos' }, { pattern: /(?:acessar sistemas)/, answer: 'Acessar sistemas' }, { pattern: /(?:renovar|renovacao)/, answer: 'Renovar um certificado' }] }] },
  'creditos-tributarios': { opening: 'essa avaliação começa pelas informações e pela documentação da empresa, sem antecipar um resultado.', questions: [
    activity,
    { id: 'need', text: 'você quer uma primeira avaliação ou já tem uma dúvida sobre tributos pagos?', options: ['Primeira avaliação', 'Tenho uma dúvida sobre tributos pagos'], recognize: [{ pattern: /(?:pago a mais|pagos a mais|paguei|ja tenho uma duvida)/, answer: 'Tenho uma dúvida sobre tributos pagos' }] }] },
  aposentadoria: { opening: 'a SN orienta sobre o histórico de contribuição e o requerimento administrativo.', questions: [
    { id: 'need', text: 'você quer entender o tempo de contribuição ou falar sobre o requerimento?', options: ['Tempo de contribuição', 'Requerimento de aposentadoria', 'Ainda não sei'], recognize: [{ pattern: /(?:tempo de contribuicao|contagem|historico de contribuicao)/, answer: 'Tempo de contribuição' }, { pattern: /(?:requerimento|dar entrada|pedido de aposentadoria)/, answer: 'Requerimento de aposentadoria' }] },
    { id: 'stage', text: 'você está começando a organizar as informações ou já recebeu alguma orientação?', options: ['Estou começando', 'Já recebi orientação'] }] },
};

export function getFlow(slug: string): SinaFlow | undefined {
  if (!services.some(service => service.slug === slug)) return undefined;
  return configured[slug] || { opening: 'posso reunir o contexto para a equipe.', questions: [{ id: 'need', text: 'o que você precisa resolver sobre esse assunto?' }] };
}
