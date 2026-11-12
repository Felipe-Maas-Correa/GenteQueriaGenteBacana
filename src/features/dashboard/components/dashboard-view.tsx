"use client"

import Link from "next/link"
import {
  CalendarClockIcon,
  MapPinIcon,
  PlusIcon,
  UserCheckIcon,
  UserXIcon,
  UsersIcon,
} from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { CardGridSkeleton, TableSkeleton } from "@/components/shared/skeletons"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/features/authentication/auth-context"
import { DueDate } from "@/features/subscribers/components/status-badge"
import { useAsync } from "@/hooks/use-async"
import { formatNumber, todayISO } from "@/lib/utils/format"

import { getDashboardData } from "../queries"
import {
  AreaDistribution,
  MonthDistribution,
} from "./distribution-charts"
import { StatCard } from "./stat-card"
import { routes } from "@/lib/routes"

export function DashboardView() {
  const { status } = useAuth()
  const configured = status !== "unconfigured"
  const { data, loading, error, reload } = useAsync(
    () => (configured ? getDashboardData() : Promise.resolve(null)),
    [configured]
  )

  if (!configured) return <SetupNotice />
  if (loading && !data)
    return (
      <div className="space-y-8">
        <CardGridSkeleton />
        <TableSkeleton rows={4} />
      </div>
    )
  if (error) return <QueryError message={error} onRetry={reload} />
  if (!data) return null

  const { stats, upcoming } = data
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
                    href={routes.editSubscriber(subscriber.id)}
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
