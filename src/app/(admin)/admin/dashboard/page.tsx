import type { Metadata } from "next"
import Link from "next/link"
import { PlusIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Button } from "@/components/ui/button"
import { DashboardView } from "@/features/dashboard/components/dashboard-view"

export const metadata: Metadata = { title: "Dashboard" }

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        overline="Visão geral"
        title="Dashboard"
        description="Situação atual da base de assinantes do jornal."
        actions={
          <Button asChild variant="accent">
            <Link href="/admin/assinantes/novo">
              <PlusIcon aria-hidden />
              Novo assinante
            </Link>
          </Button>
        }
      />
      <DashboardView />
    </div>
  )
}
