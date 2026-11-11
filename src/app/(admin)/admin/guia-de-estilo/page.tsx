import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import {
  CheckCircle2Icon,
  CircleAlertIcon,
  InboxIcon,
  InfoIcon,
  Loader2Icon,
  PencilIcon,
  PlusIcon,
  PrinterIcon,
  Trash2Icon,
  TriangleAlertIcon,
} from "lucide-react"

import { AdminSidebarContent } from "@/components/layout/admin-sidebar"
import { DataPagination } from "@/components/shared/data-pagination"
import { EmptyState } from "@/components/shared/empty-state"
import { Logo, LogoMark } from "@/components/shared/logo"
import { PageHeader } from "@/components/shared/page-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ArticleCard } from "@/features/news/components/article-card"
import { demoAsArticles } from "@/features/news/demo-articles"
import {
  ChoiceControlsDemo,
  FieldsDemo,
  LoadingButtonDemo,
  OverlaysDemo,
  ToastsDemo,
  ValidationDemo,
} from "@/features/style-guide/components/demos"
import {
  GuideSection,
  Showcase,
} from "@/features/style-guide/components/showcase"
import { TokenValue } from "@/features/style-guide/components/token-value"
import { SubscriberStatusBadge } from "@/features/subscribers/components/status-badge"
import {
  colorGroups,
  dimensionTokens,
  fontFamilies,
  motionCssTokens,
  radiusTokens,
  shadowTokens,
  typeStyles,
} from "@/lib/design-system/tokens"
import { cn } from "@/lib/utils"

export const metadata: Metadata = { title: "Guia de Estilo" }

const sections = [
  { id: "identidade", label: "Identidade" },
  { id: "tipografia", label: "Tipografia" },
  { id: "botoes", label: "Botões" },
  { id: "formularios", label: "Formulários" },
  { id: "componentes", label: "Componentes" },
  { id: "navegacao", label: "Navegação" },
  { id: "tokens", label: "Tokens" },
] as const

const buttonVariants = [
  { variant: "default", label: "Primário", note: "Ação principal da tela." },
  { variant: "secondary", label: "Secundário", note: "Ações de apoio." },
  { variant: "accent", label: "Destaque", note: "Uma por tela: criar, assinar." },
  { variant: "outline", label: "Contorno", note: "Ações neutras." },
  { variant: "ghost", label: "Discreto", note: "Barras e tabelas." },
  { variant: "destructive", label: "Perigo", note: "Confirmar exclusões." },
  { variant: "destructive-soft", label: "Perigo suave", note: "Iniciar uma exclusão." },
  { variant: "link", label: "Link", note: "Navegação em texto." },
] as const

export default function StyleGuidePage() {
  return (
    <div className="space-y-10">
      <PageHeader
        overline="Sistema"
        title="Guia de Estilo"
        description="Documentação visual oficial. Tudo o que aparece aqui é o componente real usado na aplicação, com os valores atuais dos tokens — mudou no código, mudou aqui."
      />

      <nav
        aria-label="Seções do guia"
        className="sticky top-(--topbar-h) z-10 -mx-4 overflow-x-auto border-b bg-background/90 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <ul className="flex w-max gap-1">
          {sections.map((section) => (
            <li key={section.id}>
              <Button asChild variant="ghost" size="sm">
                <a href={`#${section.id}`}>{section.label}</a>
              </Button>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Identidade ─────────────────────────────────────────── */}
      <GuideSection
        id="identidade"
        title="Identidade visual"
        description="Tinta sobre papel branco, com o azul como marca e o vermelho reservado à urgência. O símbolo é a primeira página de um jornal, com um círculo azul no lugar da foto: a gente que é notícia."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="grid min-h-44 place-items-center rounded-xl border bg-background p-6">
            <Logo size="lg" />
          </div>
          <div className="grid min-h-44 place-items-center rounded-xl bg-sidebar p-6 text-sidebar-foreground">
            <Logo size="lg" />
          </div>
          <div className="flex min-h-44 flex-col items-center justify-center gap-5 rounded-xl border bg-card p-6">
            <LogoMark className="h-12" title="Símbolo" />
            <Logo size="sm" layout="inline" />
          </div>
        </div>
        <p className="type-caption font-normal text-muted-foreground">
          Versão sobre fundo claro, sobre fundo escuro e o símbolo isolado com o
          nome em linha. Componentes: <code>{"<Logo />"}</code> e{" "}
          <code>{"<LogoMark />"}</code>.
        </p>

        {colorGroups.map((group) => (
          <div key={group.title} className="space-y-3">
            <div>
              <h3 className="type-h4">{group.title}</h3>
              <p className="type-caption font-normal text-muted-foreground">
                {group.description}
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {group.tokens.map((token) => (
                <li
                  key={token.variable}
                  className="overflow-hidden rounded-xl border bg-card"
                >
                  <div
                    className="flex h-20 items-end border-b p-3"
                    style={{
                      background: `var(${token.variable})`,
                      color: token.on ? `var(${token.on})` : undefined,
                    }}
                  >
                    {token.on ? (
                      <span className="font-display text-xl leading-none">
                        Aa
                      </span>
                    ) : null}
                  </div>
                  <div className="space-y-1 p-3">
                    <p className="type-small font-semibold">{token.name}</p>
                    <p className="type-caption font-normal text-muted-foreground">
                      {token.usage}
                    </p>
                    <p className="type-data pt-1 text-[0.75rem] text-muted-foreground">
                      {token.variable} · {token.utility}
                    </p>
                    <TokenValue variable={token.variable} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </GuideSection>

      {/* ── Tipografia ─────────────────────────────────────────── */}
      <GuideSection
        id="tipografia"
        title="Tipografia"
        description="Fraunces dá voz às manchetes; Instrument Sans cuida da leitura e da interface; Geist Mono marca rótulos e dados."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {fontFamilies.map((font) => (
            <div key={font.name} className="space-y-4 rounded-xl border bg-card p-5">
              <div>
                <p className="type-overline text-brand">{font.role}</p>
                <p className={cn("mt-2 text-4xl leading-none", font.utility)}>
                  {font.name}
                </p>
              </div>
              <ul className={cn("space-y-1 text-lg", font.utility)}>
                {font.weights.map((weight) => (
                  <li
                    key={weight}
                    className="flex items-baseline justify-between gap-3"
                    style={{ fontWeight: weight }}
                  >
                    Gente bacana
                    <span className="type-data text-xs text-muted-foreground">
                      {weight}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="type-data text-[0.75rem] text-muted-foreground">
                {font.variable} · {font.utility}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-xl border bg-card">
          <div className="border-b px-5 py-3.5">
            <h3 className="type-h4">Tamanhos e hierarquia</h3>
            <p className="type-caption font-normal text-muted-foreground">
              Use sempre os estilos nomeados (<code>type-*</code>) em vez de
              combinar tamanhos avulsos.
            </p>
          </div>
          <ul className="divide-y">
            {typeStyles.map((style) => (
              <li
                key={style.utility}
                className="grid gap-x-6 gap-y-2 px-5 py-5 md:grid-cols-[13rem_1fr] md:items-baseline"
              >
                <div>
                  <p className="type-small font-semibold">{style.name}</p>
                  <p className="type-data text-[0.75rem] text-brand">
                    {style.utility}
                  </p>
                  <p className="type-caption mt-1 font-normal text-muted-foreground">
                    {style.usage}
                  </p>
                </div>
                <p className={cn("min-w-0 break-words", style.utility)}>
                  {style.sample}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </GuideSection>

      {/* ── Botões ─────────────────────────────────────────────── */}
      <GuideSection
        id="botoes"
        title="Botões"
        description="Todos os botões da aplicação vêm de um único componente. Para mudar a aparência de todos, edite components/ui/button.tsx."
      >
        <Showcase
          title="Variantes"
          description="Cada variante tem um papel. Evite mais de um botão de destaque por tela."
          usage={`<Button variant="accent">Novo assinante</Button>`}
          contentClassName="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {buttonVariants.map((item) => (
            <div key={item.variant} className="space-y-2">
              <Button variant={item.variant}>{item.label}</Button>
              <p className="type-caption font-normal text-muted-foreground">
                <code className="text-brand">{item.variant}</code> — {item.note}
              </p>
            </div>
          ))}
        </Showcase>

        <div className="grid gap-4 lg:grid-cols-2">
          <Showcase title="Tamanhos" usage={`<Button size="sm" /> · size="default" · size="lg"`}>
            <Button size="sm">Pequeno</Button>
            <Button>Padrão</Button>
            <Button size="lg">Grande</Button>
          </Showcase>

          <Showcase
            title="Apenas com ícone"
            description="Sempre com aria-label descrevendo a ação."
            usage={`<Button size="icon" aria-label="Editar"><PencilIcon /></Button>`}
          >
            <Button size="icon-sm" variant="ghost" aria-label="Editar">
              <PencilIcon />
            </Button>
            <Button size="icon" variant="outline" aria-label="Imprimir">
              <PrinterIcon />
            </Button>
            <Button size="icon" aria-label="Adicionar">
              <PlusIcon />
            </Button>
            <Button size="icon-lg" variant="destructive-soft" aria-label="Excluir">
              <Trash2Icon />
            </Button>
          </Showcase>

          <Showcase
            title="Botões de ação"
            description="Ícone à esquerda reforça o verbo."
            usage={`<Button><PlusIcon /> Novo assinante</Button>`}
          >
            <Button variant="accent">
              <PlusIcon aria-hidden />
              Novo assinante
            </Button>
            <Button variant="outline">
              <PrinterIcon aria-hidden />
              Gerar etiquetas
            </Button>
          </Showcase>

          <Showcase
            title="Estados"
            description="Passe o mouse, use Tab para ver o foco e clique para ver o estado ativo."
            usage={`<Button disabled /> · <Button loading />`}
          >
            <Button>Hover / foco / ativo</Button>
            <Button disabled>Desabilitado</Button>
            <Button loading>Carregando</Button>
            <LoadingButtonDemo />
          </Showcase>
        </div>
      </GuideSection>

      {/* ── Formulários ────────────────────────────────────────── */}
      <GuideSection
        id="formularios"
        title="Campos e formulários"
        description="Todo campo usa <Field>, que liga rótulo, apoio e erro ao controle. A aparência dos controles é definida em lib/design-system/control.ts."
      >
        <Showcase
          title="Campos"
          usage={`<Field label="Nome" required error={errors.name?.message}>\n  {(field) => <Input {...field} {...register("name")} />}\n</Field>`}
        >
          <FieldsDemo />
        </Showcase>
        <Showcase title="Checkbox, radio e switch">
          <ChoiceControlsDemo />
        </Showcase>
        <Showcase
          title="Validação e mensagens de erro"
          description="Envie o formulário vazio para ver os erros. Validação com Zod + React Hook Form."
        >
          <ValidationDemo />
        </Showcase>
      </GuideSection>

      {/* ── Componentes ────────────────────────────────────────── */}
      <GuideSection
        id="componentes"
        title="Componentes"
        description="Blocos reutilizáveis do painel e do portal."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Showcase
            title="Card"
            usage={`<Card><CardHeader>…</CardHeader><CardContent>…</CardContent></Card>`}
            contentClassName="block"
          >
            <Card>
              <CardHeader>
                <CardTitle>Título do cartão</CardTitle>
                <CardDescription>Descrição curta do conteúdo.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="type-small">
                  Cartões agrupam informações relacionadas em uma superfície.
                </p>
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button variant="ghost" size="sm">
                  Cancelar
                </Button>
                <Button size="sm">Salvar</Button>
              </CardFooter>
            </Card>
          </Showcase>

          <Showcase
            title="Card de notícia"
            description="Usado no portal (conteúdo ilustrativo)."
            usage={`<ArticleCard article={article} size="small" showImage />`}
            contentClassName="block"
          >
            <ArticleCard article={demoAsArticles()[2]} className="max-w-sm" />
          </Showcase>

          <Showcase
            title="Badges"
            description="Indicam estado. Formato de pílula."
            usage={`<Badge variant="success">Ativo</Badge>`}
          >
            <Badge>Padrão</Badge>
            <Badge variant="secondary">Secundário</Badge>
            <Badge variant="outline">Contorno</Badge>
            <Badge variant="brand">Destaque</Badge>
            <Badge variant="support">Apoio</Badge>
            <Badge variant="success">Sucesso</Badge>
            <Badge variant="warning">Alerta</Badge>
            <Badge variant="destructive">Erro</Badge>
            <Badge variant="info">Informação</Badge>
            <SubscriberStatusBadge status="active" />
            <SubscriberStatusBadge status="inactive" />
          </Showcase>

          <Showcase
            title="Tags"
            description="Rótulos editoriais e de classificação: retas, em caixa alta."
            usage={`<Badge shape="tag" variant="brand">Cidade</Badge>`}
          >
            <Badge shape="tag" variant="brand">
              Cidade
            </Badge>
            <Badge shape="tag" variant="support">
              Comunidade
            </Badge>
            <Badge shape="tag" variant="outline">
              Centro
            </Badge>
            <Badge shape="tag" variant="secondary">
              Opinião
            </Badge>
          </Showcase>
        </div>

        <Showcase
          title="Tabela"
          description="No celular, as listagens trocam a tabela por cartões."
          contentClassName="block p-0"
        >
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead>Assinante</TableHead>
                <TableHead>Área</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                { name: "Nome de exemplo A", area: "Centro", due: "10/11/2026", status: "active" as const },
                { name: "Nome de exemplo B", area: "Interior", due: "05/12/2026", status: "inactive" as const },
              ].map((row) => (
                <TableRow key={row.name}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" shape="tag">
                      {row.area}
                    </Badge>
                  </TableCell>
                  <TableCell className="type-data">{row.due}</TableCell>
                  <TableCell>
                    <SubscriberStatusBadge status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Showcase>

        <div className="grid gap-4 lg:grid-cols-2">
          <Showcase
            title="Modais, dropdowns e menus"
            description="Modal para tarefas curtas; confirmação antes de ações irreversíveis; menu para ações de um item."
          >
            <OverlaysDemo />
          </Showcase>

          <Showcase
            title="Tooltips"
            description="Explicam ícones e controles sem texto. Aparecem no hover e no foco."
            usage={`<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip>`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Imprimir">
                  <PrinterIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Imprimir etiquetas</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Passe o mouse</Button>
              </TooltipTrigger>
              <TooltipContent>Texto de apoio do tooltip</TooltipContent>
            </Tooltip>
          </Showcase>

          <Showcase
            title="Toasts"
            description="Retorno rápido após uma ação. Somem sozinhos."
            usage={`toast.success("Assinante cadastrado.")`}
          >
            <ToastsDemo />
          </Showcase>

          <Showcase
            title="Indicadores de carregamento"
            description="Skeleton para conteúdo em carregamento; spinner para ações."
            contentClassName="block space-y-4"
          >
            <div className="space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-9 w-32" />
            </div>
            <p className="type-small flex items-center gap-2 text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Atualizando resultados…
            </p>
          </Showcase>
        </div>

        <Showcase
          title="Alertas"
          description="Mensagens persistentes dentro da página."
          usage={`<Alert variant="warning"><TriangleAlertIcon /><AlertTitle>…</AlertTitle></Alert>`}
          contentClassName="grid gap-3 md:grid-cols-2"
        >
          <Alert variant="info">
            <InfoIcon aria-hidden />
            <AlertTitle>Informação</AlertTitle>
            <AlertDescription>
              As etiquetas usam os mesmos filtros da listagem.
            </AlertDescription>
          </Alert>
          <Alert variant="success">
            <CheckCircle2Icon aria-hidden />
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>As alterações foram salvas.</AlertDescription>
          </Alert>
          <Alert variant="warning">
            <TriangleAlertIcon aria-hidden />
            <AlertTitle>Alerta</AlertTitle>
            <AlertDescription>
              Há assinantes com vencimento nesta semana.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>
              Não foi possível carregar os dados.
            </AlertDescription>
          </Alert>
        </Showcase>

        <div className="grid gap-4 lg:grid-cols-2">
          <Showcase
            title="Paginação"
            description="Baseada em links: preserva os filtros na URL."
            usage={`<DataPagination page={3} pageCount={12} hrefForPage={…} />`}
          >
            <DataPagination
              page={3}
              pageCount={12}
              hrefForPage={() => "#componentes"}
            />
          </Showcase>

          <Showcase
            title="Estado vazio"
            description="Explica a ausência de dados e sugere o próximo passo."
            usage={`<EmptyState icon={InboxIcon} title="…" action={<Button />} />`}
            contentClassName="block"
          >
            <EmptyState
              icon={InboxIcon}
              title="Nada por aqui ainda"
              description="Quando não há registros, a tela orienta o que fazer."
              action={<Button size="sm">Ação sugerida</Button>}
              className="py-8"
            />
          </Showcase>
        </div>
      </GuideSection>

      {/* ── Navegação ──────────────────────────────────────────── */}
      <GuideSection
        id="navegacao"
        title="Elementos de navegação"
        description="Sidebar, barra superior e breadcrumbs são gerados a partir de lib/navigation.ts — adicionar um módulo é incluir um item nessa lista."
      >
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="min-w-0 overflow-hidden rounded-xl border">
            <div className="h-[30rem]">
              <Suspense fallback={<div className="h-full bg-sidebar" />}>
                <AdminSidebarContent instanceId="guia" />
              </Suspense>
            </div>
          </div>

          <div className="min-w-0 space-y-4">
            <Showcase
              title="Sidebar"
              description="À esquerda, o componente real. Em telas pequenas ela vira uma gaveta aberta pelo botão de menu. Módulos planejados aparecem como “Em breve”."
              usage={`// lib/navigation.ts\n{ label: "Assinantes", href: "/admin/assinantes", icon: UsersIcon }`}
            >
              <p className="type-small text-muted-foreground">
                O item ativo é destacado com fundo e marcador na cor de
                destaque, com transição animada entre itens.
              </p>
            </Showcase>

            <Showcase
              title="Navbar e breadcrumbs"
              description="A barra superior mostra o caminho atual e o menu do usuário."
              usage={`<Breadcrumb><BreadcrumbList>…</BreadcrumbList></Breadcrumb>`}
            >
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/admin/assinantes">Assinantes</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="font-medium">
                      Novo assinante
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </Showcase>

            <Showcase
              title="Abas"
              description="Alternam visões de um mesmo conteúdo."
              usage={`<Tabs defaultValue="a"><TabsList>…</TabsList><TabsContent value="a" /></Tabs>`}
              contentClassName="block"
            >
              <Tabs defaultValue="dados">
                <TabsList>
                  <TabsTrigger value="dados">Dados</TabsTrigger>
                  <TabsTrigger value="historico">Histórico</TabsTrigger>
                  <TabsTrigger value="observacoes">Observações</TabsTrigger>
                </TabsList>
                <TabsContent value="dados" className="type-small pt-3 text-muted-foreground">
                  Conteúdo da aba “Dados”.
                </TabsContent>
                <TabsContent value="historico" className="type-small pt-3 text-muted-foreground">
                  Conteúdo da aba “Histórico”.
                </TabsContent>
                <TabsContent value="observacoes" className="type-small pt-3 text-muted-foreground">
                  Conteúdo da aba “Observações”.
                </TabsContent>
              </Tabs>
            </Showcase>
          </div>
        </div>
      </GuideSection>

      {/* ── Tokens ─────────────────────────────────────────────── */}
      <GuideSection
        id="tokens"
        title="Tokens do Design System"
        description="Valores lidos agora de styles/tokens.css. Alterar um token muda todos os componentes que dependem dele."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Showcase title="Raios" contentClassName="grid grid-cols-3 gap-4 sm:grid-cols-6">
            {radiusTokens.map((radius) => (
              <div key={radius.name} className="space-y-2 text-center">
                <div
                  className={cn(
                    "mx-auto size-14 border-2 border-foreground/70 bg-muted",
                    radius.utility
                  )}
                />
                <p className="type-data text-[0.75rem]">{radius.name}</p>
              </div>
            ))}
          </Showcase>

          <Showcase title="Sombras" contentClassName="grid grid-cols-2 gap-5 sm:grid-cols-4">
            {shadowTokens.map((shadow) => (
              <div key={shadow.utility} className="space-y-2 text-center">
                <div
                  className={cn(
                    "mx-auto h-14 w-full rounded-lg border bg-card",
                    shadow.utility
                  )}
                />
                <p className="type-data text-[0.75rem]">{shadow.utility}</p>
                <p className="type-caption font-normal text-muted-foreground">
                  {shadow.usage}
                </p>
              </div>
            ))}
          </Showcase>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {[
            { title: "Movimento", tokens: motionCssTokens },
            { title: "Dimensões e espaçamentos", tokens: dimensionTokens },
          ].map((group) => (
            <div key={group.title} className="overflow-hidden rounded-xl border bg-card">
              <h3 className="type-h4 border-b px-5 py-3.5">{group.title}</h3>
              <dl className="divide-y">
                {group.tokens.map((token) => (
                  <div
                    key={token.variable}
                    className="grid gap-x-4 gap-y-0.5 px-5 py-3 sm:grid-cols-[1fr_auto] sm:items-baseline"
                  >
                    <dt>
                      <span className="type-data text-[0.8125rem]">
                        {token.variable}
                      </span>
                      <span className="type-caption block font-normal text-muted-foreground">
                        {token.usage}
                      </span>
                    </dt>
                    <dd className="sm:text-right">
                      <TokenValue variable={token.variable} />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <p className="type-caption font-normal text-muted-foreground">
          Espaçamentos internos seguem a escala do Tailwind (múltiplos de
          0,25rem). Animações em JavaScript usam os mesmos valores, espelhados em{" "}
          <code>lib/design-system/motion.ts</code>, e respeitam a preferência do
          sistema por movimento reduzido.
        </p>
      </GuideSection>
    </div>
  )
}
