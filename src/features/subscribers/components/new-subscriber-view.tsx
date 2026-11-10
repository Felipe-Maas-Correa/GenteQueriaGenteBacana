"use client"

import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { listAreaOptions } from "@/features/areas/queries"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"

import { SubscriberForm } from "./subscriber-form"

export function NewSubscriberView() {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const { data, loading, error, reload } = useAsync(
    () => (configured ? listAreaOptions() : Promise.resolve(null)),
    [configured]
  )

  if (!configured) return <SetupNotice />
  if (loading && !data) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />

  return <SubscriberForm areas={data ?? []} />
}
