"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { Controller, useForm } from "react-hook-form"
import { Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Combobox } from "@/components/forms/combobox"
import { Field } from "@/components/forms/field"
import { PhoneInput } from "@/components/forms/phone-input"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import type { AreaOption } from "@/features/areas/queries"
import { formatDateTime, formatPhone } from "@/lib/utils/format"
import { MONTHS } from "@/lib/utils/months"
import {
  subscriberSchema,
  type SubscriberInput,
} from "@/lib/validations/subscriber"
import type { Tables } from "@/types/database"

import { createSubscriber, deleteSubscriber, updateSubscriber } from "../actions"

type SubscriberFormProps = {
  areas: AreaOption[]
  /** Quando informado, o formulário entra em modo de edição. */
  subscriber?: Tables<"subscribers">
}

const LIST_PATH = "/admin/assinantes"

function FormSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="grid gap-x-10 gap-y-5 border-b py-8 first:pt-0 lg:grid-cols-[16rem_1fr]">
      <div className="space-y-1">
        <h2 className="type-h4">{title}</h2>
        <p className="type-small text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  )
}

function ToggleRow({
  id,
  title,
  description,
  checked,
  onCheckedChange,
}: {
  id: string
  title: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-foreground/30 sm:col-span-2"
    >
      <span className="space-y-0.5">
        <span className="type-small block font-medium">{title}</span>
        <span className="type-caption block font-normal text-muted-foreground">
          {description}
        </span>
      </span>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </label>
  )
}

export function SubscriberForm({ areas, subscriber }: SubscriberFormProps) {
  const router = useRouter()
  const isEditing = Boolean(subscriber)
  const [pending, startTransition] = useTransition()
  const [deleting, startDeleting] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isDirty },
  } = useForm<SubscriberInput>({
    resolver: zodResolver(subscriberSchema),
    defaultValues: {
      name: subscriber?.name ?? "",
      address: subscriber?.address ?? "",
      phone: formatPhone(subscriber?.phone),
      area_id: subscriber?.area_id ?? "",
      due_date: subscriber?.due_date ?? "",
      // 0 = ainda não selecionado (a validação exige 1–12).
      reference_month: subscriber?.reference_month ?? 0,
      observation: subscriber?.observation ?? "",
      status: subscriber?.status ?? "active",
      label_enabled: subscriber?.label_enabled ?? true,
    },
  })

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = subscriber
        ? await updateSubscriber(subscriber.id, values)
        : await createSubscriber(values)

      if (result.ok) {
        toast.success(result.message)
        router.push(LIST_PATH)
        return
      }

      toast.error(result.message)
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) {
          setError(field as keyof SubscriberInput, { message: messages[0] })
        }
      }
    })
  })

  const handleDelete = () => {
    if (!subscriber) return
    startDeleting(async () => {
      const result = await deleteSubscriber(subscriber.id)
      if (result.ok) {
        toast.success(result.message)
        router.push(LIST_PATH)
      } else {
        toast.error(result.message)
        setConfirmDelete(false)
      }
    })
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormSection
        title="Identificação"
        description="Quem é o assinante e como falar com ele."
      >
        <Field
          label="Nome completo"
          required
          error={errors.name?.message}
          className="sm:col-span-2"
        >
          {(field) => (
            <Input autoComplete="off" {...field} {...register("name")} />
          )}
        </Field>

        <Field
          label="Telefone"
          error={errors.phone?.message}
          hint="Com DDD. Fixo ou celular."
        >
          {(field) => (
            <Controller
              control={control}
              name="phone"
              render={({ field: { value, onChange, onBlur, ref } }) => (
                <PhoneInput
                  {...field}
                  ref={ref}
                  value={value}
                  onChange={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          )}
        </Field>
      </FormSection>

      <FormSection
        title="Entrega"
        description="Onde o jornal é entregue. A área organiza a distribuição e os filtros."
      >
        <Field
          label="Endereço"
          required
          error={errors.address?.message}
          hint="Rua, número, complemento e bairro."
          className="sm:col-span-2"
        >
          {(field) => (
            <Input
              autoComplete="off"
              {...field}
              {...register("address")}
            />
          )}
        </Field>

        <Field
          label="Área"
          required
          error={errors.area_id?.message}
          hint={
            areas.length === 0
              ? "Nenhuma área cadastrada. Cadastre uma área antes de salvar."
              : undefined
          }
        >
          {(field) => (
            <Controller
              control={control}
              name="area_id"
              render={({ field: { value, onChange } }) => (
                <Combobox
                  {...field}
                  options={areas.map((area) => ({
                    value: area.id,
                    label: area.name,
                  }))}
                  value={value || undefined}
                  onChange={(next) => onChange(next ?? "")}
                  placeholder="Selecione a área"
                  searchPlaceholder="Buscar área…"
                  emptyMessage="Nenhuma área encontrada."
                  disabled={areas.length === 0}
                />
              )}
            />
          )}
        </Field>
      </FormSection>

      <FormSection
        title="Assinatura"
        description="Vencimento, mês de referência e situação atual."
      >
        <Field
          label="Data de vencimento"
          required
          error={errors.due_date?.message}
        >
          {(field) => <Input type="date" {...field} {...register("due_date")} />}
        </Field>

        <Field
          label="Mês de referência"
          required
          error={errors.reference_month?.message}
        >
          {(field) => (
            <Controller
              control={control}
              name="reference_month"
              render={({ field: { value, onChange } }) => (
                <Select
                  value={value ? String(value) : ""}
                  onValueChange={(next) => onChange(Number(next))}
                >
                  <SelectTrigger {...field}>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={String(month.value)}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          )}
        </Field>

        <Controller
          control={control}
          name="status"
          render={({ field: { value, onChange } }) => (
            <ToggleRow
              id="subscriber-status"
              title="Assinante ativo"
              description="Desative quando a assinatura for pausada ou encerrada. O cadastro é mantido."
              checked={value === "active"}
              onCheckedChange={(checked) =>
                onChange(checked ? "active" : "inactive")
              }
            />
          )}
        />

        <Controller
          control={control}
          name="label_enabled"
          render={({ field: { value, onChange } }) => (
            <ToggleRow
              id="subscriber-label"
              title="Gerar etiqueta"
              description="Quando ativado, o assinante entra nas folhas de etiquetas impressas."
              checked={value}
              onCheckedChange={onChange}
            />
          )}
        />
      </FormSection>

      <FormSection
        title="Observações"
        description="Anotações internas: ponto de referência, combinados de entrega, etc."
      >
        <Field
          label="Observações"
          error={errors.observation?.message}
          className="sm:col-span-2"
        >
          {(field) => (
            <Textarea rows={4} {...field} {...register("observation")} />
          )}
        </Field>
      </FormSection>

      {subscriber ? (
        <p className="type-caption pt-6 font-normal text-muted-foreground">
          Cadastrado em {formatDateTime(subscriber.created_at)} · Última
          atualização em {formatDateTime(subscriber.updated_at)}
        </p>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 mt-6 flex flex-wrap items-center gap-2 border-t bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        {isEditing ? (
          <Button
            type="button"
            variant="destructive-soft"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
          >
            <Trash2Icon aria-hidden />
            Excluir
          </Button>
        ) : null}
        <div className="ml-auto flex items-center gap-2">
          <Button asChild variant="ghost">
            <Link href={LIST_PATH}>Cancelar</Link>
          </Button>
          <Button
            type="submit"
            loading={pending}
            disabled={deleting || (isEditing && !isDirty)}
          >
            {isEditing ? "Salvar alterações" : "Cadastrar assinante"}
          </Button>
        </div>
      </div>

      {subscriber ? (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir assinante?"
          description={
            <>
              <strong className="font-semibold text-foreground">
                {subscriber.name}
              </strong>{" "}
              será removido definitivamente. Esta ação não pode ser desfeita.
            </>
          }
          confirmLabel="Excluir"
          tone="destructive"
          loading={deleting}
          onConfirm={handleDelete}
        />
      ) : null}
    </form>
  )
}
