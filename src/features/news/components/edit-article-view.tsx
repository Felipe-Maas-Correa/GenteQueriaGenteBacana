"use client"

import Link from "next/link"
import { SearchXIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"

import { getArticle } from "../queries"
import { ArticleForm } from "./article-form"

export function EditArticleView({ id }: { id: string }) {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const { data, loading, error, reload } = useAsync(
    () => (configured ? getArticle(id) : Promise.resolve(null)),
    [configured, id]
  )

  if (!configured) return <SetupNotice />
  if (loading && data === null) return <TableSkeleton rows={6} />
  if (error) return <QueryError message={error} onRetry={reload} />

  if (!data) {
    return (
      <EmptyState
        icon={SearchXIcon}
        title="Notícia não encontrada"
        description="Ela pode ter sido excluída."
        action={
          <Button asChild variant="outline">
            <Link href="/admin/noticias">Voltar para as notícias</Link>
          </Button>
        }
      />
    )
  }

  // `key` recria o formulário com os valores salvos ao trocar de notícia.
  return <ArticleForm key={data.id + data.updated_at} article={data} />
}
