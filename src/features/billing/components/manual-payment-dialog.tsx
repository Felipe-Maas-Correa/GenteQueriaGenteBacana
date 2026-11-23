"use client"

import { useState, useTransition } from "react"
import { HandCoinsIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/features/authentication/auth-context"
import { formatDateTime } from "@/lib/utils/format"

import { formatCents, formatMonth, registerManualPayment, type Invoice } from "../data"
import { MANUAL_METHODS, manualMethodLabels } from "../payment-methods"

function today(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date())
}

/** Administrador registra um pagamento feito direto ao jornal. */
export function ManualPaymentDialog({
  invoice,
  onClose,
  onSaved,
}: {
  invoice: Invoice
  onClose: () => void
  onSaved: () => void
}) {
  const { user } = useAuth()
  const [method, setMethod] = useState("")
  const [paidOn, setPaidOn] = useState(today())
  const [note, setNote] = useState("")
  const [pending, startTransition] = useTransition()

  const save = () =>
    startTransition(async () => {
      if (!user) return
      const result = await registerManualPayment({
        id: invoice.id,
        method,
        paid_on: paidOn,
        note,
        admin: { uid: user.id, name: user.name },
      })
      if (result.ok) {
        toast.success(result.message)
        onSaved()
        onClose()
      } else {
        toast.error(result.message)
      }
    })

  return (
    <Dialog open onOpenChange={(open) => (!open && !pending ? onClose() : null)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            {invoice.name} · <span className="capitalize">{formatMonth(invoice.reference_month)}</span> ·{" "}
            {formatCents(invoice.amount_cents)}. Use quando o assinante pagou direto ao jornal.
          </DialogDescription>
        </DialogHeader>

        {invoice.payment_notice_at ? (
          <Alert variant="info">
            <HandCoinsIcon aria-hidden />
            <AlertTitle>Assinante avisou em {formatDateTime(invoice.payment_notice_at)}</AlertTitle>
            {invoice.payment_notice_note ? (
              <AlertDescription>&ldquo;{invoice.payment_notice_note}&rdquo;</AlertDescription>
            ) : null}
          </Alert>
        ) : null}

        <form
          id="baixa-manual"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
        >
          <div className="grid gap-1.5">
            <Label htmlFor="baixa-forma">Como foi pago</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="baixa-forma" className="w-full">
                <SelectValue placeholder="Escolha a forma" />
              </SelectTrigger>
              <SelectContent>
                {MANUAL_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {manualMethodLabels[m]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="baixa-data">Data do recebimento</Label>
            <Input
              id="baixa-data"
              type="date"
              max={today()}
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              className="w-48"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="baixa-obs">Observação (opcional)</Label>
            <Textarea
              id="baixa-obs"
              rows={2}
              maxLength={300}
              placeholder="Ex.: Recebido em mãos na entrega do jornal"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </form>

        <DialogFooter>
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="baixa-manual" loading={pending}>
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
