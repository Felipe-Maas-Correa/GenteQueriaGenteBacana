import { addDoc, collection, serverTimestamp } from "firebase/firestore"

import { getDb, getFirebaseAuth } from "@/lib/firebase/client"
import { firestoreErrorMessage, withTimeout } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"

/**
 * Envio de imagens sem Firebase Storage (plano gratuito).
 *
 * A imagem é reduzida no navegador e gravada em base64 na coleção `imagens`
 * do Firestore (limite de 1 MiB por documento). Quem usa guarda só o endereço
 * "/api/imagens/{id}", que o site resolve ao exibir (features/news/image-source).
 */
type Preset = {
  maxSide: number
  maxBase64: number
  /** Recorta em quadrado (fotos de perfil). */
  square?: boolean
}

const PRESETS = {
  // Fotos de notícia: até 1600px; ~700 KB em base64.
  article: { maxSide: 1600, maxBase64: 700_000 },
  // Foto de perfil: quadrada, 320px; bem pequena.
  avatar: { maxSide: 320, maxBase64: 100_000, square: true },
} satisfies Record<string, Preset>

export type ImageKind = keyof typeof PRESETS

async function compress(file: File, preset: Preset) {
  const bitmap = await createImageBitmap(file)
  let side = preset.maxSide
  try {
    for (let attempt = 0; attempt < 8; attempt++) {
      // Recorte central quadrado (avatar) ou imagem inteira.
      const crop = preset.square ? Math.min(bitmap.width, bitmap.height) : null
      const sw = crop ?? bitmap.width
      const sh = crop ?? bitmap.height
      const sx = crop ? (bitmap.width - crop) / 2 : 0
      const sy = crop ? (bitmap.height - crop) / 2 : 0
      const scale = Math.min(1, side / Math.max(sw, sh))

      const canvas = document.createElement("canvas")
      canvas.width = Math.round(sw * scale)
      canvas.height = Math.round(sh * scale)
      const context = canvas.getContext("2d")
      if (!context) throw new Error("canvas")
      context.fillStyle = "#ffffff" // PNG com transparência vira fundo branco
      context.fillRect(0, 0, canvas.width, canvas.height)
      context.drawImage(bitmap, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height)

      for (const quality of [0.85, 0.75, 0.65]) {
        const dataUrl = canvas.toDataURL("image/jpeg", quality)
        const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1)
        if (base64.length <= preset.maxBase64) {
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

/** Reduz e grava a imagem; devolve o endereço "/api/imagens/{id}". */
export async function uploadImage(
  file: File,
  kind: ImageKind = "article"
): Promise<ActionResult<{ url: string }>> {
  if (!file.type.startsWith("image/")) {
    return actionError("Selecione um arquivo de imagem (JPG, PNG ou WebP).")
  }
  if (file.size > 25 * 1024 * 1024) {
    return actionError("A foto é muito grande (máximo de 25 MB).")
  }
  let image: Awaited<ReturnType<typeof compress>>
  try {
    image = await compress(file, PRESETS[kind])
  } catch {
    return actionError("Não foi possível processar esta imagem. Tente outra foto.")
  }
  try {
    const created = await withTimeout(
      addDoc(collection(getDb(), "imagens"), {
        data: image.base64,
        content_type: "image/jpeg",
        kind,
        created_by: getFirebaseAuth().currentUser?.uid ?? "",
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
