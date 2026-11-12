"use client"

import { useState, useTransition } from "react"
import { CheckCircle2Icon, ClockIcon, NewspaperIcon, XCircleIcon } from "lucide-react"
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
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/authentication/auth-context"
import { useAsync } from "@/hooks/use-async"
import { formatDateTime } from "@/lib/utils/format"

import {
  formatCents,
  getBillingConfig,
  getMySubscription,
  priceFor,
  requestSubscription,
} from "../data"

/** Aba "Assinatura" da Minha conta: pedido, situação e valor. */
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

  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [pending, startTransition] = useTransition()

  if (!user) return null
  if (loading && !data) return <Skeleton className="h-64 w-full" />
  if (error) return <QueryError message={error} onRetry={reload} />
  if (!data) return null

  const { subscription, config } = data

  if (subscription) {
    const price = priceFor(subscription, config)
    const states = {
      pendente: {
        icon: ClockIcon,
        variant: "warning" as const,
        title: "Pedido em análise",
        text: "Recebemos seu pedido. A equipe do jornal vai confirmar a assinatura e você será avisado.",
      },
      ativa: {
        icon: CheckCircle2Icon,
        variant: "success" as const,
        title: "Assinatura ativa",
        text: "Obrigado por apoiar o jornalismo local! Suas faturas aparecem na aba Faturas.",
      },
      cancelada: {
        icon: XCircleIcon,
        variant: "destructive" as const,
        title: "Assinatura cancelada",
        text: "Para voltar a assinar, fale com a equipe do jornal.",
      },
    }
    const state = states[subscription.status]
    const Icon = state.icon

    return (
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>Sua assinatura</CardTitle>
            <CardDescription>
              Pedido feito em {formatDateTime(subscription.created_at) || "—"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Alert variant={state.variant}>
              <Icon aria-hidden />
              <AlertTitle>{state.title}</AlertTitle>
              <AlertDescription>{state.text}</AlertDescription>
            </Alert>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Telefone</dt>
                <dd className="font-medium">{subscription.phone || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Endereço</dt>
                <dd className="font-medium">{subscription.address || "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Mensalidade</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-display text-4xl font-medium">
              {price > 0 ? formatCents(price) : "—"}
              <span className="text-base font-normal text-muted-foreground"> /mês</span>
            </p>
            {subscription.custom_price_cents !== null ? (
              <p className="type-caption text-success">
                Valor especial{subscription.custom_price_note ? `: ${subscription.custom_price_note}` : ""}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Ainda não é assinante: formulário de pedido.
  const submit = () =>
    startTransition(async () => {
      const result = await requestSubscription({
        uid: user.id,
        name: name || user.name,
        email: user.email,
        phone,
        address,
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
          <CardTitle>Seja assinante</CardTitle>
          <CardDescription>
            Apoie o jornalismo da nossa comunidade. Preencha seus dados e a equipe do
            jornal entra em contato para confirmar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            noValidate
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <div className="grid gap-1.5">
              <Label htmlFor="ass-nome">Nome completo</Label>
              <Input id="ass-nome" defaultValue={user.name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ass-telefone">Telefone (WhatsApp)</Label>
              <PhoneInput id="ass-telefone" value={phone} onChange={setPhone} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="ass-endereco">Endereço</Label>
              <Textarea
                id="ass-endereco"
                rows={2}
                placeholder="Rua, número, bairro e cidade"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <Button type="submit" variant="accent" loading={pending} className="justify-self-start">
              <NewspaperIcon aria-hidden />
              Quero assinar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Mensalidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="font-display text-4xl font-medium">
            {config.monthly_price_cents > 0 ? formatCents(config.monthly_price_cents) : "—"}
            <span className="text-base font-normal text-muted-foreground"> /mês</span>
          </p>
          <p className="type-caption text-muted-foreground">
            O pagamento ainda é combinado com a equipe. Em breve: Pix e cartão pelo site.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
