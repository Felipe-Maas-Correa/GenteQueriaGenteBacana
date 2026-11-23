"use client"

import { isStaff, useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"

import { getMySubscription } from "./data"

/** Uma consulta por conta, compartilhada por todos os cartões da página. */
const cache = new Map<string, Promise<boolean>>()

function hasActiveSubscription(uid: string): Promise<boolean> {
  let pending = cache.get(uid)
  if (!pending) {
    pending = getMySubscription(uid)
      .then((subscription) => subscription?.status === "ativa")
      .catch(() => false)
    cache.set(uid, pending)
  }
  return pending
}

/** Esquece o resultado guardado (ex.: logo depois de assinar). */
export function forgetExclusiveAccess(uid?: string) {
  if (uid) cache.delete(uid)
  else cache.clear()
}

/**
 * A conta logada pode ler notícias exclusivas? (assinante ativo ou equipe).
 * Serve só para a aparência: quem libera o texto de verdade são as regras
 * do banco.
 */
export function useCanReadExclusive(): boolean {
  const { user } = useAuth()
  const staff = isStaff(user?.role)
  const { data } = useAsync(
    () => (!user || staff ? Promise.resolve(staff) : hasActiveSubscription(user.id)),
    [user?.id, staff]
  )
  return data === true
}
