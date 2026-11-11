"use client"

import { useState, useTransition } from "react"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckIcon,
  PencilIcon,
  PlusIcon,
  ShieldAlertIcon,
  TagsIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { EmptyState } from "@/components/shared/empty-state"
import { QueryError } from "@/components/shared/query-error"
import { SetupNotice } from "@/components/shared/setup-notice"
import { TableSkeleton } from "@/components/shared/skeletons"
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
import { useAuth } from "@/features/authentication/auth-context"
import type { ActionResult } from "@/lib/utils/action-result"

import {
  EDITORIA_COLORS,
  colorCss,
  createEditoria,
  deleteEditoria,
  reorderEditorias,
  updateEditoria,
  type Editoria,
  type EditoriaColor,
} from "../data"
import { useEditorias } from "../editorias-context"

const SUGGESTIONS: { name: string; color: EditoriaColor }[] = [
  { name: "Cidade", color: "azul" },
  { name: "Comunidade", color: "vermelho" },
  { name: "Cultura", color: "ocre" },
  { name: "Esporte", color: "petroleo" },
  { name: "Opinião", color: "grafite" },
]

function ColorSelect({
  value,
  onChange,
  label,
}: {
  value: EditoriaColor
  onChange: (color: EditoriaColor) => void
  label: string
}) {
  return (
    <Select value={value} onValueChange={(next) => onChange(next as EditoriaColor)}>
      <SelectTrigger className="w-36" aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(EDITORIA_COLORS) as EditoriaColor[]).map((key) => (
          <SelectItem key={key} value={key}>
            <span className="size-3 rounded-full" style={{ background: colorCss(key) }} aria-hidden />
            {EDITORIA_COLORS[key].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function EditoriaRow({
  editoria,
  index,
  total,
  busy,
  run,
  onMove,
  onDelete,
  all,
}: {
  editoria: Editoria
  index: number
  total: number
  busy: boolean
  run: (task: () => Promise<ActionResult>) => void
  onMove: (delta: number) => void
  onDelete: () => void
  all: Editoria[]
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(editoria.name)

  const saveName = () => {
    if (name.trim() === editoria.name) return setEditing(false)
    run(async () => {
      const result = await updateEditoria(editoria, { name }, all)
      if (result.ok) setEditing(false)
      return result
    })
  }

  return (
    <li className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
      <span
        className="h-9 w-1.5 shrink-0 rounded-full"
        style={{ background: colorCss(editoria.color) }}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        {editing ? (
          <form
            className="flex gap-1.5"
            onSubmit={(event) => {
              event.preventDefault()
              saveName()
            }}
          >
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") {
                  setName(editoria.name)
                  setEditing(false)
                }
              }}
              aria-label="Nome da editoria"
              className="h-(--control-h-sm)"
            />
            <Button type="submit" size="icon-sm" aria-label="Salvar nome" disabled={busy}>
              <CheckIcon aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              aria-label="Cancelar"
              onClick={() => {
                setName(editoria.name)
                setEditing(false)
              }}
            >
              <XIcon aria-hidden />
            </Button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="group flex items-center gap-2 rounded-sm text-left font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {editoria.name}
            <PencilIcon className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden />
            <span className="sr-only">(renomear)</span>
          </button>
        )}
        <p className="text-xs text-muted-foreground">/noticias#{editoria.slug}</p>
      </div>

      <ColorSelect
        value={editoria.color}
        label={`Cor de ${editoria.name}`}
        onChange={(color) => run(() => updateEditoria(editoria, { color }, all))}
      />

      <label className="flex items-center gap-2 text-sm">
        <Switch
          checked={editoria.in_menu}
          disabled={busy}
          onCheckedChange={(in_menu) => run(() => updateEditoria(editoria, { in_menu }, all))}
        />
        No menu
      </label>

      <div className="flex gap-0.5">
        <Button size="icon-sm" variant="ghost" aria-label="Subir" disabled={busy || index === 0} onClick={() => onMove(-1)}>
          <ArrowUpIcon aria-hidden />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label="Descer" disabled={busy || index === total - 1} onClick={() => onMove(1)}>
          <ArrowDownIcon aria-hidden />
        </Button>
        <Button size="icon-sm" variant="ghost" aria-label={`Excluir ${editoria.name}`} disabled={busy} onClick={onDelete}>
          <Trash2Icon aria-hidden />
        </Button>
      </div>
    </li>
  )
}

export function EditoriasManager() {
  const { status, user } = useAuth()
  const { editorias, loading, error, reload } = useEditorias()
  const [busy, startBusy] = useTransition()
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState<EditoriaColor>("azul")
  const [toDelete, setToDelete] = useState<Editoria | null>(null)

  const run = (task: () => Promise<ActionResult>, quiet = false) =>
    startBusy(async () => {
      const result = await task()
      if (result.ok) {
        if (!quiet) toast.success(result.message)
        reload()
      } else {
        toast.error(result.message)
      }
    })

  if (status === "unconfigured") return <SetupNotice />
  if (user && user.role !== "admin") {
    return (
      <EmptyState
        icon={ShieldAlertIcon}
        title="Somente administradores"
        description="Peça a um administrador para alterar as editorias do site."
      />
    )
  }
  if (loading && !editorias.length) return <TableSkeleton rows={5} />
  if (error) return <QueryError message={error} onRetry={reload} />

  const move = (index: number, delta: number) => {
    const next = [...editorias]
    ;[next[index], next[index + delta]] = [next[index + delta], next[index]]
    run(() => reorderEditorias(next), true)
  }

  const add = () =>
    run(async () => {
      const result = await createEditoria(newName, newColor, editorias)
      if (result.ok) setNewName("")
      return result
    })

  const addSuggestions = () =>
    run(async () => {
      let list = [...editorias]
      for (const suggestion of SUGGESTIONS) {
        const result = await createEditoria(suggestion.name, suggestion.color, list)
        if (!result.ok) return result
        list = [...list, { id: suggestion.name, name: suggestion.name, slug: "", order: list.length, color: suggestion.color, in_menu: true }]
      }
      return { ok: true, message: "Editorias sugeridas criadas." }
    })

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="space-y-3">
        {editorias.length ? (
          <ol className="divide-y rounded-xl border bg-card">
            {editorias.map((editoria, index) => (
              <EditoriaRow
                key={editoria.id + editoria.name}
                editoria={editoria}
                index={index}
                total={editorias.length}
                busy={busy}
                run={run}
                onMove={(delta) => move(index, delta)}
                onDelete={() => setToDelete(editoria)}
                all={editorias}
              />
            ))}
          </ol>
        ) : (
          <EmptyState
            icon={TagsIcon}
            title="Nenhuma editoria cadastrada"
            description="O menu do site fica vazio até você criar as editorias. Crie as suas ao lado ou comece pelas sugestões."
            action={
              <Button variant="outline" loading={busy} onClick={addSuggestions}>
                Criar Cidade, Comunidade, Cultura, Esporte e Opinião
              </Button>
            }
          />
        )}
        <p className="type-caption text-muted-foreground">
          A ordem aqui é a ordem do menu do site. Clique no nome para renomear.
          Desligue &ldquo;No menu&rdquo; para esconder uma editoria do topo sem perder as notícias dela.
        </p>
      </section>

      <aside>
        <form
          className="space-y-4 rounded-xl border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault()
            add()
          }}
        >
          <h2 className="type-h4">Nova editoria</h2>
          <div className="grid gap-1.5">
            <label htmlFor="nova-editoria" className="type-small font-medium">
              Nome
            </label>
            <Input
              id="nova-editoria"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ex.: Polícia, Saúde, Educação"
            />
          </div>
          <div className="grid gap-1.5">
            <span className="type-small font-medium">Cor</span>
            <ColorSelect value={newColor} onChange={setNewColor} label="Cor da nova editoria" />
          </div>
          <Button type="submit" className="w-full" loading={busy} disabled={newName.trim().length < 2}>
            <PlusIcon aria-hidden />
            Adicionar editoria
          </Button>
        </form>
      </aside>

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={(open) => (!open ? setToDelete(null) : null)}
        title="Excluir editoria?"
        description={
          <>
            <strong className="font-semibold text-foreground">{toDelete?.name}</strong>{" "}
            sai do site e do painel. Só é possível excluir se nenhuma notícia usar esta editoria.
          </>
        }
        confirmLabel="Excluir"
        tone="destructive"
        loading={busy}
        onConfirm={() => {
          const target = toDelete
          if (!target) return
          run(async () => {
            const result = await deleteEditoria(target)
            setToDelete(null)
            return result
          })
        }}
      />
    </div>
  )
}
