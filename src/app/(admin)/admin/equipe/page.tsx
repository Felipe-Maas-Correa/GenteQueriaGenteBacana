import type { Metadata } from "next"

import { PageHeader } from "@/components/shared/page-header"
import { TeamView } from "@/features/team/components/team-view"

export const metadata: Metadata = { title: "Equipe" }

export default function TeamPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Sistema"
        title="Equipe"
        description="Quem pode usar o painel e o que cada pessoa pode fazer."
      />
      <TeamView />
    </div>
  )
}
