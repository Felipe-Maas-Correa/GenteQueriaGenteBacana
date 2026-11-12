import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore"

import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage, tsToISO } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"

/**
 * Assinaturas digitais e faturas.
 *
 * Coleções no Firestore:
 * - config/assinatura   → mensalidade padrão e dia de vencimento.
 * - assinaturas/{uid}   → uma por leitor (id = uid do Auth).
 * - faturas/{uid_AAAA-MM} → uma por assinante e mês (id fixo evita duplicar).
 *
 * Valores sempre em centavos (inteiros). Ainda não há meio de pagamento: os
 * campos `payment_*` ficam reservados para a futura integração (Pix, cartão…),
 * que vai marcar a fatura como paga pelo próprio provedor.
 */

export type SubscriptionStatus = "pendente" | "ativa" | "cancelada"
export type InvoiceStatus = "aberta" | "paga" | "cancelada"

export type BillingConfig = {
  monthly_price_cents: number
  /** Dia do mês para o vencimento das faturas (1–28). */
  due_day: number
}

export type Subscription = {
  uid: string
  name: string
  email: string
  phone: string
  address: string
  status: SubscriptionStatus
  /** Preço especial para este assinante; null = mensalidade padrão. */
  custom_price_cents: number | null
  custom_price_note: string
  started_at: string
  created_at: string
  updated_at: string
}

export type Invoice = {
  id: string
  uid: string
  name: string
  email: string
  /** Mês de referência no formato AAAA-MM. */
  reference_month: string
  amount_cents: number
  due_date: string
  status: InvoiceStatus
  paid_at: string
  /** Reservado para a integração de pagamento. */
  payment_provider: string
  payment_id: string
  payment_url: string
  created_at: string
}

export const DEFAULT_CONFIG: BillingConfig = { monthly_price_cents: 0, due_day: 10 }

/* ── Configuração (mensalidade) ─────────────────────────────── */

export async function getBillingConfig(): Promise<BillingConfig> {
  const snapshot = await getDoc(doc(getDb(), "config", "assinatura"))
  const data = snapshot.data()
  return {
    monthly_price_cents:
      typeof data?.monthly_price_cents === "number" ? data.monthly_price_cents : 0,
    due_day: typeof data?.due_day === "number" ? data.due_day : DEFAULT_CONFIG.due_day,
  }
}

export async function saveBillingConfig(config: BillingConfig): Promise<ActionResult> {
  if (!Number.isInteger(config.monthly_price_cents) || config.monthly_price_cents < 0) {
    return actionError("Informe um valor válido para a mensalidade.")
  }
  if (config.due_day < 1 || config.due_day > 28) {
    return actionError("O dia de vencimento deve ser entre 1 e 28.")
  }
  try {
    await setDoc(doc(getDb(), "config", "assinatura"), {
      ...config,
      updated_at: serverTimestamp(),
    })
    return { ok: true, message: "Mensalidade salva." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/* ── Assinaturas ────────────────────────────────────────────── */

function mapSubscription(uid: string, data: Record<string, unknown>): Subscription {
  const status = data.status as SubscriptionStatus
  return {
    uid,
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
    phone: (data.phone as string) ?? "",
    address: (data.address as string) ?? "",
    status: status === "ativa" || status === "cancelada" ? status : "pendente",
    custom_price_cents:
      typeof data.custom_price_cents === "number" ? data.custom_price_cents : null,
    custom_price_note: (data.custom_price_note as string) ?? "",
    started_at: tsToISO(data.started_at),
    created_at: tsToISO(data.created_at),
    updated_at: tsToISO(data.updated_at),
  }
}

export async function getMySubscription(uid: string): Promise<Subscription | null> {
  const snapshot = await getDoc(doc(getDb(), "assinaturas", uid))
  return snapshot.exists() ? mapSubscription(uid, snapshot.data()) : null
}

export async function listSubscriptions(): Promise<Subscription[]> {
  const snapshot = await getDocs(collection(getDb(), "assinaturas"))
  return snapshot.docs
    .map((d) => mapSubscription(d.id, d.data()))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

/** O leitor pede a assinatura (fica "pendente" até a equipe aprovar). */
export async function requestSubscription(input: {
  uid: string
  name: string
  email: string
  phone: string
  address: string
}): Promise<ActionResult> {
  if (input.name.trim().length < 2) return actionError("Informe seu nome.")
  if (input.phone.replace(/\D/g, "").length < 10) {
    return actionError("Informe um telefone com DDD.")
  }
  try {
    await setDoc(doc(getDb(), "assinaturas", input.uid), {
      name: input.name.trim(),
      email: input.email,
      phone: input.phone.trim(),
      address: input.address.trim(),
      status: "pendente",
      custom_price_cents: null,
      custom_price_note: "",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
    return { ok: true, message: "Pedido enviado! A equipe do jornal vai confirmar sua assinatura." }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/** Equipe: aprovar, cancelar ou reativar. */
export async function setSubscriptionStatus(
  uid: string,
  status: SubscriptionStatus
): Promise<ActionResult> {
  try {
    await updateDoc(doc(getDb(), "assinaturas", uid), {
      status,
      ...(status === "ativa" ? { started_at: serverTimestamp() } : {}),
      updated_at: serverTimestamp(),
    })
    const messages: Record<SubscriptionStatus, string> = {
      ativa: "Assinatura ativada.",
      cancelada: "Assinatura cancelada.",
      pendente: "Assinatura voltou para pendente.",
    }
    return { ok: true, message: messages[status] }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/** Equipe: preço especial (null volta para a mensalidade padrão). */
export async function setCustomPrice(
  uid: string,
  cents: number | null,
  note: string
): Promise<ActionResult> {
  if (cents !== null && (!Number.isInteger(cents) || cents < 0)) {
    return actionError("Informe um valor válido.")
  }
  try {
    await updateDoc(doc(getDb(), "assinaturas", uid), {
      custom_price_cents: cents,
      custom_price_note: cents === null ? "" : note.trim(),
      updated_at: serverTimestamp(),
    })
    return {
      ok: true,
      message: cents === null ? "Voltou para a mensalidade padrão." : "Preço especial salvo.",
    }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

export function priceFor(subscription: Subscription, config: BillingConfig): number {
  return subscription.custom_price_cents ?? config.monthly_price_cents
}

/* ── Faturas ────────────────────────────────────────────────── */

function mapInvoice(id: string, data: Record<string, unknown>): Invoice {
  const status = data.status as InvoiceStatus
  return {
    id,
    uid: (data.uid as string) ?? "",
    name: (data.name as string) ?? "",
    email: (data.email as string) ?? "",
    reference_month: (data.reference_month as string) ?? "",
    amount_cents: typeof data.amount_cents === "number" ? data.amount_cents : 0,
    due_date: (data.due_date as string) ?? "",
    status: status === "paga" || status === "cancelada" ? status : "aberta",
    paid_at: tsToISO(data.paid_at),
    payment_provider: (data.payment_provider as string) ?? "",
    payment_id: (data.payment_id as string) ?? "",
    payment_url: (data.payment_url as string) ?? "",
    created_at: tsToISO(data.created_at),
  }
}

/** Faturas do próprio usuário (as regras exigem o filtro por uid). */
export async function listMyInvoices(uid: string): Promise<Invoice[]> {
  const snapshot = await getDocs(query(collection(getDb(), "faturas"), where("uid", "==", uid)))
  return snapshot.docs
    .map((d) => mapInvoice(d.id, d.data()))
    .sort((a, b) => b.reference_month.localeCompare(a.reference_month))
}

export async function listInvoicesByMonth(month: string): Promise<Invoice[]> {
  const snapshot = await getDocs(
    query(collection(getDb(), "faturas"), where("reference_month", "==", month))
  )
  return snapshot.docs
    .map((d) => mapInvoice(d.id, d.data()))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"))
}

function dueDateFor(month: string, dueDay: number): string {
  return `${month}-${String(dueDay).padStart(2, "0")}`
}

/**
 * Gera as faturas do mês para todas as assinaturas ativas. Não duplica nem
 * altera faturas que já existem (por exemplo, já pagas).
 */
export async function generateInvoices(month: string): Promise<ActionResult<{ created: number }>> {
  if (!/^\d{4}-\d{2}$/.test(month)) return actionError("Escolha o mês.")
  try {
    const db = getDb()
    const [config, subscriptions, existing] = await Promise.all([
      getBillingConfig(),
      listSubscriptions(),
      listInvoicesByMonth(month),
    ])
    const already = new Set(existing.map((invoice) => invoice.uid))
    const active = subscriptions.filter((s) => s.status === "ativa" && !already.has(s.uid))

    if (!active.length) {
      return { ok: true, message: "Nenhuma fatura nova: todos os assinantes ativos já têm fatura deste mês.", data: { created: 0 } }
    }
    if (config.monthly_price_cents <= 0 && active.some((s) => s.custom_price_cents === null)) {
      return actionError("Defina o valor da mensalidade antes de gerar as faturas.")
    }

    const batch = writeBatch(db)
    for (const subscription of active) {
      batch.set(doc(db, "faturas", `${subscription.uid}_${month}`), {
        uid: subscription.uid,
        name: subscription.name,
        email: subscription.email,
        reference_month: month,
        amount_cents: priceFor(subscription, config),
        due_date: dueDateFor(month, config.due_day),
        status: "aberta",
        paid_at: null,
        payment_provider: "",
        payment_id: "",
        payment_url: "",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
    }
    await batch.commit()
    return {
      ok: true,
      message: `${active.length} ${active.length === 1 ? "fatura gerada" : "faturas geradas"}.`,
      data: { created: active.length },
    }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/** Equipe: baixa manual (até existir integração de pagamento). */
export async function setInvoiceStatus(id: string, status: InvoiceStatus): Promise<ActionResult> {
  try {
    await updateDoc(doc(getDb(), "faturas", id), {
      status,
      paid_at: status === "paga" ? serverTimestamp() : null,
      updated_at: serverTimestamp(),
    })
    const messages: Record<InvoiceStatus, string> = {
      paga: "Fatura marcada como paga.",
      aberta: "Fatura reaberta.",
      cancelada: "Fatura cancelada.",
    }
    return { ok: true, message: messages[status] }
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }
}

/* ── Formatação ─────────────────────────────────────────────── */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

export function formatCents(cents: number): string {
  return brl.format(cents / 100)
}

/** "29,90" ou "R$ 29,90" → 2990. Retorna null se inválido. */
export function parseCents(text: string): number | null {
  const clean = text.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".")
  if (!clean) return null
  const value = Number(clean)
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null
}

/** "2026-11" → "novembro de 2026". */
export function formatMonth(month: string): string {
  const [year, m] = month.split("-").map(Number)
  if (!year || !m) return month
  return new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, m - 1, 1))
  )
}

export function currentMonth(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" })
    .format(new Date())
    .slice(0, 7)
}
