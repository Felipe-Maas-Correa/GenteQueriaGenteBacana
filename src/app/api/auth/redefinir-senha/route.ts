import type { NextRequest } from "next/server"
import { Resend } from "resend"
import { z } from "zod"

import { passwordResetEmail } from "@/lib/email/password-reset-email"
import { getAdminAuth, isAdminConfigured } from "@/lib/firebase/admin"

/**
 * POST /api/auth/redefinir-senha  { email }
 *
 * Gera o link de redefinição com o Firebase Admin e envia o e-mail do jornal
 * pelo Resend. O botão do e-mail abre /redefinir-senha no próprio site.
 * Sem as variáveis de ambiente configuradas, responde 503 e o site usa o
 * e-mail padrão do Firebase.
 */

const bodySchema = z.object({ email: z.email() })

// Limite simples por IP (memória do servidor): 5 pedidos a cada 15 minutos.
const WINDOW_MS = 15 * 60_000
const MAX_REQUESTS = 5
const attempts = new Map<string, number[]>()

function rateLimited(key: string): boolean {
  const now = Date.now()
  const recent = (attempts.get(key) ?? []).filter((time) => now - time < WINDOW_MS)
  recent.push(now)
  attempts.set(key, recent)
  return recent.length > MAX_REQUESTS
}

const OK = { ok: true }

export async function POST(request: NextRequest) {
  if (!isAdminConfigured() || !process.env.RESEND_API_KEY) {
    return Response.json({ ok: false, code: "not-configured" }, { status: 503 })
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  if (rateLimited(ip)) {
    return Response.json({ ok: false, code: "too-many-requests" }, { status: 429 })
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return Response.json({ ok: false, code: "invalid-email" }, { status: 400 })
  }
  const { email } = parsed.data
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

  let firebaseLink: string
  try {
    firebaseLink = await getAdminAuth().generatePasswordResetLink(email, {
      url: `${origin}/login`,
    })
  } catch (error) {
    // Não revela se o e-mail existe: responde igual a um envio bem-sucedido.
    if ((error as { code?: string }).code === "auth/user-not-found") {
      return Response.json(OK)
    }
    console.error("Falha ao gerar o link de redefinição", error)
    return Response.json({ ok: false, code: "link-failed" }, { status: 500 })
  }

  // Troca a página padrão do Firebase pela página do jornal, mantendo o código.
  const oobCode = new URL(firebaseLink).searchParams.get("oobCode")
  if (!oobCode) {
    return Response.json({ ok: false, code: "link-failed" }, { status: 500 })
  }
  const link = `${origin}/redefinir-senha?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}`

  const message = passwordResetEmail({ email, link })
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: process.env.EMAIL_FROM || "Gente Querida, Gente Bacana <onboarding@resend.dev>",
    to: email,
    subject: message.subject,
    html: message.html,
    text: message.text,
  })

  if (error) {
    console.error("Falha ao enviar o e-mail de redefinição", error)
    return Response.json({ ok: false, code: "send-failed" }, { status: 502 })
  }
  return Response.json(OK)
}
