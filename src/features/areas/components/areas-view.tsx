"use client"

import { CardGridSkeleton } from "@/components/shared/skeletons"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"

import { listAreasWithCount } from "../queries"
import { AreasManager } from "./areas-manager"

export function AreasView() {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const { data, loading, error, reload } = useAsync(
    () => (configured ? listAreasWithCount() : Promise.resolve(null)),
    [configured]
  )

  if (!configured) return <SetupNotice />
  if (loading && !data)
    return <CardGridSkeleton count={3} className="xl:grid-cols-3" />
  if (error) return <QueryError message={error} onRetry={reload} />

  return <AreasManager areas={data ?? []} onChanged={reload} />
}
