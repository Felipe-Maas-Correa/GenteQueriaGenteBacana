export const APP_TIME_ZONE = "America/Sao_Paulo"

/** Mantém apenas os dígitos de um texto. */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "")
}

/** Formata dígitos de telefone brasileiro: (55) 99999-9999 ou (55) 3333-4444. */
export function formatPhone(value: string | null | undefined): string {
  const digits = onlyDigits(value ?? "").slice(0, 11)
  if (digits.length === 0) return ""
  if (digits.length <= 2) return `(${digits}`
  const ddd = digits.slice(0, 2)
  const rest = digits.slice(2)
  const split = rest.length === 9 ? 5 : 4
  if (rest.length <= split) return `(${ddd}) ${rest}`
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`
}

/**
 * Formata uma data ISO (AAAA-MM-DD) como DD/MM/AAAA sem passar por `Date`,
 * evitando deslocamentos de fuso horário.
 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return ""
  const [year, month, day] = iso.slice(0, 10).split("-")
  if (!year || !month || !day) return ""
  return `${day}/${month}/${year}`
}

/** Formata um carimbo de data/hora no fuso de Brasília. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return ""
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE,
  }).format(new Date(iso))
}

/** Data de hoje (AAAA-MM-DD) no fuso de Brasília. Chamar apenas em tempo de requisição. */
export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIME_ZONE }).format(
    new Date()
  )
}

/** Diferença em dias entre duas datas ISO (b − a). */
export function diffInDays(a: string, b: string): number {
  const toUTC = (iso: string) => {
    const [y, m, d] = iso.split("-").map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000)
}

const numberFormatter = new Intl.NumberFormat("pt-BR")

export function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

/** Remove acentos e padroniza em minúsculas — espelha a coluna `search_text` do banco. */
export function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
}
