/**
 * Notícias já abertas neste navegador (localStorage), usadas para o
 * "Continue lendo" preferir o que a pessoa ainda não leu. Não vai para o
 * banco: fica só no aparelho.
 */
const KEY = "gqgb:lidas"
const MAX = 300

export function readArticleIds(): Set<string> {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]")
    return new Set(Array.isArray(list) ? list.filter((id) => typeof id === "string") : [])
  } catch {
    return new Set()
  }
}

export function markArticleRead(id: string) {
  try {
    const list = [id, ...[...readArticleIds()].filter((other) => other !== id)].slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    // Sem armazenamento (modo privado etc.): só não lembra.
  }
}

/** Ordena deixando as não lidas primeiro (mantendo a ordem original em cada grupo). */
export function preferUnread<T extends { id: string }>(items: T[]): T[] {
  const read = readArticleIds()
  return [...items.filter((item) => !read.has(item.id)), ...items.filter((item) => read.has(item.id))]
}
