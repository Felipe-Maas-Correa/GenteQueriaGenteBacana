"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  CopyIcon,
  MoreHorizontalIcon,
  PencilIcon,
  SaveIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { z } from "zod"

import { Combobox } from "@/components/forms/combobox"
import { Field } from "@/components/forms/field"
import { PhoneInput } from "@/components/forms/phone-input"
import { SearchInput } from "@/components/forms/search-input"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { MONTHS } from "@/lib/utils/months"
import { onlyDigits } from "@/lib/utils/format"

/** Botão que entra em carregamento por alguns instantes ao ser clicado. */
export function LoadingButtonDemo() {
  const [loading, setLoading] = useState(false)
  return (
    <Button
      loading={loading}
      onClick={() => {
        setLoading(true)
        setTimeout(() => setLoading(false), 1800)
      }}
    >
      <SaveIcon aria-hidden />
      Clique para carregar
    </Button>
  )
}

const exampleAreas = [
  { value: "centro", label: "Centro" },
  { value: "bairro-norte", label: "Bairro Norte" },
  { value: "bairro-sul", label: "Bairro Sul" },
  { value: "interior", label: "Interior" },
]

/** Campos básicos em funcionamento (valores de exemplo, nada é salvo). */
export function FieldsDemo() {
  const [phone, setPhone] = useState("")
  const [search, setSearch] = useState("")
  const [area, setArea] = useState<string | undefined>()

  return (
    <div className="grid w-full gap-5 sm:grid-cols-2">
      <Field label="Input de texto" hint="Texto de apoio do campo.">
        {(field) => <Input placeholder="Digite aqui" {...field} />}
      </Field>
      <Field label="Input de telefone" hint="A máscara é aplicada ao digitar.">
        {(field) => <PhoneInput value={phone} onChange={setPhone} {...field} />}
      </Field>
      <Field label="Input de data">
        {(field) => <Input type="date" {...field} />}
      </Field>
      <Field label="Select">
        {(field) => (
          <Select>
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
      </Field>
      <Field label="Combobox" hint="Select com busca, para listas longas.">
        {(field) => (
          <Combobox
            {...field}
            options={exampleAreas}
            value={area}
            onChange={setArea}
            placeholder="Selecione a área"
            searchPlaceholder="Buscar área…"
            clearable
          />
        )}
      </Field>
      <Field label="Campo de pesquisa">
        {(field) => (
          <SearchInput
            {...field}
            value={search}
            onChange={setSearch}
            placeholder="Pesquisar…"
          />
        )}
      </Field>
      <Field label="Textarea" className="sm:col-span-2">
        {(field) => <Textarea placeholder="Observações…" {...field} />}
      </Field>
      <Field label="Campo desabilitado">
        {(field) => <Input disabled defaultValue="Não editável" {...field} />}
      </Field>
      <Field label="Campo com erro" error="Mensagem de erro do campo.">
        {(field) => <Input defaultValue="Valor inválido" {...field} />}
      </Field>
    </div>
  )
}

/** Controles de escolha: checkbox, radio e switch. */
export function ChoiceControlsDemo() {
  return (
    <div className="grid w-full gap-8 sm:grid-cols-3">
      <div className="space-y-3">
        <p className="type-overline text-muted-foreground">Checkbox</p>
        <div className="flex items-center gap-2.5">
          <Checkbox id="guide-check-1" defaultChecked />
          <Label htmlFor="guide-check-1" className="font-normal">
            Nome
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox id="guide-check-2" />
          <Label htmlFor="guide-check-2" className="font-normal">
            Telefone
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox id="guide-check-3" disabled />
          <Label htmlFor="guide-check-3" className="font-normal opacity-60">
            Desabilitado
          </Label>
        </div>
      </div>

      <div className="space-y-3">
        <p className="type-overline text-muted-foreground">Radio</p>
        <RadioGroup defaultValue="nome" aria-label="Ordenação de exemplo">
          {[
            { value: "nome", label: "Nome (A–Z)" },
            { value: "vencimento", label: "Vencimento" },
            { value: "recentes", label: "Mais recentes" },
          ].map((option) => (
            <div key={option.value} className="flex items-center gap-2.5">
              <RadioGroupItem value={option.value} id={`guide-radio-${option.value}`} />
              <Label htmlFor={`guide-radio-${option.value}`} className="font-normal">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <p className="type-overline text-muted-foreground">Switch</p>
        <div className="flex items-center gap-2.5">
          <Switch id="guide-switch-1" defaultChecked />
          <Label htmlFor="guide-switch-1" className="font-normal">
            Assinante ativo
          </Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Switch id="guide-switch-2" />
          <Label htmlFor="guide-switch-2" className="font-normal">
            Gerar etiqueta
          </Label>
        </div>
      </div>
    </div>
  )
}

const validationSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome completo."),
  phone: z
    .string()
    .refine(
      (value) => [10, 11].includes(onlyDigits(value).length),
      "Informe o telefone com DDD (10 ou 11 dígitos)."
    ),
})

type ValidationValues = z.infer<typeof validationSchema>

/** Validação real com Zod + React Hook Form, como nos formulários do sistema. */
export function ValidationDemo() {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ValidationValues>({
    resolver: zodResolver(validationSchema),
    defaultValues: { name: "", phone: "" },
  })

  return (
    <form
      noValidate
      className="grid w-full gap-5 sm:grid-cols-2"
      onSubmit={handleSubmit(() => {
        toast.success("Formulário válido.", {
          description: "Este é apenas um exemplo: nada foi salvo.",
        })
        reset()
      })}
    >
      <Field label="Nome completo" required error={errors.name?.message}>
        {(field) => <Input {...field} {...register("name")} />}
      </Field>
      <Field label="Telefone" required error={errors.phone?.message}>
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
      <div className="sm:col-span-2">
        <Button type="submit">Validar formulário</Button>
      </div>
    </form>
  )
}

/** Modal, confirmação, dropdown e toasts. */
export function OverlaysDemo() {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Abrir modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Título do modal</DialogTitle>
            <DialogDescription>
              Modais concentram uma tarefa curta, como criar ou editar uma área.
            </DialogDescription>
          </DialogHeader>
          <Field label="Nome" required>
            {(field) => <Input placeholder="Ex.: Centro" {...field} />}
          </Field>
          <DialogFooter>
            <DialogTrigger asChild>
              <Button variant="ghost">Cancelar</Button>
            </DialogTrigger>
            <DialogTrigger asChild>
              <Button>Concluir</Button>
            </DialogTrigger>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Button variant="destructive-soft" onClick={() => setConfirmOpen(true)}>
        Abrir confirmação
      </Button>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir registro?"
        description="Diálogo de confirmação usado antes de ações irreversíveis. Neste exemplo, nada é excluído."
        confirmLabel="Excluir"
        tone="destructive"
        onConfirm={() => setConfirmOpen(false)}
      />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            Abrir menu
            <MoreHorizontalIcon aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem>
            <PencilIcon aria-hidden />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem>
            <CopyIcon aria-hidden />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">
            <Trash2Icon aria-hidden />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export function ToastsDemo() {
  return (
    <>
      <Button
        variant="outline"
        onClick={() => toast.success("Assinante cadastrado.")}
      >
        Sucesso
      </Button>
      <Button
        variant="outline"
        onClick={() =>
          toast.error("Não foi possível salvar.", {
            description: "Tente novamente em instantes.",
          })
        }
      >
        Erro
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.warning("3 assinantes vencem esta semana.")}
      >
        Alerta
      </Button>
      <Button
        variant="outline"
        onClick={() => toast.info("As etiquetas usam os filtros da listagem.")}
      >
        Informação
      </Button>
    </>
  )
}
