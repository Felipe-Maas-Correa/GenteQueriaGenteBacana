"use client"

import { useEffect } from "react"
import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <EmptyState
      icon={TriangleAlertIcon}
      title="Não foi possível carregar esta página"
      description={
        <>
          Ocorreu um erro ao buscar os dados. Verifique sua conexão e tente
          novamente.
          {error.digest ? (
            <span className="type-data mt-2 block text-xs">
              Código: {error.digest}
            </span>
          ) : null}
        </>
      }
      action={
        <Button onClick={reset} variant="outline">
          <RotateCcwIcon aria-hidden />
          Tentar novamente
        </Button>
      }
    />
  )
}
