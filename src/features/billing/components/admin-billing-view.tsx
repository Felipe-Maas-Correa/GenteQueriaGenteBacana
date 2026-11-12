"use client"

import { useMemo, useState, useTransition } from "react"
import {
  BadgeDollarSignIcon,
  CheckIcon,
  FilePlus2Icon,
  ReceiptIcon,
  ShieldAlertIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"

import { SearchInput } from "@/components/forms/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import type { ActionResult } from "@/lib/utils/action-result"
import { formatDate, formatDateTime, normalizeSearch } from "@/lib/utils/format"

import {
  currentMonth,
  formatCents,
  formatMonth,
  generateInvoices,
  getBillingConfig,
  listInvoicesByMonth,
  listSubscriptions,
  parseCents,
  priceFor,
  saveBillingConfig,
  setCustomPrice,
  setInvoiceStatus,
  setSubscriptionStatus,
  type BillingConfig,
  type Subscription,
  type SubscriptionStatus,
} from "../data"
import { InvoiceStatusBadge } from "./invoices-panel"

function useRunner(onDone: () => void) {
  const [pending, start] = useTransition()
  const run = (task: () => Promise<ActionResult<unknown>>) =>
    start(async () => {
      const result = await task()
      if (result.ok) {
        toast.success(result.message)
        onDone()
      } else {
        toast.error(result.message)
      }
    })
  return { pending, run }
}

function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  if (status === "ativa") return <Badge variant="success">Ativa</Badge>
  if (status === "cancelada") return <Badge variant="secondary">Cancelada</Badge>
  return <Badge variant="warning">Pendente</Badge>
}

/* ── Mensalidade ────────────────────────────────────────────── */

function PriceSettings({
  config,
  canEdit,
  onSaved,
}: {
  config: BillingConfig
  canEdit: boolean
  onSaved: () => void
}) {
  const [price, setPrice] = useState(
    config.monthly_price_cents ? (config.monthly_price_cents / 100).toFixed(2).replace(".", ",") : ""
  )
  const { pending, run } = useRunner(onSaved)

  const save = () => {
    const cents = parseCents(price)
    if (cents === null) return toast.error("Informe o valor da mensalidade (ex.: 29,90).")
    // O dia do vencimento é escolhido por cada assinante; o padrão salvo
    // (config.due_day) só vale para assinaturas antigas, sem dia definido.
    run(() => saveBillingConfig({ monthly_price_cents: cents, due_day: config.due_day }))
  }

  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Mensalidade padrão</CardTitle>
        <CardDescription>
          Valor cobrado de todos os assinantes, exceto quem tem preço especial. Mudanças
          valem para as próximas faturas geradas. O dia do vencimento é escolhido por
          cada assinante ao assinar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="grid max-w-xs gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="mensalidade">Valor (R$)</Label>
            <Input
              id="mensalidade"
              inputMode="decimal"
              placeholder="29,90"
              value={price}
              disabled={!canEdit}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          {canEdit ? (
            <Button type="submit" loading={pending} className="justify-self-start">
              Salvar mensalidade
            </Button>
          ) : (
            <p className="type-caption text-muted-foreground">
              Somente administradores alteram a mensalidade.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

/* ── Preço especial ─────────────────────────────────────────── */

function CustomPriceDialog({
  subscription,
  config,
  onClose,
  onSaved,
}: {
  subscription: Subscription
  config: BillingConfig
  onClose: () => void
  onSaved: () => void
}) {
  const [price, setPrice] = useState(
    subscription.custom_price_cents !== null
      ? (subscription.custom_price_cents / 100).toFixed(2).replace(".", ",")
      : ""
  )
  const [note, setNote] = useState(subscription.custom_price_note)
  const { pending, run } = useRunner(() => {
    onSaved()
    onClose()
  })

  return (
    <Dialog open onOpenChange={(open) => (!open && !pending ? onClose() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Preço especial</DialogTitle>
          <DialogDescription>
            {subscription.name}. A mensalidade padrão é{" "}
            {formatCents(config.monthly_price_cents)}. Deixe vazio para usar o padrão.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="preco-especial">Valor especial (R$)</Label>
            <Input
              id="preco-especial"
              inputMode="decimal"
              placeholder="Ex.: 15,00 ou 0,00 para cortesia"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              autoFocus
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="preco-motivo">Motivo (aparece para o assinante)</Label>
            <Input
              id="preco-motivo"
              placeholder="Ex.: Desconto para aposentados"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={pending}
            onClick={() => {
              if (price.trim() === "") return run(() => setCustomPrice(subscription.uid, null, ""))
              const cents = parseCents(price)
              if (cents === null) return toast.error("Valor inválido.")
              run(() => setCustomPrice(subscription.uid, cents, note))
            }}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ── Assinantes ─────────────────────────────────────────────── */

function SubscriptionsTab({
  subscriptions,
  config,
  onChanged,
}: {
  subscriptions: Subscription[]
  config: BillingConfig
  onChanged: () => void
}) {
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Subscription | null>(null)
  const { pending, run } = useRunner(onChanged)

  const rows = useMemo(() => {
    const term = normalizeSearch(search)
    return subscriptions.filter(
      (s) => !term || normalizeSearch(`${s.name} ${s.email} ${s.phone}`).includes(term)
    )
  }, [subscriptions, search])

  if (!subscriptions.length) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="Nenhum pedido de assinatura"
        description="Quando um leitor pedir para assinar em Minha conta › Assinatura, o pedido aparece aqui."
      />
    )
  }

  const pendingCount = subscriptions.filter((s) => s.status === "pendente").length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Buscar por nome, e-mail ou telefone…"
          aria-label="Buscar assinaturas"
          className="w-full sm:w-80"
        />
        {pendingCount ? (
          <Badge variant="warning">
            {pendingCount} {pendingCount === 1 ? "pedido aguardando" : "pedidos aguardando"}
          </Badge>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Assinante</TableHead>
              <TableHead className="hidden lg:table-cell">Contato</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead>Mensalidade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.uid}>
                <TableCell>
                  <p className="font-medium">{s.name}</p>
                  <p className="text-sm text-muted-foreground">{s.email}</p>
                </TableCell>
                <TableCell className="hidden text-sm lg:table-cell">
                  <p>{s.phone || "—"} · vence dia {s.due_day}</p>
                  <p className="line-clamp-1 text-muted-foreground">{s.address}</p>
                </TableCell>
                <TableCell>
                  <SubscriptionBadge status={s.status} />
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.status === "ativa" && s.started_at
                      ? `desde ${formatDateTime(s.started_at)}`
                      : `pedido ${formatDateTime(s.created_at)}`}
                  </p>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{formatCents(priceFor(s, config))}</p>
                  {s.custom_price_cents !== null ? (
                    <p className="text-xs text-info">Preço especial</p>
                  ) : null}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {s.status === "pendente" ? (
                      <Button size="sm" disabled={pending} onClick={() => run(() => setSubscriptionStatus(s.uid, "ativa"))}>
                        <CheckIcon aria-hidden />
                        Aprovar pedido
                      </Button>
                    ) : null}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="outline" disabled={pending}>
                          Mais
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(s)}>
                          <BadgeDollarSignIcon aria-hidden />
                          Preço especial…
                        </DropdownMenuItem>
                        {s.status !== "ativa" ? (
                          <DropdownMenuItem onSelect={() => run(() => setSubscriptionStatus(s.uid, "ativa"))}>
                            Ativar
                          </DropdownMenuItem>
                        ) : null}
                        {s.status !== "cancelada" ? (
                          <DropdownMenuItem
                            variant="destructive"
                            onSelect={() => run(() => setSubscriptionStatus(s.uid, "cancelada"))}
                          >
                            Cancelar assinatura
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editing ? (
        <CustomPriceDialog
          subscription={editing}
          config={config}
          onClose={() => setEditing(null)}
          onSaved={onChanged}
        />
      ) : null}
    </div>
  )
}

/* ── Faturas ────────────────────────────────────────────────── */

function InvoicesTab() {
  const [month, setMonth] = useState(currentMonth())
  const { data, loading, error, reload } = useAsync(() => listInvoicesByMonth(month), [month])
  const { pending, run } = useRunner(reload)

  const totals = useMemo(() => {
    const list = data ?? []
    const sum = (status: string) =>
      list.filter((i) => i.status === status).reduce((acc, i) => acc + i.amount_cents, 0)
    return { aberta: sum("aberta"), paga: sum("paga") }
  }, [data])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="mes-faturas">Mês de referência</Label>
          <Input
            id="mes-faturas"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="w-48"
          />
        </div>
        <Button loading={pending} onClick={() => run(() => generateInvoices(month))}>
          <FilePlus2Icon aria-hidden />
          Gerar faturas de {formatMonth(month)}
        </Button>
        <p className="type-caption basis-full text-muted-foreground">
          Gera uma fatura para cada assinatura ativa que ainda não tem fatura neste mês.
          Pode clicar de novo sem medo: não duplica.
        </p>
      </div>

      {loading && !data ? (
        <TableSkeleton rows={3} />
      ) : error ? (
        <QueryError message={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState
          icon={ReceiptIcon}
          title={`Nenhuma fatura em ${formatMonth(month)}`}
          description="Use o botão acima para gerar as faturas do mês."
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-6 text-sm">
            <p>
              Em aberto: <strong>{formatCents(totals.aberta)}</strong>
            </p>
            <p>
              Recebido: <strong className="text-success">{formatCents(totals.paga)}</strong>
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assinante</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>
                      <p className="font-medium">{invoice.name}</p>
                      <p className="text-sm text-muted-foreground">{invoice.email}</p>
                    </TableCell>
                    <TableCell>{formatCents(invoice.amount_cents)}</TableCell>
                    <TableCell className="hidden text-sm sm:table-cell">{formatDate(invoice.due_date)}</TableCell>
                    <TableCell>
                      <InvoiceStatusBadge status={invoice.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="outline" disabled={pending}>
                            Ações
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {invoice.status !== "paga" ? (
                            <DropdownMenuItem onSelect={() => run(() => setInvoiceStatus(invoice.id, "paga"))}>
                              Marcar como paga
                            </DropdownMenuItem>
                          ) : null}
                          {invoice.status !== "aberta" ? (
                            <DropdownMenuItem onSelect={() => run(() => setInvoiceStatus(invoice.id, "aberta"))}>
                              Reabrir
                            </DropdownMenuItem>
                          ) : null}
                          {invoice.status !== "cancelada" ? (
                            <DropdownMenuItem
                              variant="destructive"
                              onSelect={() => run(() => setInvoiceStatus(invoice.id, "cancelada"))}
                            >
                              Cancelar fatura
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}

/* ── Página ─────────────────────────────────────────────────── */

export function AdminBillingView() {
  const { status, user } = useAuth()
  const configured = status !== "unconfigured"
  // Dados de cobrança (CPF, endereço, valores): somente administradores.
  const staff = user?.role === "admin"
  const { data, loading, error, reload } = useAsync(
    () =>
      configured && staff
        ? Promise.all([listSubscriptions(), getBillingConfig()]).then(([subscriptions, config]) => ({
            subscriptions,
            config,
          }))
        : Promise.resolve(null),
    [configured, staff]
  )

  if (!configured) return <SetupNotice />
  if (user && !staff) {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title="Somente administradores"
        description="Os dados de cobrança (CPF, endereço e valores) ficam restritos aos administradores."
      />
    )
  }
  if (loading && !data) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />
  if (!data) return null

  const pendingCount = data.subscriptions.filter((s) => s.status === "pendente").length

  return (
    <Tabs defaultValue="assinantes" className="gap-6">
      <TabsList>
        <TabsTrigger value="assinantes">
          Assinantes{pendingCount ? ` (${pendingCount} novo${pendingCount > 1 ? "s" : ""})` : ""}
        </TabsTrigger>
        <TabsTrigger value="faturas">Faturas</TabsTrigger>
        <TabsTrigger value="mensalidade">Mensalidade</TabsTrigger>
      </TabsList>
      <TabsContent value="assinantes">
        <SubscriptionsTab subscriptions={data.subscriptions} config={data.config} onChanged={reload} />
      </TabsContent>
      <TabsContent value="faturas">
        <InvoicesTab />
      </TabsContent>
      <TabsContent value="mensalidade">
        <PriceSettings
          key={data.config.monthly_price_cents}
          config={data.config}
          canEdit={user?.role === "admin"}
          onSaved={reload}
        />
      </TabsContent>
    </Tabs>
  )
}
