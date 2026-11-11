import type { Metadata } from "next"
import Link from "next/link"
import { LayoutTemplateIcon, PlusIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { ArticlesView } from "@/features/news/components/articles-view"

export const metadata: Metadata = { title: "Notícias" }

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Redação"
        title="Notícias"
        description="Escreva, edite e publique as notícias do portal. Clique em uma notícia para editá-la."
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/pagina-inicial">
                <LayoutTemplateIcon aria-hidden />
                Montar página inicial
              </Link>
            </Button>
            <Button asChild>
              <Link href="/admin/noticias/nova">
                <PlusIcon aria-hidden />
                Nova notícia
              </Link>
            </Button>
          </>
        }
      />
      <ArticlesView />
    </div>
  )
}
