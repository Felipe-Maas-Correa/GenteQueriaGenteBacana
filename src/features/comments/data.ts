import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage, tsToISO, withTimeout } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"

/**
 * Comentários das notícias (coleção `comentarios`).
 *
 * - Comentário principal: parent_id = null.
 * - Resposta: parent_id = id do comentário principal (as respostas ficam num
 *   nível só, como no Instagram/TikTok; responder uma resposta usa @nome).
 * - Curtidas: lista de uids em `liked_by` (cada pessoa curte uma vez).
 * - author_subscriber: selo de assinante. As regras do banco conferem que
 *   ele só é verdadeiro se a assinatura de quem comenta estiver ativa.
 * - Apagar é "suave": o texto some e fica "comentário apagado" se houver
 *   respostas, para a conversa não perder o sentido.
 */
export const MAX_COMMENT_LENGTH = 1000

export type Comment = {
  id: string
  article_id: string
  parent_id: string | null
  author_uid: string
  author_name: string
  author_photo: string
  author_subscriber: boolean
  text: string
  liked_by: string[]
  reply_count: number
  deleted: boolean
  created_at: string
}

function mapComment(id: string, data: Record<string, unknown>): Comment {
  return {
    id,
    article_id: (data.article_id as string) ?? "",
    parent_id: (data.parent_id as string | null) ?? null,
    author_uid: (data.author_uid as string) ?? "",
    author_name: (data.author_name as string) || "Leitor",
    author_photo: (data.author_photo as string) ?? "",
    author_subscriber: data.author_subscriber === true,
    text: (data.text as string) ?? "",
    liked_by: Array.isArray(data.liked_by) ? (data.liked_by as string[]) : [],
    reply_count: typeof data.reply_count === "number" ? data.reply_count : 0,
    deleted: data.deleted === true,
    // Recém-criado ainda sem o horário do servidor: trata como "agora".
    created_at: tsToISO(data.created_at) || new Date().toISOString(),
  }
}

/** Todos os comentários de uma notícia (principais e respostas). */
export async function listComments(articleId: string): Promise<Comment[]> {
  const snapshot = await withTimeout(
    getDocs(query(collection(getDb(), "comentarios"), where("article_id", "==", articleId)))
  )
  return snapshot.docs.map((d) => mapComment(d.id, d.data()))
}

export type Author = {
  uid: string
  name: string
  photo: string
  subscriber: boolean
}

export async function addComment(input: {
  articleId: string
  parentId: string | null
  author: Author
  text: string
}): Promise<ActionResult<{ comment: Comment }>> {
  const text = input.text.trim()
  if (!text) return actionError("Escreva seu comentário.")
  if (text.length > MAX_COMMENT_LENGTH) {
    return actionError(`O comentário pode ter no máximo ${MAX_COMMENT_LENGTH} caracteres.`)
  }
  try {
    const db = getDb()
    const ref = doc(collection(db, "comentarios"))
    const data = {
      article_id: input.articleId,
      parent_id: input.parentId,
      author_uid: input.author.uid,
      author_name: input.author.name,
      author_photo: input.author.photo,
      author_subscriber: input.author.subscriber,
      text,
      liked_by: [] as string[],
      reply_count: 0,
      deleted: false,
      created_at: serverTimestamp(),
    }
    const batch = writeBatch(db)
    batch.set(ref, data)
    if (input.parentId) {
      batch.update(doc(db, "comentarios", input.parentId), { reply_count: increment(1) })
    }
    await batch.commit()
    return {
      ok: true,
      message: input.parentId ? "Resposta publicada." : "Comentário publicado.",
      data: { comment: mapComment(ref.id, { ...data, created_at: null }) },
    }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export async function toggleLike(comment: Comment, uid: string, like: boolean): Promise<ActionResult> {
  try {
    await updateDoc(doc(getDb(), "comentarios", comment.id), {
      liked_by: like ? arrayUnion(uid) : arrayRemove(uid),
    })
    return { ok: true, message: like ? "Curtido." : "Curtida removida." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/** Apaga (suave) o comentário; respostas apagadas descontam do total. */
export async function deleteComment(comment: Comment): Promise<ActionResult> {
  try {
    const db = getDb()
    const batch = writeBatch(db)
    batch.update(doc(db, "comentarios", comment.id), { deleted: true, text: "" })
    if (comment.parent_id) {
      batch.update(doc(db, "comentarios", comment.parent_id), { reply_count: increment(-1) })
    }
    await batch.commit()
    return { ok: true, message: "Comentário apagado." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/** "agora", "5 min", "3 h", "2 d", "4 sem" ou a data. */
export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, (now - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return "agora"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} d`
  if (days < 30) return `${Math.floor(days / 7)} sem`
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso))
}
