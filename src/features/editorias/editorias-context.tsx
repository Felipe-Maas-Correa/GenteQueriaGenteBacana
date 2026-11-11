"use client"

import { createContext, use, useCallback, useMemo } from "react"

import { useAsync } from "@/hooks/use-async"

import { colorCss, listEditorias, type Editoria } from "./data"

type EditoriasContextValue = {
  editorias: Editoria[]
  /** Somente as marcadas para aparecer no menu do topo/rodapé. */
  menu: Editoria[]
  loading: boolean
  error: string | null
  reload: () => void
  byId: (id: string) => Editoria | undefined
  /** Nome da editoria; vazio se ela foi excluída. */
  label: (id: string) => string
  /** Cor CSS da editoria (usada na arte das notícias sem foto). */
  tone: (id: string) => string
}

const EditoriasContext = createContext<EditoriasContextValue | null>(null)

/** Carrega as editorias do banco uma vez e as compartilha com o site e o painel. */
export function EditoriasProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error, reload } = useAsync(listEditorias, [])

  const byId = useCallback(
    (id: string) => (data ?? []).find((e) => e.id === id),
    [data]
  )

  const value = useMemo<EditoriasContextValue>(() => {
    const editorias = data ?? []
    return {
      editorias,
      menu: editorias.filter((e) => e.in_menu),
      loading,
      error,
      reload,
      byId,
      label: (id) => byId(id)?.name ?? "",
      tone: (id) => colorCss(byId(id)?.color),
    }
    // `reload` muda a cada render do hook; as dependências reais são os dados.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading, error, byId])

  return <EditoriasContext value={value}>{children}</EditoriasContext>
}

export function useEditorias(): EditoriasContextValue {
  const context = use(EditoriasContext)
  if (!context) throw new Error("useEditorias deve ser usado dentro de <EditoriasProvider>.")
  return context
}
