"use client"

import { ReceiptIcon } from "lucide-react"

import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { TableSkeleton } from "@/components/shared/skeletons"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import { formatDate, formatDateTime } from "@/lib/utils/format"

import { formatCents, formatMonth, listMyInvoices, type InvoiceStatus } from "../data"

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "paga") return <Badge variant="success">Paga</Badge>
  if (status === "cancelada") return <Badge variant="secondary">Cancelada</Badge>
  return <Badge variant="warning">Em aberto</Badge>
}

/** Aba "Faturas" da Minha conta. */
export function InvoicesPanel() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(
    () => (user ? listMyInvoices(user.id) : Promise.resolve(null)),
    [user?.id]
  )

  if (!user) return null
  if (loading && !data) return <TableSkeleton rows={3} />
  if (error) return <QueryError message={error} onRetry={reload} />

  if (!data?.length) {
    return (
      <EmptyState
        icon={ReceiptIcon}
        title="Nenhuma fatura ainda"
        description="Quando sua assinatura estiver ativa, as faturas mensais aparecem aqui."
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mês</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead className="hidden sm:table-cell">Vencimento</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="text-right">Pagamento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell className="font-medium capitalize">{formatMonth(invoice.reference_month)}</TableCell>
                <TableCell>{formatCents(invoice.amount_cents)}</TableCell>
                <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                  {formatDate(invoice.due_date)}
                </TableCell>
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {invoice.status === "paga" ? (
                    `Pago em ${formatDateTime(invoice.paid_at) || "—"}`
                  ) : invoice.status === "aberta" && invoice.payment_url ? (
                    <Button asChild size="sm" variant="accent">
                      <a href={invoice.payment_url} target="_blank" rel="noopener noreferrer">
                        Pagar
                      </a>
                    </Button>
                  ) : invoice.status === "aberta" ? (
                    <Button size="sm" variant="outline" disabled title="Em breve: Pix e cartão pelo site">
                      Pagar (em breve)
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="type-caption text-muted-foreground">
        Enquanto o pagamento pelo site não está disponível, combine com a equipe do jornal;
        a fatura é marcada como paga por eles.
      </p>
    </div>
  )
}
