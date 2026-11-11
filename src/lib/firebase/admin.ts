/**
 * Firebase Admin — SOMENTE NO SERVIDOR (rotas em src/app/api).
 *
 * Usa uma conta de serviço (Console › Configurações do projeto › Contas de
 * serviço › Gerar nova chave privada). As credenciais ficam em variáveis de
 * ambiente sem o prefixo NEXT_PUBLIC_, então nunca vão para o navegador.
 */
import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app"
import { getAuth, type Auth } from "firebase-admin/auth"

export function isAdminConfigured(): boolean {
  return Boolean(
    process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
      process.env.FIREBASE_ADMIN_PRIVATE_KEY &&
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  )
}

function adminApp(): App {
  if (getApps().length) return getApp()
  return initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // A chave vem com "\n" escapados quando colada em uma linha só.
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  })
}

export function getAdminAuth(): Auth {
  return getAuth(adminApp())
}
