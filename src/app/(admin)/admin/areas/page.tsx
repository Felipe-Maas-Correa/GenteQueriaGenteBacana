import type { Metadata } from "next"
import { Suspense } from "react"

import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton } from "@/components/shared/skeletons"
import { SupabaseSetupNotice } from "@/components/shared/supabase-setup-notice"
import { AreasManager } from "@/features/areas/components/areas-manager"
import { listAreasWithCount } from "@/features/areas/queries"
import { getStaffContext } from "@/features/authentication/session"

export const metadata: Metadata = { title: "Áreas" }

export default function AreasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Circulação"
        title="Áreas"
        description="Áreas de atendimento usadas para organizar a entrega e filtrar os assinantes."
      />
      <Suspense
        fallback={<CardGridSkeleton count={3} className="xl:grid-cols-3" />}
      >
        <AreasSection />
      </Suspense>
    </div>
  )
}

async function AreasSection() {
  const context = await getStaffContext()
  if (!context) return <SupabaseSetupNotice />

  const areas = await listAreasWithCount(context.supabase)
  return <AreasManager areas={areas} />
}
