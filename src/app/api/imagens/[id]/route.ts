import type { NextRequest } from "next/server"

import { getAdminDb, isAdminConfigured } from "@/lib/firebase/admin"

/**
 * GET /api/imagens/{id} — entrega a foto guardada em base64 no Firestore
 * (coleção `imagens`) como um arquivo de imagem comum.
 *
 * Cada id é único e a imagem nunca muda, então o navegador e a CDN podem
 * guardar a resposta por 1 ano: o Firestore só é lido na primeira visita.
 */
export async function GET(
  _request: NextRequest,
  context: RouteContext<"/api/imagens/[id]">
) {
  const { id } = await context.params
  if (!/^[A-Za-z0-9]{10,40}$/.test(id)) {
    return new Response("Imagem não encontrada", { status: 404 })
  }
  if (!isAdminConfigured()) {
    return new Response("Servidor sem credenciais do Firebase Admin", { status: 503 })
  }

  const snapshot = await getAdminDb().collection("imagens").doc(id).get()
  const data = snapshot.data()
  if (!snapshot.exists || typeof data?.data !== "string") {
    return new Response("Imagem não encontrada", { status: 404 })
  }

  const bytes = Buffer.from(data.data, "base64")
  return new Response(bytes, {
    headers: {
      "Content-Type": typeof data.content_type === "string" ? data.content_type : "image/jpeg",
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
