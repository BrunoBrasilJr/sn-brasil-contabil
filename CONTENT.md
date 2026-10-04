# Conteúdo institucional

As fotografias atuais são editoriais. Não representam a equipe nem o escritório da SN Brasil Contábil. Os créditos estão em `ASSETS.md` e `CREDITS.md`.

## Equipe e escritório

`lib/office-content.ts` contém `officePresentation`. A área institucional funciona sem nomes ou fotos de pessoas. Para incluir uma fotografia real, adicione o arquivo em `public` e informe `src`, uma descrição fiel em `alt`, `width` e `height` em `photo`. Para apresentar integrantes reais, preencha `people` com nome e, quando confirmados, cargo e descrição. Campos ausentes não geram placeholders.

## Depoimentos

`clientTestimonials` começa vazio. A seção só aparece quando existe um depoimento com texto, autor, fonte registrada e autorização para publicação. `source` documenta de onde veio o depoimento e não é mostrado ao visitante. Confirme a autenticidade e a autorização antes de marcar `authorizedForPublication` como verdadeiro. Não incluir avaliações, estrelas, marcas ou números sem uma fonte verificável.

## Serviços

Os textos dos botões e as mensagens iniciais estão em `ctaLabel` e `contactMessage`, em `lib/content.ts`. As mensagens abrem uma conversa no WhatsApp e também preenchem o formulário conforme o assunto escolhido. Nenhuma mensagem é enviada automaticamente.
