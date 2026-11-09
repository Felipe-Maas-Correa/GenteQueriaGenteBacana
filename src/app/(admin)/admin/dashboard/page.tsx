import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import {
  CalendarClockIcon,
  MapPinIcon,
  PlusIcon,
  UserCheckIcon,
  UserXIcon,
  UsersIcon,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { CardGridSkeleton, TableSkeleton } from "@/components/shared/skeletons"
import { SupabaseSetupNotice } from "@/components/shared/supabase-setup-notice"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getStaffContext } from "@/features/authentication/session"
import {
  AreaDistribution,
  MonthDistribution,
} from "@/features/dashboard/components/distribution-charts"
import { StatCard } from "@/features/dashboard/components/stat-card"
import {
  getDashboardStats,
  getUpcomingDueSubscribers,
} from "@/features/dashboard/queries"
import { DueDate } from "@/features/subscribers/components/status-badge"
import { formatNumber, todayISO } from "@/lib/utils/format"

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
      <Suspense
        fallback={
          <div className="space-y-8">
            <CardGridSkeleton />
            <TableSkeleton rows={4} />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </div>
  )
}

async function DashboardContent() {
  const context = await getStaffContext()
  if (!context) return <SupabaseSetupNotice />

  const [stats, upcoming] = await Promise.all([
    getDashboardStats(context.supabase),
    getUpcomingDueSubscribers(context.supabase),
  ])
  const today = todayISO()

  if (stats.total === 0) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Nenhum assinante cadastrado ainda"
        description="Os indicadores aparecem aqui assim que os primeiros assinantes forem cadastrados."
        action={
          <Button asChild>
            <Link href="/admin/assinantes/novo">
              <PlusIcon aria-hidden />
              Cadastrar assinante
            </Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      <section
        aria-label="Indicadores"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <StatCard
          emphasis
          label="Total de assinantes"
          value={stats.total}
          detail="Em toda a base"
          icon={UsersIcon}
          href="/admin/assinantes"
        />
        <StatCard
          label="Ativos"
          value={stats.active}
          detail="Recebendo o jornal"
          icon={UserCheckIcon}
          href="/admin/assinantes?status=active"
        />
        <StatCard
          label="Inativos"
          value={stats.inactive}
          detail="Assinaturas pausadas ou encerradas"
          icon={UserXIcon}
          href="/admin/assinantes?status=inactive"
        />
        <StatCard
          label="Vencem em 7 dias"
          value={stats.due_next_7_days}
          detail={`${formatNumber(stats.due_next_30_days)} nos próximos 30 dias · ${formatNumber(stats.overdue)} vencido${stats.overdue === 1 ? "" : "s"}`}
          icon={CalendarClockIcon}
          href="/admin/assinantes?status=active&ordem=vencimento"
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Assinantes por mês de referência</CardTitle>
            <CardDescription>
              Quantidade de assinantes em cada mês. Selecione uma coluna para
              abrir a lista.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MonthDistribution data={stats.by_month} total={stats.total} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assinantes por área</CardTitle>
            <CardDescription>
              Quantidade e participação de cada área na base.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {stats.by_area.length > 0 ? (
              <AreaDistribution data={stats.by_area} total={stats.total} />
            ) : (
              <EmptyState
                icon={MapPinIcon}
                title="Nenhuma área cadastrada"
                className="py-8"
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Próximos vencimentos</CardTitle>
          <CardDescription>
            Assinantes ativos com vencimento a partir de hoje.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length > 0 ? (
            <ul className="divide-y">
              {upcoming.map((subscriber) => (
                <li key={subscriber.id}>
                  <Link
                    href={`/admin/assinantes/${subscriber.id}`}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-md py-3 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/40 sm:px-2"
                  >
                    <span className="min-w-0">
                      <span className="type-small block truncate font-medium">
                        {subscriber.name}
                      </span>
                      <span className="type-caption block truncate font-normal text-muted-foreground">
                        {subscriber.area?.name ?? "Sem área"}
                      </span>
                    </span>
                    <DueDate date={subscriber.due_date} today={today} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-small text-muted-foreground">
              Nenhum vencimento futuro entre os assinantes ativos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
