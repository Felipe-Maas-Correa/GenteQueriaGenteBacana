"use client"

import { useState, useTransition } from "react"
import { CheckCircle2Icon, ClockIcon, NewspaperIcon } from "lucide-react"
import { toast } from "sonner"

import { PhoneInput } from "@/components/forms/phone-input"
import { QueryError } from "@/components/shared/query-error"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import { formatDate, formatDateTime } from "@/lib/utils/format"

import {
  firstDueDate,
  formatCents,
  formatMonth,
  getBillingConfig,
  getMySubscription,
  nextMonth,
  priceFor,
  subscribe,
} from "../data"

const DAYS = Array.from({ length: 28 }, (_, index) => index + 1)

function formatCpf(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11)
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2")
}

function PriceCard({ cents, special, note }: { cents: number; special?: boolean; note?: string }) {
  return (
    <Card className="self-start">
      <CardHeader>
        <CardTitle>Mensalidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="font-display text-4xl font-medium">
          {cents > 0 ? formatCents(cents) : "A definir"}
          {cents > 0 ? <span className="text-base font-normal text-muted-foreground"> /mês</span> : null}
        </p>
        {special ? (
          <p className="type-caption text-success">Valor especial{note ? `: ${note}` : ""}</p>
        ) : null}
        {cents <= 0 ? (
          <p className="type-caption text-muted-foreground">
            O valor será informado pela equipe do jornal antes da primeira fatura.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

/** Aba "Assinatura" da Minha conta. */
export function SubscriptionPanel() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useAsync(
    () =>
      user
        ? Promise.all([getMySubscription(user.id), getBillingConfig()]).then(
            ([subscription, config]) => ({ subscription, config })
          )
        : Promise.resolve(null),
    [user?.id]
  )

  const [name, setName] = useState<string | null>(null)
  const [cpf, setCpf] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [dueDay, setDueDay] = useState("")
  const [pending, startTransition] = useTransition()

  if (!user) return null
  if (loading && !data) return <Skeleton className="h-64 w-full" />
  if (error) return <QueryError message={error} onRetry={reload} />
  if (!data) return null

  const { subscription, config } = data

  /* ── Já é assinante ─────────────────────────────────────── */
  if (subscription && subscription.status !== "cancelada") {
    const price = priceFor(subscription, config)
    const first = firstDueDate(subscription)
    const pendingApproval = subscription.status === "pendente"

    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Sua assinatura</CardTitle>
            <CardDescription>
              Assinante desde {formatDateTime(subscription.started_at || subscription.created_at) || "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {pendingApproval ? (
              <Alert variant="warning">
                <ClockIcon aria-hidden />
                <AlertTitle>Pedido em análise</AlertTitle>
                <AlertDescription>
                  Seu pedido foi feito antes da assinatura automática; a equipe do jornal vai confirmá-lo.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="success">
                <CheckCircle2Icon aria-hidden />
                <AlertTitle>Assinatura ativa</AlertTitle>
                <AlertDescription>
                  Obrigado por apoiar o jornalismo local!{" "}
                  {first
                    ? `Sua primeira fatura vence em ${formatDate(first)}; as seguintes, todo dia ${subscription.due_day}.`
                    : "Suas faturas aparecem na aba Faturas."}
                </AlertDescription>
              </Alert>
            )}
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Dia do vencimento</dt>
                <dd className="font-medium">Todo dia {subscription.due_day}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Telefone</dt>
                <dd className="font-medium">{subscription.phone || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Endereço</dt>
                <dd className="font-medium">{subscription.address || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <PriceCard
          cents={price}
          special={subscription.custom_price_cents !== null}
          note={subscription.custom_price_note}
        />
      </div>
    )
  }

  /* ── Formulário de assinatura ───────────────────────────── */
  const firstMonth = nextMonth()
  const submit = () =>
    startTransition(async () => {
      const result = await subscribe({
        uid: user.id,
        name: name ?? user.name,
        email: user.email,
        document: cpf,
        phone,
        address,
        due_day: Number(dueDay),
      })
      if (result.ok) {
        toast.success(result.message)
        reload()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <Card>
        <CardHeader>
          <CardTitle>{subscription?.status === "cancelada" ? "Assine de novo" : "Seja assinante"}</CardTitle>
          <CardDescription>
            Preencha seus dados e a assinatura começa na hora. A primeira mensalidade
            vence em <strong className="capitalize">{formatMonth(firstMonth)}</strong>, no dia que você escolher.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ass-nome">Nome completo</Label>
              <Input
                id="ass-nome"
                autoComplete="name"
                value={name ?? user.name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ass-cpf">CPF</Label>
              <Input
                id="ass-cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                value={formatCpf(cpf)}
                onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ass-telefone">Telefone (WhatsApp)</Label>
              <PhoneInput id="ass-telefone" value={phone} onChange={setPhone} />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label htmlFor="ass-endereco">Endereço para entrega</Label>
              <Textarea
                id="ass-endereco"
                rows={2}
                autoComplete="street-address"
                placeholder="Rua, número, complemento, bairro e cidade"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ass-vencimento">Dia do vencimento</Label>
              <Select value={dueDay} onValueChange={setDueDay}>
                <SelectTrigger id="ass-vencimento" className="w-full">
                  <SelectValue placeholder="Escolha o dia" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((day) => (
                    <SelectItem key={day} value={String(day)}>
                      Todo dia {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="type-caption text-muted-foreground">
                {dueDay
                  ? `Primeira fatura: ${formatDate(`${firstMonth}-${dueDay.padStart(2, "0")}`)}.`
                  : "A cobrança começa no mês seguinte."}
              </p>
            </div>
            <div className="flex items-end sm:col-span-2">
              <Button type="submit" variant="accent" size="lg" loading={pending}>
                <NewspaperIcon aria-hidden />
                Assinar agora
              </Button>
            </div>
            <p className="type-caption text-muted-foreground sm:col-span-2">
              Usamos o CPF para emitir as cobranças. O pagamento pelo site (Pix e cartão)
              chega em breve; até lá, a equipe combina com você.
            </p>
          </form>
        </CardContent>
      </Card>

      <PriceCard cents={config.monthly_price_cents} />
    </div>
  )
}
