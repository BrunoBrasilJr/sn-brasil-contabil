# SN Brasil Contábil

Site institucional com serviços, canais de contato e a Sina, assistente de triagem que funciona no navegador e encaminha o atendimento para o WhatsApp.

## Requisitos

Node.js 22.13 ou superior e pnpm 11.25.0. O projeto utiliza React, TypeScript, Vinext e Vite. Nitro adapta a publicação para a Vercel.

## Execução local

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Validação e produção

```sh
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

`pnpm build` gera o servidor local em `.output`. `pnpm build:vercel` gera o artefato de publicação da Vercel em `.vercel/output`.

## Publicação na Vercel

Importe `BrunoBrasilJr/sn-brasil-contabil` e mantenha a raiz do projeto em `.`. O `vercel.json` define o preset Other e o comando `pnpm build:vercel`, evitando a detecção automática como Next.js. Nitro produz as rotas, os assets e a função de servidor no formato de publicação da Vercel.

Use a branch padrão do repositório como branch de produção. Quando a integração GitHub estiver conectada à Vercel, novos pushes nessa branch poderão gerar deployments automaticamente.

Os metadados usam `VERCEL_PROJECT_PRODUCTION_URL`, fornecida pela Vercel. Mantenha as variáveis de sistema habilitadas. `SITE_URL` permite definir outra origem quando necessário; nenhuma chave de API é utilizada. A Sina não exige serviço pago nem variável secreta.

## Estrutura

- `app`: páginas, estilos e metadados
- `components`: interface e Sina
- `lib`: conteúdo institucional, serviços e lógica da Sina
- `public`: imagens, logos, favicon e fontes locais
- `tests`: testes da Sina

O formulário prepara uma mensagem editável no WhatsApp. O visitante confirma o envio por lá. Os créditos das fotografias estão em `ASSETS.md`, `CREDITS.md` e `lib/service-photos.ts`.
