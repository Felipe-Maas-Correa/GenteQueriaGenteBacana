# Gente Querida, Gente Bacana

Portal jornalístico regional com painel administrativo para gestão de assinantes.

- **Portal público** — capa, listagem por editoria e página de matéria (por enquanto com conteúdo ilustrativo).
- **Painel administrativo** — dashboard, assinantes (cadastro, pesquisa, filtros combinados, etiquetas para impressão), áreas, Guia de Estilo e configurações.

## Stack

| Camada | Tecnologia |
| --- | --- |
| Aplicação | Next.js 16 (App Router, Server Components, Server Actions, Cache Components), React 19, TypeScript |
| Interface | Tailwind CSS 4, shadcn/ui (Radix), Lucide |
| Animações | Motion (principal), GSAP + ScrollTrigger (efeitos ligados à rolagem), Lenis (rolagem suave do portal) |
| Dados | Supabase (PostgreSQL, Auth, RLS) |
| Formulários | React Hook Form + Zod |
| Hospedagem planejada | Vercel |

## Como rodar

Requisitos: Node.js 20.9 ou superior.

```bash
npm install
cp .env.example .env.local   # preencha as variáveis do Supabase
npm run dev
```

Abra <http://localhost:3000>. O painel fica em `/admin`.

Sem as variáveis do Supabase a aplicação sobe normalmente, mas em **modo de visualização**: o painel abre sem login, mostra o aviso "Banco de dados ainda não conectado" e nada é carregado nem salvo. Com as variáveis definidas, `/admin` passa a exigir autenticação.

### Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Serve o build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Checagem de tipos |

## Configuração do Supabase

1. **Crie um projeto** em <https://supabase.com>.
2. **Variáveis de ambiente** — em *Project Settings → API Keys*, copie a URL do projeto e a chave *publishable* para `.env.local`:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

   A chave `service_role` **não é usada** pela aplicação e não deve ser colocada no projeto.
3. **Aplique as migrations** de `supabase/migrations`, na ordem dos nomes dos arquivos. Duas formas:
   - *SQL Editor* do painel do Supabase: cole e execute cada arquivo, do `…000001` ao `…000005`; ou
   - CLI: `npx supabase link --project-ref <ref>` e depois `npx supabase db push`.
4. **Desative o cadastro público** em *Authentication → Sign In / Providers* (opção "Allow new users to sign up"). Os usuários são criados apenas pela administração.
5. **Crie o primeiro usuário** em *Authentication → Users → Add user* (e-mail e senha, com "Auto Confirm User").
6. **Promova-o a administrador** no SQL Editor:

   ```sql
   update public.profiles set role = 'admin', name = 'Nome da pessoa'
   where email = 'email@exemplo.com.br';
   ```

Novos usuários nascem com o papel `pending` (sem acesso a dados) e precisam ser liberados da mesma forma, com `role = 'editor'` ou `'admin'`.

### Banco de dados

| Tabela | Conteúdo |
| --- | --- |
| `profiles` | Dados complementares dos usuários do Auth e o papel de acesso (`admin`, `editor`, `pending`) |
| `areas` | Áreas de atendimento |
| `subscribers` | Assinantes: nome, endereço, telefone, área, vencimento, mês de referência (1–12), observação, status e opção de etiqueta |

Função `dashboard_stats()` — indicadores do dashboard em uma única chamada.

**Segurança.** Todas as tabelas têm Row Level Security. Só usuários com papel `admin` ou `editor` leem e alteram assinantes e áreas; a chave pública sozinha (sem login) não acessa nada. As Server Actions revalidam a sessão antes de gravar, e o banco aplica as mesmas regras de forma independente da interface.

**Pesquisa.** A coluna gerada `search_text` (nome + endereço + telefone, sem acentos e em minúsculas) tem índice trigram; a pesquisa geral, os filtros e a paginação são resolvidos no banco, nunca no navegador.

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
│   └── layout/              Sidebar, breadcrumbs, cabeçalho e rodapé do portal
├── features/                Regras e telas por módulo
│   ├── authentication/      Sessão, papéis, login/logout
│   ├── subscribers/         Filtros, consultas, actions, etiquetas
│   ├── areas/ · dashboard/ · news/ · style-guide/
├── lib/
│   ├── supabase/            Clientes (servidor e proxy) e variáveis
│   ├── design-system/       Tokens de movimento, catálogo de tokens, base dos campos
│   ├── validations/         Schemas Zod
│   └── utils/               Formatação, meses, retorno de actions
├── styles/                  tokens.css, typography.css, globals.css
├── types/database.ts        Tipos do banco
└── proxy.ts                 Renovação de sessão e proteção de /admin
supabase/migrations/         SQL versionado
```

Em cada módulo de `features/`: `queries.ts` (leitura), `actions.ts` (Server Actions), `components/` (interface). Validações ficam em `lib/validations`.

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

- **Módulo de notícias** (redação, categorias, imagens no Supabase Storage). O portal usa textos e artes ilustrativas, sinalizados como exemplo, definidos em `src/features/news/demo-articles.ts`.
- **Gestão de usuários pelo painel** — por enquanto feita no painel do Supabase (passos acima).
- **Dados institucionais** (contato, endereço, redes sociais, editorias definitivas) — aguardam definição dos responsáveis pelo jornal; ver `src/lib/site.ts`.

## Publicação (Vercel)

1. Importe o repositório na Vercel.
2. Defina `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL` (domínio final) nas variáveis de ambiente do projeto.
3. No Supabase, em *Authentication → URL Configuration*, informe o domínio de produção em "Site URL".
