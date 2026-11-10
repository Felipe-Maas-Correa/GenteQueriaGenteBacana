import { RotateCcwIcon, TriangleAlertIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { Button } from "@/components/ui/button"

/** Estado de erro de carregamento, com opção de tentar novamente. */
export function QueryError({
  message,
  onRetry,
}: {
  message?: string
  onRetry: () => void
}) {
  return (
    <EmptyState
      icon={TriangleAlertIcon}
      title="Não foi possível carregar"
      description={
        message ??
        "Ocorreu um erro ao buscar os dados. Verifique sua conexão e tente novamente."
      }
      action={
        <Button variant="outline" onClick={onRetry}>
          <RotateCcwIcon aria-hidden />
          Tentar novamente
        </Button>
      }
    />
  )
}
