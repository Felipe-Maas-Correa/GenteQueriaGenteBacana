"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"

import { QueryError } from "@/components/shared/query-error"
import { Badge } from "@/components/ui/badge"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useAsync } from "@/hooks/use-async"

import {
  CHECKOUT_METHODS,
  checkoutMethodInfo,
  getPaymentConfig,
  ONLINE_PAYMENTS_READY,
  savePaymentConfig,
  type PaymentConfig,
} from "../payment-methods"

function PaymentSettingsForm({ initial, onSaved }: { initial: PaymentConfig; onSaved: () => void }) {
  const [config, setConfig] = useState(initial)
  const [pending, startTransition] = useTransition()
  const set = <K extends keyof PaymentConfig>(key: K, value: PaymentConfig[K]) =>
    setConfig((current) => ({ ...current, [key]: value }))

  const save = () =>
    startTransition(async () => {
      const result = await savePaymentConfig(config)
      if (result.ok) {
        toast.success(result.message)
        onSaved()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <form
      className="grid gap-4 xl:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault()
        save()
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Formas de pagamento</CardTitle>
          <CardDescription>
            Escolha o que aparece para o assinante na tela de pagamento da fatura.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {CHECKOUT_METHODS.map((method) => (
            <div key={method} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div className="space-y-0.5">
                <Label htmlFor={`forma-${method}`} className="flex flex-wrap items-center gap-2">
                  {checkoutMethodInfo[method].label}
                  {method !== "direto" && !ONLINE_PAYMENTS_READY ? (
                    <Badge variant="secondary">Pelo site: em breve</Badge>
                  ) : null}
                </Label>
                <p className="text-sm text-muted-foreground">{checkoutMethodInfo[method].description}</p>
              </div>
              <Switch
                id={`forma-${method}`}
                checked={config.enabled[method]}
                onCheckedChange={(checked) => set("enabled", { ...config.enabled, [method]: checked })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="self-start">
        <CardHeader>
          <CardTitle>Pagamento direto com o jornal</CardTitle>
          <CardDescription>
            Dados que o assinante vê ao escolher pagar direto ao responsável. Depois de
            receber, registre o pagamento na aba Faturas.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="pix-chave">Chave Pix</Label>
            <Input
              id="pix-chave"
              maxLength={140}
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              value={config.direct_pix_key}
              onChange={(e) => set("direct_pix_key", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pix-nome">Nome de quem recebe</Label>
            <Input
              id="pix-nome"
              maxLength={120}
              placeholder="Como aparece no banco"
              value={config.direct_pix_name}
              onChange={(e) => set("direct_pix_name", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pix-contato">Contato (WhatsApp / telefone)</Label>
            <Input
              id="pix-contato"
              maxLength={60}
              placeholder="(55) 99999-0000"
              value={config.direct_contact}
              onChange={(e) => set("direct_contact", e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="pix-instrucoes">Instruções</Label>
            <Textarea
              id="pix-instrucoes"
              rows={3}
              maxLength={1000}
              placeholder="Ex.: Envie o comprovante pelo WhatsApp. Também aceitamos dinheiro na entrega do jornal."
              value={config.direct_instructions}
              onChange={(e) => set("direct_instructions", e.target.value)}
            />
          </div>
          <Button type="submit" loading={pending} className="justify-self-start">
            Salvar formas de pagamento
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}

/** Aba "Pagamento" do painel de assinaturas (somente administradores). */
export function PaymentSettings() {
  const { data, loading, error, reload } = useAsync(() => getPaymentConfig(), [])
  if (loading && !data) return <Skeleton className="h-80 w-full" />
  if (error) return <QueryError message={error} onRetry={reload} />
  if (!data) return null
  return <PaymentSettingsForm initial={data} onSaved={reload} />
}
