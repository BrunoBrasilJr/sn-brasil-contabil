import type { Metadata } from "next";
import "./globals.css";
import { SiteFrame } from './site';
import { siteUrl } from '@/lib/site-url';

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: 'SN Brasil Contábil',
  description: 'Assessoria contábil, fiscal e departamento pessoal em São Paulo. Conheça a SN Brasil Contábil e converse com a equipe sobre a sua empresa.',
  openGraph: { title: 'SN Brasil Contábil', description: 'Contabilidade com quem você pode conversar. Assessoria contábil, fiscal e departamento pessoal em São Paulo.', locale: 'pt_BR', type: 'website' },
  icons: {
    icon: "/favicon-branco-transparente.png",
    shortcut: "/favicon-branco-transparente.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body><SiteFrame>{children}</SiteFrame></body>
    </html>
  );
}
