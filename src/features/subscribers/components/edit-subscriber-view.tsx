"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { SearchXIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { listAreaOptions } from "@/features/areas/queries"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"

import { getSubscriber } from "../queries"
import { SubscriberForm } from "./subscriber-form"

export function EditSubscriberView({ id }: { id: string }) {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const { data, loading, error, reload } = useAsync(
    () =>
      configured
        ? Promise.all([getSubscriber(id), listAreaOptions()]).then(
            ([subscriber, areas]) => ({ subscriber, areas })
          )
        : Promise.resolve(null),
    [configured, id]
  )

  if (!configured) return <SetupNotice />
  if (loading && !data) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />
  if (!data) return null

  if (!data.subscriber) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Assinante não encontrado"
        description="O cadastro pode ter sido excluído."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/assinantes">Voltar para a listagem</Link>
          </Button>
        }
      />
    )
  }

  return <SubscriberForm areas={data.areas} subscriber={data.subscriber} />
}

/** Lê ?id= da URL (página /admin/assinantes/editar). */
export function EditSubscriberFromQuery() {
  const id = useSearchParams().get("id") ?? ""
  return <EditSubscriberView id={id} />
}
