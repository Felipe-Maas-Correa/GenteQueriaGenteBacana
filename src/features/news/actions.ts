import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  where,
  writeBatch,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { uploadImage } from "@/lib/images/upload"
import { articleSchema, type ArticleInput } from "@/lib/validations/article"
import type { CardSize } from "@/types/database"

/** Prévia aberta das notícias "parcialmente abertas": os 3 primeiros blocos. */
const PREVIEW_BLOCKS = 3

export function previewOf(html: string): string {
  if (typeof DOMParser === "undefined") return ""
  const root = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html").body.firstElementChild
  if (!root) return ""
  return Array.from(root.children)
    .slice(0, PREVIEW_BLOCKS)
    .map((element) => element.outerHTML)
    .join("")
}

function toFieldErrors(issues: { path: PropertyKey[]; message: string }[]) {
  const errors: Record<string, string[]> = {}
  for (const issue of issues) {
    const key = String(issue.path[0])
    errors[key] = [...(errors[key] ?? []), issue.message]
  }
  return errors
}

async function slugInUse(slug: string, ignoreId: string | null) {
  const snapshot = await getDocs(
    query(collection(getDb(), "articles"), where("slug", "==", slug))
  )
  return snapshot.docs.some((d) => d.id !== ignoreId)
}

/** Cria (id = null) ou atualiza uma notícia. Devolve o id salvo. */
export async function saveArticle(
  id: string | null,
  input: ArticleInput
): Promise<ActionResult<{ id: string }>> {
  const parsed = articleSchema.safeParse(input)
  if (!parsed.success) {
    return actionError(
      "Confira os campos destacados.",
      toFieldErrors(parsed.error.issues)
    )
  }
  const { publish_at, body: fullBody, ...rest } = parsed.data
  // Data escolhida (agendamento ou data retroativa); vazia = agora.
  const chosenDate = publish_at ? Timestamp.fromDate(new Date(publish_at)) : null

  // Notícia restrita: o documento público guarda só a prévia (ou nada) e o
  // texto inteiro vai para articles/{id}/privado/conteudo, que as regras
  // liberam apenas para assinantes ativos e para a equipe. Esconder na tela
  // não basta: qualquer um pode ler o banco direto pelo navegador.
  const publicBody =
    rest.access === "public" ? fullBody : rest.access === "partial" ? previewOf(fullBody) : ""
  const data = { ...rest, body: publicBody }

  try {
    if (await slugInUse(data.slug, id)) {
      const message = "Já existe uma notícia com este endereço."
      return actionError(message, { slug: [message] })
    }

    const db = getDb()
    if (id === null) {
      const ref = doc(collection(db, "articles"))
      const batch = writeBatch(db)
      batch.set(ref, {
        ...data,
        // Novas notícias entram no topo da página inicial.
        home_order: -Date.now(),
        published_at:
          data.status === "published" ? (chosenDate ?? serverTimestamp()) : chosenDate,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      if (rest.access !== "public") {
        batch.set(doc(db, "articles", ref.id, "privado", "conteudo"), { body: fullBody })
      }
      await batch.commit()
      return { ok: true, message: "Notícia criada.", data: { id: ref.id } }
    }

    const docRef = doc(db, "articles", id)
    const current = await getDoc(docRef)
    if (!current.exists()) return actionError("Notícia não encontrada.")
    const firstPublish =
      data.status === "published" && !current.data().published_at
    const batch = writeBatch(db)
    batch.update(docRef, {
      ...data,
      ...(chosenDate
        ? { published_at: chosenDate }
        : firstPublish
          ? { published_at: serverTimestamp() }
          : {}),
      updated_at: serverTimestamp(),
    })
    const privateRef = doc(db, "articles", id, "privado", "conteudo")
    // Só mexe no texto restrito quando a notícia é (ou era) restrita.
    const wasRestricted = (current.data().access ?? "public") !== "public"
    if (rest.access !== "public") batch.set(privateRef, { body: fullBody })
    else if (wasRestricted) batch.delete(privateRef)
    await batch.commit()
    return { ok: true, message: "Alterações salvas.", data: { id } }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  try {
    const db = getDb()
    const batch = writeBatch(db)
    const current = await getDoc(doc(db, "articles", id))
    if ((current.data()?.access ?? "public") !== "public") {
      batch.delete(doc(db, "articles", id, "privado", "conteudo"))
    }
    batch.delete(doc(db, "articles", id))
    await batch.commit()
    return { ok: true, message: "Notícia excluída." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export type HomeLayoutItem = {
  id: string
  on_home: boolean
  card_size: CardSize
  show_image: boolean
  show_excerpt: boolean
}

/** Grava ordem e aparência dos cartões da página inicial de uma só vez. */
export async function saveHomeLayout(
  items: HomeLayoutItem[]
): Promise<ActionResult> {
  try {
    const db = getDb()
    const batch = writeBatch(db)
    items.forEach((item, index) => {
      batch.update(doc(db, "articles", item.id), {
        on_home: item.on_home,
        home_order: index,
        card_size: item.card_size,
        show_image: item.show_image,
        show_excerpt: item.show_excerpt,
        updated_at: serverTimestamp(),
      })
    })
    await batch.commit()
    return { ok: true, message: "Página inicial atualizada." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/** Fotos das notícias: veja lib/images/upload.ts. */
export function uploadArticleImage(file: File) {
  return uploadImage(file, "article")
}
