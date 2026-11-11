import { sendPasswordResetEmail } from "firebase/auth"

import { getFirebaseAuth } from "@/lib/firebase/client"
import { actionError, type ActionResult } from "@/lib/utils/action-result"

/**
 * Envia o e-mail de redefinição de senha em português. O link do e-mail leva
 * à página /redefinir-senha do próprio site quando a "URL de ação" estiver
 * configurada no Console do Firebase (veja o README).
 */
export async function sendResetEmail(email: string): Promise<ActionResult> {
  const auth = getFirebaseAuth()
  auth.languageCode = "pt-BR"
  try {
    await sendPasswordResetEmail(auth, email.trim(), {
      // Depois de salvar a nova senha, o botão "Continuar" volta ao login.
      url: `${window.location.origin}/login`,
    })
    return {
      ok: true,
      message: `Enviamos um link para ${email.trim()} para você criar uma nova senha.`,
    }
  } catch (error) {
    const code = (error as { code?: string }).code
    if (code === "auth/invalid-email" || code === "auth/missing-email") {
      return actionError("Informe um e-mail válido.")
    }
    if (code === "auth/too-many-requests") {
      return actionError("Muitas tentativas. Aguarde alguns minutos.")
    }
    if (code === "auth/unauthorized-continue-uri") {
      return actionError("Este domínio não está autorizado no Firebase (Authentication › Configurações › Domínios autorizados).")
    }
    return actionError("Não foi possível enviar o e-mail. Tente novamente.")
  }
}
