/**
 * Modelo de dados da aplicação (coleções do Firestore).
 *
 * Os nomes de campo são mantidos em snake_case para que os componentes de
 * interface, validações e formulários permaneçam estáveis. Datas de criação e
 * atualização são expostas como ISO string (convertidas de Timestamp do
 * Firestore na camada de dados).
 */
export type SubscriberStatus = "active" | "inactive"
export type UserRole = "admin" | "editor" | "pending"

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
}

export type Tables<T extends keyof TableRowMap> = TableRowMap[T]
