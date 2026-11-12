# Gente Querida, Gente Bacana

Portal jornalístico regional com painel administrativo para gestão de assinantes.

- **Portal público** — capa, listagem por editoria e página de matéria (por enquanto com conteúdo ilustrativo).
- **Painel administrativo** — dashboard, assinantes (cadastro, pesquisa, filtros combinados, etiquetas para impressão), áreas, Guia de Estilo e configurações.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Aplicação | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| Interface | Tailwind CSS 4, shadcn/ui (Radix), Lucide |
| Animações | Motion (principal), GSAP + ScrollTrigger (efeitos ligados à rolagem), Lenis (rolagem suave do portal) |
| Banco de dados e autenticação | Firebase (Firestore + Firebase Auth), SDK no cliente |
| Formulários | React Hook Form + Zod |
| Hospedagem planejada | Vercel |

O painel usa o **SDK do Firebase no navegador**: Firestore e Firebase Auth rodam no lado do cliente e a proteção dos dados é feita pelas **Security Rules** (`firestore.rules`), não por esconder chaves.

## Como rodar

Requisitos: Node.js 20.9 ou superior.

```bash
npm install
cp .env.example .env.local   # preencha a configuração do Firebase
npm run dev
```

Abra <http://localhost:3000>. O painel fica em `/admin`.

Sem as variáveis do Firebase a aplicação sobe normalmente, mas em **modo de visualização**: o painel abre sem login, mostra o aviso "Firebase ainda não conectado" e nada é carregado nem salvo. Com as variáveis definidas, `/admin` passa a exigir autenticação.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Checagem de tipos |

## Configuração do Firebase

1. **Crie um projeto** em <https://console.firebase.google.com>.

2. **Registre um app Web** (ícone `</>`) e copie a configuração do SDK para o `.env.local`:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

   Estas chaves são **públicas por design** (vão para o navegador). A segurança vem das Security Rules, no passo 4.

3. **Ative os produtos** no Console:
   - **Authentication → Sign-in method → Email/senha**: ativar.
   - **Firestore Database → Criar banco de dados** (modo de produção; a região mais próxima).

4. **Publique as Security Rules.** Copie o conteúdo de [`firestore.rules`](firestore.rules) em **Firestore Database → Regras** e clique em **Publicar**. (Com a CLI do Firebase: `firebase deploy --only firestore:rules`.) **Sem este passo, nada é lido nem gravado.**

5. **Crie o primeiro usuário** em **Authentication → Users → Add user** (e-mail e senha).

6. **Faça login uma vez** em `http://localhost:3000/login`. Nesse primeiro acesso a aplicação cria automaticamente o documento de perfil do usuário em `profiles/{uid}` com papel `reader` (leitor: só lê as notícias). Ao abrir o painel você verá a tela "Área restrita à equipe do jornal".

7. **Promova-se a administrador.** No Console, em **Firestore Database → Dados**, abra a coleção `profiles`, o documento com o seu `uid`, e altere o campo `role` de `reader` para `admin`. Atualize a página — o acesso é liberado na hora.

Qualquer pessoa pode criar uma conta pelo botão **Criar conta** do site; ela nasce como `reader` (leitor). O primeiro administrador é promovido direto no banco, como acima; depois disso, os administradores definem os papéis em **Sistema › Equipe** (`editor` ou `admin`).

### E-mail de redefinição de senha

O site é estático (Firebase Hosting gratuito), então usa o e-mail padrão do Firebase, em português. O Firebase não permite editar esse modelo neste projeto. O modelo próprio do jornal está guardado em [`docs/email-redefinir-senha.html`](docs/email-redefinir-senha.html) para quando o site tiver um servidor (plano Blaze ou Vercel).

### Coleções do Firestore

| Coleção | Conteúdo |
| --- | --- |
| `profiles` | Documento por usuário (id = `uid` do Auth): `name`, `email`, `role` (`admin`/`editor`/`reader`) |
| `areas` | Áreas de atendimento: `name`, `description` |
| `subscribers` | Assinantes: `name`, `address`, `phone`, `area_id`, `due_date`, `due_day`, `reference_month` (1–12), `observation`, `status`, `label_enabled` |

Os documentos são criados pela própria aplicação — não é preciso montar as coleções à mão.

**Segurança.** As regras em `firestore.rules` só permitem ler e gravar assinantes e áreas a usuários com papel `admin` ou `editor`; cada usuário só lê o próprio perfil (admin lê todos) e ninguém promove a si mesmo. A aplicação valida os dados com Zod antes de gravar, e as regras aplicam o controle de acesso de forma independente da interface.

**Busca e filtros.** O Firestore não faz busca por texto no servidor. Os filtros de igualdade mais comuns (área, mês, status) são aplicados no servidor (índices automáticos, sem configuração); a busca livre por nome/telefone/endereço e as faixas de dia/data são resolvidas em memória sobre o conjunto já filtrado, com um teto de leitura. É adequado à escala de um jornal regional (centenas a poucos milhares de assinantes). Para bases muito maiores, a busca pode ser migrada para uma extensão como Algolia ou Typesense — ver `src/features/subscribers/queries.ts`.

## Segurança

O site é estático: todo acesso ao banco sai do navegador, então **a proteção real está em `firestore.rules`**, que valida cada escrita campo a campo (quem pode mexer em quê, tipos e tamanhos). A tela só esconde botões.

- **Testes das regras:** `npm run test:rules` sobe o emulador do Firestore (precisa de Java) e tenta dezenas de ataques — promover-se a admin, fingir ser outra pessoa, fugir da cobrança, ler CPF alheio etc. Todos precisam ser recusados, e os usos normais do site precisam funcionar. Rode sempre que mexer nas regras. No Windows, se o emulador não abrir ("Unable to establish loopback connection"), use `JAVA_TOOL_OPTIONS=-Djdk.net.unixdomain.tmpdir=C:/tmp`.
- **Cabeçalhos HTTP** (em `firebase.json`): CSP, proteção contra o site ser embutido em outro (clickjacking), `nosniff`, HSTS e política de referência. `node scripts/serve-out.mjs` aplica os mesmos cabeçalhos para testar a pasta `out/` localmente.
- **Dados de cobrança** (CPF, endereço, faturas) são visíveis só para o dono e para administradores.
- **No Console do Firebase / Google Cloud** (recomendado):
  - Restringir a chave de API aos domínios do site (Google Cloud › APIs e serviços › Credenciais).
  - Ativar o **App Check** (reCAPTCHA) para que só o site consiga usar o banco.
  - Ativar a **proteção contra enumeração de e-mails** e a política de senha em Authentication › Configurações.
  - Não guardar chaves de conta de serviço: o site não usa nenhuma.

## Estrutura

```
src/
├── app/
│   ├── (public)/            Portal: capa, /noticias, /noticias/[slug]
│   ├── (auth)/login/        Tela de login
│   └── (admin)/admin/       Painel: dashboard, assinantes, areas, guia-de-estilo, configuracoes
├── components/
│   ├── ui/                  Componentes básicos (shadcn/ui adaptados aos tokens)
│   ├── forms/               Field, PhoneInput, SearchInput, Combobox
│   ├── shared/              Logo, PageHeader, EmptyState, ConfirmDialog, Reveal…
│   └── layout/              AdminShell (navegação + barreira de acesso), cabeçalho/rodapé do portal
├── features/                Regras e telas por módulo
│   ├── authentication/      Contexto de autenticação (Firebase Auth), papéis, login/logout
│   ├── subscribers/         Filtros, consultas, gravações, etiquetas, telas (client)
│   ├── areas/ · dashboard/ · news/ · style-guide/
├── lib/
│   ├── firebase/            Inicialização do cliente, config e helpers do Firestore
│   ├── design-system/       Tokens de movimento, catálogo de tokens, base dos campos
│   ├── validations/         Schemas Zod
│   └── utils/               Formatação, meses, retorno de operações
├── hooks/                   useAsync (carregamento de dados no cliente), useDraftValue
├── styles/                  tokens.css, typography.css, globals.css
└── types/database.ts        Modelo de dados (coleções do Firestore)
firestore.rules              Security Rules (proteção real dos dados)
firestore.indexes.json       Índices (nenhum composto é necessário)
```

Em cada módulo de `features/`: `queries.ts` (leitura no Firestore), `actions.ts` (gravações, retornando um resultado padronizado), `components/` (telas e componentes). As telas do painel são componentes de cliente que buscam os dados via `useAsync`. Validações ficam em `lib/validations`.

## Design System

A documentação visual vive dentro da aplicação, em **`/admin/guia-de-estilo`**, e mostra os componentes reais com os valores atuais dos tokens.

Regras de uso:

- **Tokens primeiro.** Cores, raios, sombras, tempos de transição e dimensões de controles ficam em `src/styles/tokens.css`. Mudou ali, mudou em tudo.
- **Tipografia nomeada.** Use as utilidades `type-*` (`src/styles/typography.css`) em vez de combinar tamanhos avulsos.
- **Um componente por papel.** Botões vêm de `components/ui/button.tsx`; a aparência dos campos, de `lib/design-system/control.ts`; todo campo de formulário usa `<Field>`.
- **Antes de criar, procure.** Se o componente já existe no Guia, reutilize. Se for novo e reutilizável, coloque em `components/` e acrescente ao Guia.
- **Movimento com parcimônia.** Motion para a interface; GSAP só em efeitos ligados à rolagem. Tudo respeita `prefers-reduced-motion`.

## Etiquetas

Em *Assinantes*, aplique os filtros desejados e clique em **Gerar etiquetas**. Na tela de etiquetas escolha os campos, o modelo de folha A4 (21, 14 ou 24 por folha) e a posição inicial, e imprima. Na janela de impressão use papel A4, escala 100% e margens "Nenhuma".

Assinantes com a opção "Gerar etiqueta" desativada ficam fora do documento. Novos modelos de folha são acrescentados em `src/features/subscribers/labels.ts`.

## Ainda não implementado

- **Imagens grandes:** as fotos ficam em base64 no Firestore (até ~500 KB cada, gratuito). Para muito volume, migrar para Cloudinary ou Firebase Storage (plano Blaze).
- **Gestão de usuários pelo painel** — por enquanto feita no Console do Firebase (passos acima).
- **Dados institucionais** (contato, endereço, redes sociais, editorias definitivas) — aguardam definição dos responsáveis pelo jornal; ver `src/lib/site.ts`.

## Publicação (Firebase Hosting, gratuito)

O `next.config.ts` usa `output: "export"`: `npm run build` gera a pasta `out/` com o site estático, publicada no Firebase Hosting.

```bash
npm run build
npx firebase-tools deploy --only hosting,firestore:rules
```

Link: https://gentequeridagentebanca.web.app — para testar `out/` localmente: `node scripts/serve-out.mjs`.

Como não há servidor, as páginas com conteúdo do banco usam parâmetros (`/noticia?slug=…`, `/admin/noticias/editar?id=…`), as fotos são lidas direto do Firestore e o cadastro de membros roda no navegador.

## Publicação (Vercel)

1. Importe o repositório na Vercel.
2. Defina as variáveis `NEXT_PUBLIC_FIREBASE_*` e `NEXT_PUBLIC_SITE_URL` (domínio final) nas variáveis de ambiente do projeto.
3. No Console do Firebase, em **Authentication → Settings → Authorized domains**, adicione o domínio de produção da Vercel.
