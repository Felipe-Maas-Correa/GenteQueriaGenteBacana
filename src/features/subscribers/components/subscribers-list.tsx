import Link from "next/link"
import { MapPinIcon, PhoneIcon, TagIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatPhone } from "@/lib/utils/format"
import { monthLabel } from "@/lib/utils/months"

import type { SubscriberListItem } from "../queries"
import { DueDate, SubscriberStatusBadge } from "./status-badge"
import { SubscriberRowActions } from "./subscriber-row-actions"

type SubscribersListProps = {
  items: SubscriberListItem[]
  /** Data de hoje (AAAA-MM-DD), para sinalizar vencimentos. */
  today: string
  /** Chamado após excluir um assinante, para recarregar a lista. */
  onChanged: () => void
}

function NoLabelMark() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="relative inline-grid size-5 shrink-0 place-items-center rounded-sm text-muted-foreground outline-none after:absolute after:h-px after:w-4 after:rotate-45 after:bg-current focus-visible:ring-3 focus-visible:ring-ring/40"
          aria-label="Sem etiqueta"
        >
          <TagIcon className="size-3.5" aria-hidden />
        </span>
      </TooltipTrigger>
      <TooltipContent>Não entra na geração de etiquetas</TooltipContent>
    </Tooltip>
  )
}

/** Listagem de assinantes: tabela no desktop, cartões no celular. */
export function SubscribersList({ items, today, onChanged }: SubscribersListProps) {
  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Assinante</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Área</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Mês ref.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12">
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell className="max-w-72">
                  <span className="flex items-center gap-1.5">
                    <Link
                      href={`/admin/assinantes/${subscriber.id}`}
                      className="truncate rounded-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
                    >
                      {subscriber.name}
                    </Link>
                    {subscriber.label_enabled ? null : <NoLabelMark />}
                  </span>
                  <span className="type-caption block truncate font-normal text-muted-foreground">
                    {subscriber.address}
                  </span>
                </TableCell>
                <TableCell className="type-data whitespace-nowrap">
                  {formatPhone(subscriber.phone) || (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {subscriber.area ? (
                    <Badge variant="outline" shape="tag">
                      {subscriber.area.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <DueDate
                    date={subscriber.due_date}
                    today={today}
                    active={subscriber.status === "active"}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {monthLabel(subscriber.reference_month)}
                </TableCell>
                <TableCell>
                  <SubscriberStatusBadge status={subscriber.status} />
                </TableCell>
                <TableCell>
                  <SubscriberRowActions
                    id={subscriber.id}
                    name={subscriber.name}
                    onChanged={onChanged}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile */}
      <ul className="grid gap-3 md:hidden">
        {items.map((subscriber) => (
          <li
            key={subscriber.id}
            className="rounded-xl border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1.5">
                <Link
                  href={`/admin/assinantes/${subscriber.id}`}
                  className="type-h4 block rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
                >
                  {subscriber.name}
                </Link>
                <div className="flex flex-wrap items-center gap-1.5">
                  <SubscriberStatusBadge status={subscriber.status} />
                  {subscriber.area ? (
                    <Badge variant="outline" shape="tag">
                      {subscriber.area.name}
                    </Badge>
                  ) : null}
                  {subscriber.label_enabled ? null : <NoLabelMark />}
                </div>
              </div>
              <SubscriberRowActions id={subscriber.id} name={subscriber.name} onChanged={onChanged} />
            </div>

            <dl className="type-small mt-3 grid gap-1.5 text-muted-foreground">
              <div className="flex items-start gap-2">
                <dt>
                  <MapPinIcon className="mt-0.5 size-3.5" aria-label="Endereço" />
                </dt>
                <dd className="min-w-0 break-words">{subscriber.address}</dd>
              </div>
              {subscriber.phone ? (
                <div className="flex items-center gap-2">
                  <dt>
                    <PhoneIcon className="size-3.5" aria-label="Telefone" />
                  </dt>
                  <dd className="type-data">{formatPhone(subscriber.phone)}</dd>
                </div>
              ) : null}
            </dl>

            <dl className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
              <div>
                <dt className="type-overline text-muted-foreground">
                  Vencimento
                </dt>
                <dd className="mt-1">
                  <DueDate
                    date={subscriber.due_date}
                    today={today}
                    active={subscriber.status === "active"}
                  />
                </dd>
              </div>
              <div>
                <dt className="type-overline text-muted-foreground">
                  Mês de referência
                </dt>
                <dd className="type-small mt-1">
                  {monthLabel(subscriber.reference_month)}
                </dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </>
  )
}
