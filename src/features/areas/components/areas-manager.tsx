"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { Field } from "@/components/forms/field"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { formatNumber } from "@/lib/utils/format"
import { areaSchema, type AreaInput } from "@/lib/validations/area"

import { deleteArea, saveArea } from "../actions"
import type { AreaWithCount } from "../queries"

type EditorState = { mode: "create" } | { mode: "edit"; area: AreaWithCount }

function AreaFormDialog({
  state,
  onClose,
}: {
  state: EditorState
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const editing = state.mode === "edit" ? state.area : null

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AreaInput>({
    resolver: zodResolver(areaSchema),
    defaultValues: {
      name: editing?.name ?? "",
      description: editing?.description ?? "",
    },
  })

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const result = await saveArea(editing?.id ?? null, values)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
        onClose()
        return
      }
      toast.error(result.message)
      for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) {
          setError(field as keyof AreaInput, { message: messages[0] })
        }
      }
    })
  })

  return (
    <Dialog open onOpenChange={(open) => (!open && !pending ? onClose() : null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editing ? "Editar área" : "Nova área"}</DialogTitle>
          <DialogDescription>
            As áreas organizam a entrega e servem de filtro na lista de
            assinantes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="grid gap-5">
          <Field label="Nome" required error={errors.name?.message}>
            {(field) => (
              <Input
                autoFocus
                autoComplete="off"
                placeholder="Ex.: Centro"
                {...field}
                {...register("name")}
              />
            )}
          </Field>
          <Field
            label="Descrição"
            error={errors.description?.message}
            hint="Bairros, ruas ou pontos de referência que a área cobre."
          >
            {(field) => (
              <Textarea rows={3} {...field} {...register("description")} />
            )}
          </Field>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              {editing ? "Salvar alterações" : "Cadastrar área"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Listagem e manutenção das áreas de atendimento. */
export function AreasManager({ areas }: { areas: AreaWithCount[] }) {
  const router = useRouter()
  const [editor, setEditor] = useState<EditorState | null>(null)
  const [toDelete, setToDelete] = useState<AreaWithCount | null>(null)
  const [deleting, startDeleting] = useTransition()

  const handleDelete = () => {
    if (!toDelete) return
    startDeleting(async () => {
      const result = await deleteArea(toDelete.id)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
      setToDelete(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="type-small text-muted-foreground" role="status">
          <strong className="font-semibold text-foreground tabular-nums">
            {formatNumber(areas.length)}
          </strong>{" "}
          {areas.length === 1 ? "área cadastrada" : "áreas cadastradas"}
        </p>
        <Button variant="accent" onClick={() => setEditor({ mode: "create" })}>
          <PlusIcon aria-hidden />
          Nova área
        </Button>
      </div>

      {areas.length === 0 ? (
        <EmptyState
          icon={MapPinIcon}
          title="Nenhuma área cadastrada"
          description="Crie as áreas de atendimento (por exemplo: Centro, bairros, interior) para poder vincular os assinantes."
          action={
            <Button onClick={() => setEditor({ mode: "create" })}>
              <PlusIcon aria-hidden />
              Cadastrar primeira área
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {areas.map((area) => {
            const inUse = area.subscriberCount > 0
            return (
              <li
                key={area.id}
                className="flex flex-col gap-4 rounded-xl border bg-card p-5 transition-shadow duration-(--duration-base) hover:shadow-sm"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <h2 className="type-h3 truncate">{area.name}</h2>
                  <p className="type-small line-clamp-2 text-muted-foreground">
                    {area.description || "Sem descrição."}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-2 border-t pt-3">
                  <Link
                    href={`/admin/assinantes?area=${area.id}`}
                    className="type-small rounded-sm outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/40"
                  >
                    <strong className="font-semibold tabular-nums">
                      {formatNumber(area.subscriberCount)}
                    </strong>{" "}
                    <span className="text-muted-foreground">
                      {area.subscriberCount === 1 ? "assinante" : "assinantes"}
                    </span>
                  </Link>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Editar área ${area.name}`}
                      onClick={() => setEditor({ mode: "edit", area })}
                    >
                      <PencilIcon />
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* span: permite o tooltip mesmo com o botão desabilitado */}
                        <span tabIndex={inUse ? 0 : undefined}>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Excluir área ${area.name}`}
                            disabled={inUse}
                            onClick={() => setToDelete(area)}
                          >
                            <Trash2Icon />
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {inUse
                          ? "Área com assinantes vinculados não pode ser excluída"
                          : "Excluir área"}
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {editor ? (
        <AreaFormDialog
          key={editor.mode === "edit" ? editor.area.id : "create"}
          state={editor}
          onClose={() => setEditor(null)}
        />
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => (!open ? setToDelete(null) : null)}
        title="Excluir área?"
        description={
          <>
            A área{" "}
            <strong className="font-semibold text-foreground">
              {toDelete?.name}
            </strong>{" "}
            será removida definitivamente.
          </>
        }
        confirmLabel="Excluir"
        tone="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
