import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage, withTimeout } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { articleSchema, type ArticleInput } from "@/lib/validations/article"
import type { CardSize } from "@/types/database"

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
  const { publish_at, ...data } = parsed.data
  // Data escolhida (agendamento ou data retroativa); vazia = agora.
  const chosenDate = publish_at ? Timestamp.fromDate(new Date(publish_at)) : null

  try {
    if (await slugInUse(data.slug, id)) {
      const message = "Já existe uma notícia com este endereço."
      return actionError(message, { slug: [message] })
    }

    const db = getDb()
    if (id === null) {
      const created = await addDoc(collection(db, "articles"), {
        ...data,
        // Novas notícias entram no topo da página inicial.
        home_order: -Date.now(),
        published_at:
          data.status === "published" ? (chosenDate ?? serverTimestamp()) : chosenDate,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      return { ok: true, message: "Notícia criada.", data: { id: created.id } }
    }

    const docRef = doc(db, "articles", id)
    const current = await getDoc(docRef)
    if (!current.exists()) return actionError("Notícia não encontrada.")
    const firstPublish =
      data.status === "published" && !current.data().published_at
    await updateDoc(docRef, {
      ...data,
      ...(chosenDate
        ? { published_at: chosenDate }
        : firstPublish
          ? { published_at: serverTimestamp() }
          : {}),
      updated_at: serverTimestamp(),
    })
    return { ok: true, message: "Alterações salvas.", data: { id } }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export async function deleteArticle(id: string): Promise<ActionResult> {
  try {
    await deleteDoc(doc(getDb(), "articles", id))
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

/**
 * Fotos das notícias (gratuito, sem Firebase Storage).
 *
 * A foto é reduzida no navegador e gravada em base64 na coleção `imagens` do
 * Firestore (limite de 1 MiB por documento). A notícia guarda só o endereço
 * /api/imagens/{id}; o navegador busca a foto no Firestore ao exibir
 * (veja image-source.tsx).
 */
const MAX_SIDE = 1600
// Base64 cresce ~33%: 700 KB de base64 ≈ 520 KB de imagem, bem abaixo de 1 MiB.
const MAX_BASE64_LENGTH = 700_000

async function compressImage(
  file: File
): Promise<{ base64: string; width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  let side = MAX_SIDE
  try {
    // Reduz qualidade e, se preciso, o tamanho até caber no limite.
    for (let attempt = 0; attempt < 8; attempt++) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement("canvas")
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const context = canvas.getContext("2d")
      if (!context) throw new Error("canvas")
      context.fillStyle = "#ffffff" // PNG com transparência vira fundo branco
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      for (const quality of [0.85, 0.75, 0.65]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality)
        const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)
        if (base64.length <= MAX_BASE64_LENGTH) {
          return { base64, width: canvas.width, height: canvas.height }
        }
      }
      side = Math.round(side * 0.8)
    }
  } finally {
    bitmap.close()
  }
  throw new Error("too-large")
}

/** Grava a foto no Firestore e devolve o endereço público dela. */
export async function uploadArticleImage(
  file: File
): Promise<ActionResult<{ url: string }>> {
  if (!file.type.startsWith("image/")) {
    return actionError("Selecione um arquivo de imagem (JPG, PNG ou WebP).")
  }
  if (file.size > 25 * 1024 * 1024) {
    return actionError("A foto é muito grande (máximo de 25 MB).")
  }
  let image: Awaited<ReturnType<typeof compressImage>>
  try {
    image = await compressImage(file)
  } catch {
    return actionError("Não foi possível processar esta imagem. Tente outra foto.")
  }
  try {
    const created = await withTimeout(
      addDoc(collection(getDb(), "imagens"), {
        data: image.base64,
        content_type: "image/jpeg",
        width: image.width,
        height: image.height,
        size: Math.round((image.base64.length * 3) / 4),
        created_at: serverTimestamp(),
      }),
      20_000
    )
    return { ok: true, message: "Foto enviada.", data: { url: `/api/imagens/${created.id}` } }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}
