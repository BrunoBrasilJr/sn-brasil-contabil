import { notFound } from 'next/navigation';
import { ServicePage } from '../../site';
import { services } from '@/lib/content';
export function generateStaticParams() { return services.map(s=>({slug:s.slug})); }
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {const {slug}=await params;const s=services.find(s=>s.slug===slug);return {title:{absolute:'SN Brasil Contábil'},description:s?.description};}
export default async function Page({params}:{params:Promise<{slug:string}>}) {const {slug}=await params;const service=services.find(s=>s.slug===slug);if(!service) notFound();return <ServicePage service={service} />;}
