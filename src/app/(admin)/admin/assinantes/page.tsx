import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { SubscribersView } from "@/features/subscribers/components/subscribers-view"

export const metadata: Metadata = { title: "Assinantes" }

export default function SubscribersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Circulação"
        title="Assinantes"
        description="Cadastre, encontre e organize os assinantes do jornal."
        actions={
          <Button asChild variant="accent">
            <Link href="/admin/assinantes/novo">
              <PlusIcon aria-hidden />
              Novo assinante
            </Link>
          </Button>
        }
      />
      <SubscribersView />
    </div>
  )
}
