import { ContactPage } from '../site';
export const metadata = {title: { absolute: 'SN Brasil Contábil' },description:'Fale com a SN Brasil Contábil por WhatsApp, telefone ou e-mail. Rua Constantino Sérgio, 206, Jardim Palmares, São Paulo.'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {const params=await searchParams;return <ContactPage initialSubject={typeof params.assunto === 'string' ? params.assunto : undefined} initialSegment={typeof params.segmento === 'string' ? params.segmento : undefined} />;}
