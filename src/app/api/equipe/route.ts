import { randomBytes } from "node:crypto"
import type { NextRequest } from "next/server"
import { FieldValue } from "firebase-admin/firestore"
import { Resend } from "resend"
import { z } from "zod"

import { teamInviteEmail } from "@/lib/email/password-reset-email"
import { getAdminAuth, getAdminDb, isAdminConfigured } from "@/lib/firebase/admin"

/**
 * POST /api/equipe — cadastra um membro da equipe (somente administradores).
 *
 * Cabeçalho: Authorization: Bearer <ID token do Firebase do administrador>
 * Corpo: { name, email, role: "admin" | "editor" }
 *
 * - Conta nova: cria no Auth com senha aleatória, grava o perfil com o papel
 *   e envia o convite "Criar minha senha".
 * - Conta existente: só atualiza o papel (e o nome, se estiver vazio).
 * Devolve também o link de criação de senha, para o administrador copiar
 * caso o e-mail não chegue.
 */

const bodySchema = z.object({
  name: z.string().trim().min(2, "Informe o nome.").max(120),
  email: z.email("Informe um e-mail válido."),
  role: z.enum(["admin", "editor"]),
})

const roleLabels = { admin: "Administrador", editor: "Editor" } as const

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status })
}

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return json({ ok: false, message: "O servidor está sem as credenciais do Firebase Admin." }, 503)
  }

  // 1. Quem está pedindo precisa ser administrador.
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
  if (!token) return json({ ok: false, message: "Faça login novamente." }, 401)

  const auth = getAdminAuth()
  const db = getAdminDb()
  let callerName = "A administração"
  try {
    const caller = await auth.verifyIdToken(token)
    const callerProfile = await db.doc(`profiles/${caller.uid}`).get()
    if (callerProfile.data()?.role !== "admin") {
      return json({ ok: false, message: "Somente administradores podem cadastrar membros." }, 403)
    }
    callerName = (callerProfile.data()?.name as string) || caller.email || callerName
  } catch {
    return json({ ok: false, message: "Sua sessão expirou. Faça login novamente." }, 401)
  }

  // 2. Dados do novo membro.
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return json({ ok: false, message: parsed.error.issues[0]?.message ?? "Dados inválidos." }, 400)
  }
  const { name, role } = parsed.data
  const email = parsed.data.email.toLowerCase()

  // 3. Conta existente: só promove.
  let uid: string
  let existed = false
  try {
    const existing = await auth.getUserByEmail(email)
    uid = existing.uid
    existed = true
  } catch (error) {
    if ((error as { code?: string }).code !== "auth/user-not-found") {
      console.error("Falha ao procurar usuário", error)
      return json({ ok: false, message: "Não foi possível verificar o e-mail." }, 500)
    }
    const created = await auth.createUser({
      email,
      displayName: name,
      // Senha aleatória que ninguém conhece: a pessoa cria a dela pelo convite.
      password: randomBytes(24).toString("base64url"),
    })
    uid = created.uid
  }

  const profileRef = db.doc(`profiles/${uid}`)
  const current = await profileRef.get()
  await profileRef.set(
    {
      name: (current.data()?.name as string) || name,
      email,
      role,
      updated_at: FieldValue.serverTimestamp(),
      ...(current.exists ? {} : { created_at: FieldValue.serverTimestamp() }),
    },
    { merge: true }
  )

  if (existed) {
    return json({
      ok: true,
      existed: true,
      message: `${email} já tinha conta; agora é ${roleLabels[role].toLowerCase()}.`,
    })
  }

  // 4. Convite para criar a senha (página /redefinir-senha do próprio site).
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
  const firebaseLink = await auth.generatePasswordResetLink(email, { url: `${origin}/login` })
  const oobCode = new URL(firebaseLink).searchParams.get("oobCode") ?? ""
  const link = `${origin}/redefinir-senha?mode=resetPassword&oobCode=${encodeURIComponent(oobCode)}`

  let emailSent = false
  if (process.env.RESEND_API_KEY) {
    const message = teamInviteEmail({ name, email, roleLabel: roleLabels[role], invitedBy: callerName, link })
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.EMAIL_FROM || "Gente Querida, Gente Bacana <onboarding@resend.dev>",
      to: email,
      subject: message.subject,
      html: message.html,
      text: message.text,
    })
    emailSent = !error
    if (error) console.error("Convite não enviado", error)
  }

  return json({
    ok: true,
    existed: false,
    emailSent,
    link,
    message: emailSent
      ? `Convite enviado para ${email}.`
      : `Conta criada. O e-mail não pôde ser enviado; copie o link e envie para ${email}.`,
  })
}
