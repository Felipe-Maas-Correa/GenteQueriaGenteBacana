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
import { tsToISO } from "@/lib/firebase/firestore-helpers"
import type { Article } from "@/types/database"

import { demoAsArticles } from "./demo-articles"

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
 * As consultas sempre filtram por `status == "published"`: é a condição que
 * as Security Rules exigem para leitura anônima. Sem Firebase configurado ou
 * sem nenhuma notícia publicada, o site mostra o conteúdo de exemplo.
 */

export type PublicFeed = { articles: Article[]; demo: boolean }

/**
 * O SDK do Firestore fica tentando reconectar indefinidamente quando o banco
 * não existe ou está fora do ar; o leitor não deve ver um carregamento eterno.
 */
const PUBLIC_TIMEOUT_MS = 8000

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), PUBLIC_TIMEOUT_MS)
    ),
  ])
}

async function publishedQuery(): Promise<Article[]> {
  const snapshot = await withTimeout(
    getDocs(
      query(collection(getDb(), "articles"), where("status", "==", "published"))
    )
  )
  return snapshot.docs.map((d) => mapArticle(d.id, d.data())).sort(byNewest)
}

export async function listPublishedArticles(): Promise<PublicFeed> {
  if (!getFirebase()) return { articles: demoAsArticles(), demo: true }
  let articles: Article[] = []
  try {
    articles = await publishedQuery()
  } catch (error) {
    // Banco indisponível ou regras ainda não publicadas: mostra o exemplo.
    console.warn("Notícias indisponíveis; exibindo conteúdo de exemplo.", error)
  }
  return articles.length
    ? { articles, demo: false }
    : { articles: demoAsArticles(), demo: true }
}

/** Notícias da página inicial, na ordem definida no painel. */
export async function listHomeArticles(): Promise<PublicFeed> {
  const feed = await listPublishedArticles()
  if (feed.demo) return feed
  return {
    articles: feed.articles.filter((a) => a.on_home).sort(byHomeOrder),
    demo: false,
  }
}

export async function getPublishedArticle(
  slug: string
): Promise<{ article: Article | null; related: Article[]; demo: boolean }> {
  if (getFirebase()) {
    try {
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
      if (found) {
        const article = mapArticle(found.id, found.data())
        const others = await publishedQuery().catch(() => [])
        return {
          article,
          related: others.filter((a) => a.id !== article.id).slice(0, 3),
          demo: false,
        }
      }
    } catch (error) {
      console.warn("Notícia indisponível; tentando o conteúdo de exemplo.", error)
    }
  }
  const demo = demoAsArticles()
  return {
    article: demo.find((a) => a.slug === slug) ?? null,
    related: demo.filter((a) => a.slug !== slug).slice(0, 3),
    demo: true,
  }
}
