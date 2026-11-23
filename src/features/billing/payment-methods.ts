import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"

/**
 * Formas de pagamento das faturas.
 *
 * - Pelo site (online): Pix, cartão de crédito, cartão de débito e boleto.
 *   Ainda sem provedor integrado: aparecem como "em breve". Quando a
 *   integração existir, ela grava `payment_provider`/`payment_id` na fatura.
 * - Direto com o jornal: o leitor paga ao dono (Pix na chave dele, dinheiro,
 *   transferência…) e um administrador dá a baixa manual no painel.
 *
 * Configuração em config/pagamento (só administradores alteram).
 */

export type OnlineMethod = "pix" | "cartao_credito" | "cartao_debito" | "boleto"
export type CheckoutMethod = OnlineMethod | "direto"

/** Como o administrador registra um pagamento recebido fora do site. */
export type ManualMethod =
  | "pix_direto"
  | "dinheiro"
  | "transferencia"
  | "cartao_maquininha"
  | "outro"

export const ONLINE_METHODS: OnlineMethod[] = ["pix", "cartao_credito", "cartao_debito", "boleto"]
export const CHECKOUT_METHODS: CheckoutMethod[] = [...ONLINE_METHODS, "direto"]
export const MANUAL_METHODS: ManualMethod[] = [
  "pix_direto",
  "dinheiro",
  "transferencia",
  "cartao_maquininha",
  "outro",
]

export const checkoutMethodInfo: Record<CheckoutMethod, { label: string; description: string }> = {
  pix: {
    label: "Pix",
    description: "Pague na hora com o QR Code ou o Pix copia e cola. Confirmação automática.",
  },
  cartao_credito: {
    label: "Cartão de crédito",
    description: "Visa, Mastercard, Elo e outras bandeiras.",
  },
  cartao_debito: {
    label: "Cartão de débito",
    description: "Débito à vista, direto da sua conta.",
  },
  boleto: {
    label: "Boleto bancário",
    description: "Pague no banco, lotérica ou aplicativo. Compensa em até 3 dias úteis.",
  },
  direto: {
    label: "Direto com o jornal",
    description: "Pague ao responsável pelo jornal (Pix, dinheiro ou transferência). A equipe confirma o pagamento.",
  },
}

export const manualMethodLabels: Record<ManualMethod, string> = {
  pix_direto: "Pix direto ao jornal",
  dinheiro: "Dinheiro",
  transferencia: "Transferência / depósito",
  cartao_maquininha: "Cartão na maquininha",
  outro: "Outro",
}

/** Rótulo de qualquer forma gravada na fatura (online ou manual). */
export function paymentMethodLabel(method: string): string {
  if (method in checkoutMethodInfo) return checkoutMethodInfo[method as CheckoutMethod].label
  if (method in manualMethodLabels) return manualMethodLabels[method as ManualMethod]
  return method || "—"
}

export type PaymentConfig = {
  /** Quais formas aparecem para o leitor na tela de pagamento. */
  enabled: Record<CheckoutMethod, boolean>
  /** Pagamento direto: dados do responsável pelo jornal. */
  direct_pix_key: string
  direct_pix_name: string
  direct_contact: string
  direct_instructions: string
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  enabled: { pix: true, cartao_credito: true, cartao_debito: true, boleto: true, direto: true },
  direct_pix_key: "",
  direct_pix_name: "",
  direct_contact: "",
  direct_instructions: "",
}

/**
 * Ainda não há provedor de pagamento online integrado: Pix, cartão e boleto
 * aparecem como "em breve". Vira `true` quando a integração for feita.
 */
export const ONLINE_PAYMENTS_READY = false

export async function getPaymentConfig(): Promise<PaymentConfig> {
  // Sem configuração (ou sem permissão de leitura), usa o padrão: a tela de
  // pagamento continua funcionando.
  const snapshot = await getDoc(doc(getDb(), "config", "pagamento")).catch(() => null)
  const data = snapshot?.data() ?? {}
  const enabled = (data.enabled ?? {}) as Record<string, unknown>
  const text = (key: string) => (typeof data[key] === "string" ? (data[key] as string) : "")
  return {
    enabled: Object.fromEntries(
      CHECKOUT_METHODS.map((m) => [
        m,
        typeof enabled[m] === "boolean" ? enabled[m] : DEFAULT_PAYMENT_CONFIG.enabled[m],
      ])
    ) as Record<CheckoutMethod, boolean>,
    direct_pix_key: text("direct_pix_key"),
    direct_pix_name: text("direct_pix_name"),
    direct_contact: text("direct_contact"),
    direct_instructions: text("direct_instructions"),
  }
}

export async function savePaymentConfig(config: PaymentConfig): Promise<ActionResult> {
  if (!CHECKOUT_METHODS.some((m) => config.enabled[m])) {
    return actionError("Deixe pelo menos uma forma de pagamento ligada.")
  }
  if (config.direct_pix_key.length > 140 || config.direct_pix_name.length > 120) {
    return actionError("Chave Pix ou nome muito longos.")
  }
  if (config.direct_contact.length > 60 || config.direct_instructions.length > 1000) {
    return actionError("Contato ou instruções muito longos.")
  }
  try {
    await setDoc(doc(getDb(), "config", "pagamento"), {
      enabled: config.enabled,
      direct_pix_key: config.direct_pix_key.trim(),
      direct_pix_name: config.direct_pix_name.trim(),
      direct_contact: config.direct_contact.trim(),
      direct_instructions: config.direct_instructions.trim(),
      updated_at: serverTimestamp(),
    })
    return { ok: true, message: "Formas de pagamento salvas." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}
