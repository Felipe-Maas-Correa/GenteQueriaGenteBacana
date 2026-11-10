"use client"

import { useEffect, useRef, useState, type DependencyList } from "react"

export type AsyncState<T> = {
  data: T | null
  loading: boolean
  error: string | null
  /** Recarrega os dados mantendo o valor anterior visível. */
  reload: () => void
}

type Snapshot<T> = { token: string; data: T | null; error: string | null }

/**
 * Executa uma função assíncrona e acompanha carregamento/erro, descartando
 * resultados obsoletos. O carregamento é derivado de qual "token"
 * (dependências + recarga) já foi resolvido, evitando setState síncrono no
 * efeito. Durante uma recarga, o valor anterior continua visível.
 */
export function useAsync<T>(
  fn: () => Promise<T>,
  deps: DependencyList
): AsyncState<T> {
  const [nonce, setNonce] = useState(0)
  const token = `${nonce}:${JSON.stringify(deps)}`
  const [snapshot, setSnapshot] = useState<Snapshot<T>>({
    token: "",
    data: null,
    error: null,
  })
  const current = useRef("")

  useEffect(() => {
    current.current = token
    let active = true
    fn()
      .then((result) => {
        if (active && current.current === token) {
          setSnapshot({ token, data: result, error: null })
        }
      })
      .catch((cause: unknown) => {
        if (active && current.current === token) {
          setSnapshot({
            token,
            data: null,
            error:
              cause instanceof Error
                ? cause.message
                : "Não foi possível carregar os dados.",
          })
        }
      })
    return () => {
      active = false
    }
    // `fn` é recriada a cada render; as dependências reais estão no token.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return {
    data: snapshot.data,
    loading: snapshot.token !== token,
    error: snapshot.token === token ? snapshot.error : null,
    reload: () => setNonce((value) => value + 1),
  }
}
