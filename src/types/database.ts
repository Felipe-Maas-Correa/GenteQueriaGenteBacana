/**
 * Modelo de dados da aplicação (coleções do Firestore).
 *
 * Os nomes de campo são mantidos em snake_case para que os componentes de
 * interface, validações e formulários permaneçam estáveis. Datas de criação e
 * atualização são expostas como ISO string (convertidas de Timestamp do
 * Firestore na camada de dados).
 */
export type SubscriberStatus = "active" | "inactive"
/** `reader` = leitor (padrão de toda conta nova): só lê as notícias. */
export type UserRole = "admin" | "editor" | "reader"

export type Area = {
  id: string
  name: string
  description: string
  created_at: string
  updated_at: string
}

export type Subscriber = {
  id: string
  name: string
  address: string
  phone: string
  area_id: string
  due_date: string
  due_day: number
  reference_month: number
  observation: string
  status: SubscriberStatus
  label_enabled: boolean
  created_at: string
  updated_at: string
}

export type Profile = {
  id: string
  name: string
  email: string
  role: UserRole
  /** Foto de perfil ("/api/imagens/{id}"), opcional. */
  photo_url?: string
  /** Acesso desativado por um administrador (a pessoa não consegue entrar). */
  disabled?: boolean
  created_at: string
  updated_at: string
}

/**
 * Compatibilidade com os componentes existentes: `Tables<"subscribers">`
 * continua resolvendo para o tipo de linha correspondente.
 */
type TableRowMap = {
  areas: Area
  subscribers: Subscriber
  profiles: Profile
  articles: Article
}

export type Tables<T extends keyof TableRowMap> = TableRowMap[T]

export type ArticleStatus = "draft" | "published"
/** Tamanho do cartão na página inicial. */
export type CardSize = "hero" | "large" | "small"
/** Tom do chapéu (rótulo acima do título). */
export type KickerTone = "default" | "urgent"
/** Quem pode ler: todos, só assinantes, ou prévia aberta + resto para assinantes. */
export type ArticleAccess = "public" | "partial" | "subscribers"

export type Article = {
  id: string
  slug: string
  title: string
  /** Linha fina: resumo exibido no cartão e abaixo do título. */
  excerpt: string
  /** Corpo em texto simples; parágrafos separados por linha em branco, "## " para intertítulos. */
  body: string
  editoria: string
  author: string
  /** Chapéu: rótulo curto acima do título (ex.: "Urgente", "Exclusivo"). */
  kicker: string
  kicker_tone: KickerTone
  image_url: string
  image_caption: string
  /** Fotos extras da capa: com elas, a capa vira um carrossel (a 1ª é image_url). */
  gallery: string[]
  access: ArticleAccess
  status: ArticleStatus
  /** Aparência e posição do cartão na página inicial. */
  on_home: boolean
  home_order: number
  card_size: CardSize
  show_image: boolean
  show_excerpt: boolean
  published_at: string
  created_at: string
  updated_at: string
}
