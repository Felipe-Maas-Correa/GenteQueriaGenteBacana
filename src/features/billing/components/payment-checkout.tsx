"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeftIcon,
  BanknoteIcon,
  CheckCircle2Icon,
  ClockIcon,
  CopyIcon,
  CreditCardIcon,
  HandCoinsIcon,
  LockIcon,
  QrCodeIcon,
  ReceiptIcon,
  type LucideIcon,
} from "lucide-react"
import { toast } from "sonner"

import { EmptyState } from "@/components/shared/empty-state"
import { PageHeader } from "@/components/shared/page-header"
import { QueryError } from "@/components/shared/query-error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import { routes } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime } from "@/lib/utils/format"

import { formatCents, formatMonth, getInvoice, notifyDirectPayment, type Invoice } from "../data"
import {
  CHECKOUT_METHODS,
  checkoutMethodInfo,
  getPaymentConfig,
  ONLINE_PAYMENTS_READY,
  paymentMethodLabel,
  type CheckoutMethod,
  type PaymentConfig,
} from "../payment-methods"
import { InvoiceStatusBadge } from "./invoices-panel"

const methodIcons: Record<CheckoutMethod, LucideIcon> = {
  pix: QrCodeIcon,
  cartao_credito: CreditCardIcon,
  cartao_debito: CreditCardIcon,
  boleto: BanknoteIcon,
  direto: HandCoinsIcon,
}

const INVOICES_URL = "/minha-conta?aba=faturas"

function InvoiceSummary({ invoice }: { invoice: Invoice }) {
  return (
    <Card className="self-start lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ReceiptIcon aria-hidden className="size-4 text-muted-foreground" />
          Resumo da fatura
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Referente a</dt>
            <dd className="font-medium capitalize">{formatMonth(invoice.reference_month)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Vencimento</dt>
            <dd className="font-medium">{formatDate(invoice.due_date) || "—"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-muted-foreground">Situação</dt>
            <dd>
              <InvoiceStatusBadge status={invoice.status} />
            </dd>
          </div>
        </dl>
        <Separator />
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="font-display text-3xl font-medium">{formatCents(invoice.amount_cents)}</span>
        </div>
        <p className="flex items-center gap-1.5 type-caption text-muted-foreground">
          <LockIcon aria-hidden className="size-3" />
          Assinatura digital Gente Querida, Gente Bacana
        </p>
      </CardContent>
    </Card>
  )
}

function MethodOption({
  method,
  selected,
  soon,
}: {
  method: CheckoutMethod
  selected: boolean
  soon: boolean
}) {
  const Icon = methodIcons[method]
  const info = checkoutMethodInfo[method]
  return (
    <Label
      htmlFor={`metodo-${method}`}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border bg-card p-4 font-normal transition-colors hover:bg-muted/50",
        selected && "border-primary ring-1 ring-primary"
      )}
    >
      <RadioGroupItem id={`metodo-${method}`} value={method} className="mt-1" />
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon aria-hidden className="size-4" />
      </span>
      <span className="min-w-0 flex-1 space-y-0.5">
        <span className="flex flex-wrap items-center gap-2 font-medium">
          {info.label}
          {soon ? <Badge variant="secondary">Em breve</Badge> : null}
          {method === "direto" ? <Badge variant="brand">Sem taxas</Badge> : null}
        </span>
        <span className="block text-sm text-muted-foreground">{info.description}</span>
      </span>
    </Label>
  )
}

function CopyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm">{value}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() =>
          navigator.clipboard
            .writeText(value)
            .then(() => toast.success(`${label} copiada.`))
            .catch(() => toast.error("Não foi possível copiar."))
        }
      >
        <CopyIcon aria-hidden />
        Copiar
      </Button>
    </div>
  )
}

function DirectPayment({
  invoice,
  config,
  onNotified,
}: {
  invoice: Invoice
  config: PaymentConfig
  onNotified: () => void
}) {
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()
  const hasDetails = config.direct_pix_key || config.direct_contact || config.direct_instructions

  const notify = () =>
    startTransition(async () => {
      const result = await notifyDirectPayment(invoice.id, note)
      if (result.ok) {
        toast.success(result.message)
        onNotified()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="space-y-4">
      {hasDetails ? (
        <div className="space-y-3">
          {config.direct_pix_key ? (
            <CopyValue
              label={`Chave Pix${config.direct_pix_name ? ` (${config.direct_pix_name})` : ""}`}
              value={config.direct_pix_key}
            />
          ) : null}
          {config.direct_contact ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Contato do jornal: </span>
              <strong>{config.direct_contact}</strong>
            </p>
          ) : null}
          {config.direct_instructions ? (
            <p className="whitespace-pre-line text-sm text-muted-foreground">{config.direct_instructions}</p>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Combine o pagamento com a equipe do jornal (Pix, dinheiro ou transferência).
        </p>
      )}

      <p className="text-sm">
        Valor a pagar: <strong>{formatCents(invoice.amount_cents)}</strong>. Depois de pagar,
        avise aqui: a equipe confere e marca a fatura como paga.
      </p>

      {invoice.payment_notice_at ? (
        <Alert variant="info">
          <ClockIcon aria-hidden />
          <AlertTitle>Aviso enviado em {formatDateTime(invoice.payment_notice_at)}</AlertTitle>
          <AlertDescription>
            A equipe do jornal vai confirmar o recebimento. Se precisar, você pode avisar de novo.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="aviso-pagamento">Mensagem para a equipe (opcional)</Label>
        <Textarea
          id="aviso-pagamento"
          rows={2}
          maxLength={300}
          placeholder="Ex.: Paguei por Pix hoje às 10h / Vou pagar em dinheiro na entrega"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <Button size="lg" variant="accent" loading={pending} onClick={notify}>
        <HandCoinsIcon aria-hidden />
        {invoice.payment_notice_at ? "Avisar de novo" : "Avisar o jornal que paguei"}
      </Button>
    </div>
  )
}

function Checkout({
  invoice,
  config,
  onChanged,
}: {
  invoice: Invoice
  config: PaymentConfig
  onChanged: () => void
}) {
  const methods = CHECKOUT_METHODS.filter((m) => config.enabled[m])
  const [method, setMethod] = useState<CheckoutMethod | "">(
    invoice.payment_notice_at && methods.includes("direto") ? "direto" : ""
  )

  if (invoice.status === "paga") {
    return (
      <Alert variant="success">
        <CheckCircle2Icon aria-hidden />
        <AlertTitle>Fatura paga</AlertTitle>
        <AlertDescription>
          Pagamento confirmado em {formatDateTime(invoice.paid_at) || "—"}
          {invoice.payment_method ? ` (${paymentMethodLabel(invoice.payment_method)})` : ""}.
          Obrigado por apoiar o jornalismo local!
        </AlertDescription>
      </Alert>
    )
  }
  if (invoice.status === "cancelada") {
    return (
      <Alert>
        <ReceiptIcon aria-hidden />
        <AlertTitle>Fatura cancelada</AlertTitle>
        <AlertDescription>Esta fatura foi cancelada pela equipe e não precisa ser paga.</AlertDescription>
      </Alert>
    )
  }

  const online = method !== "" && method !== "direto"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Como você quer pagar?</CardTitle>
        <CardDescription>Escolha a forma de pagamento da sua mensalidade.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup
          value={method}
          onValueChange={(value) => setMethod(value as CheckoutMethod)}
          aria-label="Forma de pagamento"
        >
          {methods.map((m) => (
            <MethodOption
              key={m}
              method={m}
              selected={method === m}
              soon={m !== "direto" && !ONLINE_PAYMENTS_READY}
            />
          ))}
        </RadioGroup>

        {method === "direto" ? (
          <>
            <Separator />
            <DirectPayment invoice={invoice} config={config} onNotified={onChanged} />
          </>
        ) : null}

        {online ? (
          <>
            <Separator />
            <Alert variant="info">
              <ClockIcon aria-hidden />
              <AlertTitle>{checkoutMethodInfo[method].label} pelo site: em breve</AlertTitle>
              <AlertDescription>
                Estamos preparando o pagamento online. Por enquanto, escolha{" "}
                <strong>Direto com o jornal</strong>
                {methods.includes("direto") ? "" : " ou fale com a equipe"}.
              </AlertDescription>
            </Alert>
            <Button size="lg" variant="accent" disabled>
              <LockIcon aria-hidden />
              Pagar {formatCents(invoice.amount_cents)} com {checkoutMethodInfo[method].label}
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Página /pagamento?fatura=… — escolha da forma de pagamento de uma fatura. */
export function PaymentCheckoutFromQuery() {
  const searchParams = useSearchParams()
  const invoiceId = searchParams.get("fatura") ?? ""
  const { status, user } = useAuth()
  const { data, loading, error, reload } = useAsync(
    () =>
      user && invoiceId
        ? Promise.all([getInvoice(invoiceId), getPaymentConfig()]).then(([invoice, config]) => ({
            invoice,
            config,
          }))
        : Promise.resolve(null),
    [user?.id, invoiceId]
  )

  const back = (
    <Button asChild variant="ghost" size="sm" className="-ml-2">
      <Link href={INVOICES_URL}>
        <ArrowLeftIcon aria-hidden />
        Minhas faturas
      </Link>
    </Button>
  )

  let content: React.ReactNode
  if (status === "loading" || (loading && !data)) {
    content = <Skeleton className="h-96 w-full" />
  } else if (status !== "authenticated" || !user) {
    content = (
      <EmptyState
        icon={LockIcon}
        title="Entre para pagar"
        description="Faça login na sua conta para ver e pagar suas faturas."
        action={
          <Button asChild>
            <Link href={`/login?next=${encodeURIComponent(routes.payment(invoiceId))}`}>Entrar</Link>
          </Button>
        }
      />
    )
  } else if (error) {
    content = <QueryError message={error} onRetry={reload} />
  } else if (!data?.invoice) {
    content = (
      <EmptyState
        icon={ReceiptIcon}
        title="Fatura não encontrada"
        description="Abra a fatura pela aba Faturas da sua conta."
      />
    )
  } else {
    content = (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Checkout invoice={data.invoice} config={data.config} onChanged={reload} />
        <InvoiceSummary invoice={data.invoice} />
      </div>
    )
  }

  return (
    <div className="page-container space-y-6 py-10 sm:py-14">
      <div className="space-y-2">
        {back}
        <PageHeader
          overline="Assinatura"
          title="Pagamento"
          description="Escolha como pagar sua mensalidade."
        />
      </div>
      {content}
    </div>
  )
}
