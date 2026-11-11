import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore"

import { getDb, getFirebase } from "@/lib/firebase/client"
import { tsToISO, withTimeout } from "@/lib/firebase/firestore-helpers"
import type { Article } from "@/types/database"

export function mapArticle(id: string, data: Record<string, unknown>): Article {
  const str = (key: string) => (data[key] as string) ?? ""
  return {
    id,
    slug: str("slug"),
    title: str("title"),
    excerpt: str("excerpt"),
    body: str("body"),
    editoria: str("editoria"),
    author: str("author"),
    kicker: str("kicker"),
    kicker_tone: data.kicker_tone === "urgent" ? "urgent" : "default",
    image_url: str("image_url"),
    image_caption: str("image_caption"),
    status: data.status === "published" ? "published" : "draft",
    on_home: data.on_home === true,
    home_order: typeof data.home_order === "number" ? data.home_order : 0,
    card_size:
      data.card_size === "hero" || data.card_size === "large"
        ? data.card_size
        : "small",
    show_image: data.show_image !== false,
    show_excerpt: data.show_excerpt !== false,
    published_at: tsToISO(data.published_at),
    created_at: tsToISO(data.created_at),
    updated_at: tsToISO(data.updated_at),
  }
}

const byNewest = (a: Article, b: Article) =>
  (b.published_at || b.updated_at).localeCompare(a.published_at || a.updated_at)

/** Publicada com data futura: só aparece no site quando chegar a hora. */
export function isScheduled(article: Article, now = Date.now()): boolean {
  return (
    article.status === "published" &&
    Boolean(article.published_at) &&
    new Date(article.published_at).getTime() > now
  )
}

export const byHomeOrder = (a: Article, b: Article) =>
  a.home_order - b.home_order || byNewest(a, b)

/* ── Painel (equipe) ─────────────────────────────────────────── */

/** Todas as notícias, rascunhos incluídos, da última editada para a mais antiga. */
export async function listAllArticles(): Promise<Article[]> {
  const snapshot = await getDocs(collection(getDb(), "articles"))
  return snapshot.docs
    .map((d) => mapArticle(d.id, d.data()))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
}

export async function getArticle(id: string): Promise<Article | null> {
  const snapshot = await getDoc(doc(getDb(), "articles", id))
  return snapshot.exists() ? mapArticle(snapshot.id, snapshot.data()) : null
}

/* ── Site público ────────────────────────────────────────────────
 * As notícias vêm exclusivamente do banco. As consultas sempre filtram por
 * `status == "published"`: é a condição que as Security Rules exigem para a
 * leitura anônima. Sem resposta do banco em alguns segundos, a consulta falha
 * e a tela mostra o erro com opção de tentar de novo.
 */

async function publishedQuery(): Promise<Article[]> {
  if (!getFirebase()) return []
  const snapshot = await withTimeout(
    getDocs(
      query(collection(getDb(), "articles"), where("status", "==", "published"))
    )
  )
  const now = Date.now()
  return snapshot.docs
    .map((d) => mapArticle(d.id, d.data()))
    .filter((article) => !isScheduled(article, now))
    .sort(byNewest)
}

/** Todas as notícias publicadas, da mais recente para a mais antiga. */
export function listPublishedArticles(): Promise<Article[]> {
  return publishedQuery()
}

/** Notícias da página inicial, na ordem definida no painel. */
export async function listHomeArticles(): Promise<Article[]> {
  const articles = await publishedQuery()
  return articles.filter((a) => a.on_home).sort(byHomeOrder)
}

export async function getPublishedArticle(
  slug: string
): Promise<{ article: Article | null; related: Article[] }> {
  if (!getFirebase()) return { article: null, related: [] }
  const snapshot = await withTimeout(
    getDocs(
      query(
        collection(getDb(), "articles"),
        where("status", "==", "published"),
        where("slug", "==", slug),
        limit(1)
      )
    )
  )
  const found = snapshot.docs[0]
  if (!found) return { article: null, related: [] }
  const article = mapArticle(found.id, found.data())
  if (isScheduled(article)) return { article: null, related: [] }
  const others = await publishedQuery().catch(() => [])
  return {
    article,
    related: others.filter((a) => a.id !== article.id).slice(0, 3),
  }
}
