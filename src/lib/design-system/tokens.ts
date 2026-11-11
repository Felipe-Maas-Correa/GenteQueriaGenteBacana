/**
 * Catálogo dos tokens de design, usado pelo Guia de Estilo.
 *
 * Os VALORES ficam em src/styles/tokens.css — aqui há apenas nomes e
 * descrições. O Guia lê o valor real de cada variável no navegador, então a
 * documentação nunca fica desatualizada em relação ao CSS.
 */
export type ColorToken = {
  /** Variável CSS (sem `var()`). */
  variable: string
  name: string
  /** Classe utilitária correspondente no Tailwind. */
  utility: string
  usage: string
  /** Variável da cor de texto usada sobre esta cor, quando houver. */
  on?: string
}

export type ColorGroup = { title: string; description: string; tokens: ColorToken[] }

export const colorGroups: ColorGroup[] = [
  {
    title: "Cores principais",
    description: "A base da identidade: tinta preta sobre papel branco, como numa redação.",
    tokens: [
      { variable: "--primary", name: "Tinta", utility: "bg-primary", usage: "Botões primários, textos e superfícies de destaque.", on: "--primary-foreground" },
      { variable: "--background", name: "Papel", utility: "bg-background", usage: "Fundo geral das páginas.", on: "--foreground" },
    ],
  },
  {
    title: "Cores de destaque",
    description: "Usadas com parcimônia, para chamar atenção ao que importa.",
    tokens: [
      { variable: "--brand", name: "Azul Redação", utility: "bg-brand", usage: "Ação de destaque, links, foco e marca.", on: "--brand-foreground" },
      { variable: "--brand-soft", name: "Azul suave", utility: "bg-brand-soft", usage: "Fundos de etiquetas e realces discretos.", on: "--brand" },
    ],
  },
  {
    title: "Cores secundárias",
    description: "Apoio à paleta principal.",
    tokens: [
      { variable: "--support", name: "Vermelho Manchete", utility: "bg-support", usage: "Urgente, ao vivo e chapéus de destaque — com parcimônia.", on: "--support-foreground" },
      { variable: "--support-soft", name: "Vermelho suave", utility: "bg-support-soft", usage: "Fundos de avisos de urgência.", on: "--support" },
      { variable: "--highlight", name: "Amarelo destaque", utility: "bg-highlight", usage: "Marca-texto e selos pontuais (ex.: Exclusivo).", on: "--highlight-foreground" },
      { variable: "--secondary", name: "Cinza", utility: "bg-secondary", usage: "Botões secundários e superfícies neutras.", on: "--secondary-foreground" },
    ],
  },
  {
    title: "Cores de fundo",
    description: "Superfícies e camadas da interface.",
    tokens: [
      { variable: "--card", name: "Cartão", utility: "bg-card", usage: "Cartões, campos e painéis elevados.", on: "--card-foreground" },
      { variable: "--muted", name: "Cinza claro", utility: "bg-muted", usage: "Faixas, cabeçalhos de tabela e estados de hover.", on: "--muted-foreground" },
      { variable: "--sidebar", name: "Sidebar", utility: "bg-sidebar", usage: "Navegação lateral do painel (clara no tema claro).", on: "--sidebar-foreground" },
      { variable: "--contraste", name: "Contraste", utility: "bg-contraste", usage: "Faixas escuras: rodapé do portal e lateral do login.", on: "--contraste-foreground" },
    ],
  },
  {
    title: "Cores de texto e linhas",
    description: "Hierarquia de leitura e contornos.",
    tokens: [
      { variable: "--foreground", name: "Texto", utility: "text-foreground", usage: "Texto principal.", on: "--background" },
      { variable: "--muted-foreground", name: "Texto auxiliar", utility: "text-muted-foreground", usage: "Legendas, descrições e metadados.", on: "--background" },
      { variable: "--border", name: "Borda", utility: "border-border", usage: "Divisores e contornos de cartões." },
      { variable: "--input", name: "Borda de campo", utility: "border-input", usage: "Contorno de campos de formulário." },
    ],
  },
  {
    title: "Cores de estado",
    description: "Sempre acompanhadas de ícone ou texto — nunca apenas a cor.",
    tokens: [
      { variable: "--success", name: "Sucesso", utility: "text-success", usage: "Confirmações e estados positivos.", on: "--success-soft" },
      { variable: "--warning", name: "Alerta", utility: "text-warning", usage: "Avisos e prazos próximos.", on: "--warning-soft" },
      { variable: "--destructive", name: "Erro", utility: "text-destructive", usage: "Erros e ações destrutivas.", on: "--destructive-foreground" },
      { variable: "--info", name: "Informação", utility: "text-info", usage: "Mensagens informativas.", on: "--info-soft" },
    ],
  },
]

export type TypeStyle = {
  utility: string
  name: string
  usage: string
  sample: string
}

export const typeStyles: TypeStyle[] = [
  { utility: "type-hero", name: "Manchete principal", usage: "Uma por página, na capa do portal.", sample: "Gente querida" },
  { utility: "type-h1", name: "Título 1", usage: "Título de página e de matéria.", sample: "Notícia de perto" },
  { utility: "type-h2", name: "Título 2", usage: "Títulos de seção e de páginas do painel.", sample: "O que está acontecendo" },
  { utility: "type-h3", name: "Título 3", usage: "Títulos de cartões e subtítulos.", sample: "Biblioteca amplia horário" },
  { utility: "type-h4", name: "Título 4", usage: "Subtítulos de interface e de formulários.", sample: "Dados do assinante" },
  { utility: "type-lead", name: "Linha de apoio", usage: "Abertura de matérias e introduções.", sample: "Um retrato de como o encontro semanal muda o ritmo do bairro." },
  { utility: "type-body", name: "Texto comum", usage: "Corpo de texto.", sample: "O conteúdo jornalístico é sempre o protagonista da página." },
  { utility: "type-small", name: "Texto pequeno", usage: "Interface, tabelas e descrições.", sample: "Cadastre, encontre e organize os assinantes." },
  { utility: "type-caption", name: "Texto auxiliar", usage: "Legendas, dicas de campo e notas.", sample: "Com DDD. Fixo ou celular." },
  { utility: "type-overline", name: "Sobretítulo", usage: "Rótulos de seção, editorias e cabeçalhos de tabela.", sample: "Comunidade" },
  { utility: "type-data", name: "Dados", usage: "Números, datas e telefones em listagens.", sample: "10/11/2026 · (55) 99999-0000" },
]

export const fontFamilies = [
  { variable: "--font-display", name: "Fraunces", role: "Títulos e manchetes", utility: "font-display", weights: [300, 400, 500, 600] },
  { variable: "--font-sans", name: "Instrument Sans", role: "Textos e interface", utility: "font-sans", weights: [400, 500, 600, 700] },
  { variable: "--font-mono", name: "Geist Mono", role: "Rótulos e dados", utility: "font-mono", weights: [400, 500] },
] as const

export const radiusTokens = [
  { utility: "rounded-sm", name: "sm", usage: "Tags" },
  { utility: "rounded-md", name: "md", usage: "Botões pequenos, itens de menu" },
  { utility: "rounded-lg", name: "lg", usage: "Botões e campos" },
  { utility: "rounded-xl", name: "xl", usage: "Cartões e modais" },
  { utility: "rounded-2xl", name: "2xl", usage: "Imagens de destaque" },
  { utility: "rounded-full", name: "full", usage: "Badges e avatares" },
] as const

export const shadowTokens = [
  { variable: "--elevation-xs", utility: "shadow-xs", usage: "Campos e botões" },
  { variable: "--elevation-sm", utility: "shadow-sm", usage: "Cartões em hover" },
  { variable: "--elevation-md", utility: "shadow-md", usage: "Menus e popovers" },
  { variable: "--elevation-lg", utility: "shadow-lg", usage: "Modais e gavetas" },
] as const

export const motionCssTokens = [
  { variable: "--duration-fast", usage: "Hover, foco e cliques" },
  { variable: "--duration-base", usage: "Transições de interface" },
  { variable: "--duration-slow", usage: "Entradas e movimentos amplos" },
  { variable: "--easing-standard", usage: "Curva padrão" },
  { variable: "--easing-emphasized", usage: "Entradas com desaceleração longa" },
] as const

export const dimensionTokens = [
  { variable: "--control-h-sm", usage: "Altura de controles pequenos" },
  { variable: "--control-h", usage: "Altura padrão de botões e campos" },
  { variable: "--control-h-lg", usage: "Altura de controles grandes" },
  { variable: "--control-px", usage: "Respiro horizontal dos controles" },
  { variable: "--radius", usage: "Raio-base (os demais derivam dele)" },
  { variable: "--sidebar-w", usage: "Largura da sidebar" },
  { variable: "--topbar-h", usage: "Altura da barra superior" },
  { variable: "--container-max", usage: "Largura máxima do conteúdo" },
  { variable: "--gutter", usage: "Respiro lateral das páginas" },
] as const
