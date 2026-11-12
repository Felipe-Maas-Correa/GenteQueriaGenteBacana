import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { getDb, getFirebase } from "@/lib/firebase/client"
import { firestoreErrorMessage, withTimeout } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { normalizeSearch } from "@/lib/utils/format"
import { slugify } from "@/lib/validations/article"

/**
 * Editorias (seções do jornal) ficam na coleção `editorias` e são geridas no
 * painel. As notícias guardam o **id** da editoria, então renomear não quebra
 * nada; o `slug` identifica a seção na página /noticias.
 */
export const EDITORIA_COLORS = {
  azul: { label: "Azul", css: "var(--azul)" },
  vermelho: { label: "Vermelho", css: "var(--vermelho)" },
  ocre: { label: "Ocre", css: "oklch(0.68 0.14 80)" },
  petroleo: { label: "Petróleo", css: "oklch(0.5 0.08 195)" },
  verde: { label: "Verde", css: "oklch(0.52 0.11 150)" },
  roxo: { label: "Roxo", css: "oklch(0.5 0.13 300)" },
  grafite: { label: "Grafite", css: "var(--tinta-suave)" },
} as const

export type EditoriaColor = keyof typeof EDITORIA_COLORS

export type Editoria = {
  id: string
  name: string
  slug: string
  order: number
  color: EditoriaColor
  /** Aparece no menu do topo e no rodapé do site. */
  in_menu: boolean
}

export function colorCss(color: EditoriaColor | undefined): string {
  return EDITORIA_COLORS[color ?? "grafite"]?.css ?? EDITORIA_COLORS.grafite.css
}

function mapEditoria(id: string, data: Record<string, unknown>): Editoria {
  const color = data.color as EditoriaColor
  return {
    id,
    name: (data.name as string) ?? "",
    slug: (data.slug as string) ?? "",
    order: typeof data.order === "number" ? data.order : 0,
    color: color in EDITORIA_COLORS ? color : "grafite",
    in_menu: data.in_menu !== false,
  }
}

/** Lista pública (as regras permitem leitura a qualquer visitante). */
export async function listEditorias(): Promise<Editoria[]> {
  if (!getFirebase()) return []
  const snapshot = await withTimeout(getDocs(collection(getDb(), "editorias")))
  return snapshot.docs
    .map((d) => mapEditoria(d.id, d.data()))
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "pt-BR"))
}

function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 2) return "Informe o nome (mínimo de 2 caracteres)."
  if (trimmed.length > 40) return "O nome pode ter no máximo 40 caracteres."
  return null
}

function nameTaken(name: string, list: Editoria[], ignoreId?: string) {
  const normalized = normalizeSearch(name)
  return list.some((e) => e.id !== ignoreId && normalizeSearch(e.name) === normalized)
}

function uniqueSlug(name: string, list: Editoria[], ignoreId?: string) {
  const base = slugify(name) || "editoria"
  let slug = base
  let n = 2
  while (list.some((e) => e.id !== ignoreId && e.slug === slug)) slug = `${base}-${n++}`
  return slug
}

export async function createEditoria(
  name: string,
  color: EditoriaColor,
  current: Editoria[]
): Promise<ActionResult> {
  const invalid = validateName(name)
  if (invalid) return actionError(invalid)
  if (nameTaken(name, current)) return actionError("Já existe uma editoria com este nome.")
  try {
    await addDoc(collection(getDb(), "editorias"), {
      name: name.trim(),
      slug: uniqueSlug(name, current),
      color,
      in_menu: true,
      order: current.length ? Math.max(...current.map((e) => e.order)) + 1 : 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return { ok: true, message: "Editoria criada." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export async function updateEditoria(
  editoria: Editoria,
  changes: Partial<Pick<Editoria, "name" | "color" | "in_menu">>,
  current: Editoria[]
): Promise<ActionResult> {
  const patch: Record<string, unknown> = { ...changes, updated_at: serverTimestamp() }
  if (changes.name !== undefined) {
    const invalid = validateName(changes.name)
    if (invalid) return actionError(invalid)
    if (nameTaken(changes.name, current, editoria.id)) {
      return actionError("Já existe uma editoria com este nome.")
    }
    patch.name = changes.name.trim()
    patch.slug = uniqueSlug(changes.name, current, editoria.id)
  }
  try {
    await updateDoc(doc(getDb(), "editorias", editoria.id), patch)
    return { ok: true, message: "Editoria atualizada." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/** Grava a nova ordem de todas as editorias. */
export async function reorderEditorias(ordered: Editoria[]): Promise<ActionResult> {
  try {
    const db = getDb()
    const batch = writeBatch(db)
    ordered.forEach((e, index) => batch.update(doc(db, "editorias", e.id), { order: index }))
    await batch.commit()
    return { ok: true, message: "Ordem atualizada." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/** Só exclui se nenhuma notícia usar a editoria. */
export async function deleteEditoria(editoria: Editoria): Promise<ActionResult> {
  try {
    const db = getDb()
    const used = await getCountFromServer(
      query(collection(db, "articles"), where("editoria", "==", editoria.id))
    )
    const count = used.data().count
    if (count > 0) {
      return actionError(
        `${count} ${count === 1 ? "notícia usa" : "notícias usam"} esta editoria. Mude a editoria dessas notícias antes de excluir, ou apenas tire-a do menu.`
      )
    }
    await deleteDoc(doc(db, "editorias", editoria.id))
    return { ok: true, message: "Editoria excluída." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}
