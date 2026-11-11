import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"
import { getDownloadURL, ref, uploadBytes } from "firebase/storage"

import { getDb, getFirebaseStorage } from "@/lib/firebase/client"
import { firestoreErrorMessage } from "@/lib/firebase/firestore-helpers"
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
  const data = parsed.data

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
        published_at: data.status === "published" ? serverTimestamp() : null,
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
      ...(firstPublish ? { published_at: serverTimestamp() } : {}),
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

/** Reduz a foto no navegador (lado maior ≤ 1920px, JPEG) antes do envio. */
async function compressImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("Falha ao processar a imagem.")),
      "image/jpeg",
      0.85
    )
  )
}

/** Envia a foto ao Firebase Storage e devolve o endereço público. */
export async function uploadArticleImage(
  file: File
): Promise<ActionResult<{ url: string }>> {
  if (!file.type.startsWith("image/")) {
    return actionError("Selecione um arquivo de imagem.")
  }
  try {
    const blob = await compressImage(file)
    const storageRef = ref(
      getFirebaseStorage(),
      `articles/${crypto.randomUUID()}.jpg`
    )
    await uploadBytes(storageRef, blob, { contentType: "image/jpeg" })
    return {
      ok: true,
      message: "Foto enviada.",
      data: { url: await getDownloadURL(storageRef) },
    }
  } catch (error) {
    const code = (error as { code?: string })?.code ?? ""
    if (code === "storage/unauthorized") {
      return actionError(
        "Sem permissão para enviar fotos. Publique as regras do Storage (storage.rules)."
      )
    }
    if (code.startsWith("storage/")) {
      return actionError(
        "Não foi possível enviar a foto. Verifique se o Firebase Storage está ativado ou cole o endereço de uma imagem."
      )
    }
    return actionError("Não foi possível processar a imagem.")
  }
}
