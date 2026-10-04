import { services } from '@/lib/content';
import { siteUrl } from '@/lib/site-url';

export default function sitemap() {
  return ['', '/escritorio', '/servicos', '/segmentos', '/contato', '/privacidade', ...services.map(service => `/servicos/${service.slug}`)]
    .map(path => ({ url: new URL(path || '/', siteUrl).href, changeFrequency: 'monthly' as const, priority: path === '' ? 1 : .7 }));
}
