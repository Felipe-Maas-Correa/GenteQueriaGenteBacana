"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { deleteSubscriber } from "../actions"
import { routes } from "@/lib/routes"

/** Menu de ações de um assinante na listagem. */
export function SubscriberRowActions({
  id,
  name,
  onChanged,
}: {
  id: string
  name: string
  onChanged: () => void
}) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteSubscriber(id)
      if (result.ok) {
        toast.success(result.message)
        setConfirmOpen(false)
        onChanged()
      } else {
        toast.error(result.message)
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Ações de ${name}`}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem asChild>
            <Link href={routes.editSubscriber(id)}>
              <PencilIcon aria-hidden />
              Editar
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2Icon aria-hidden />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Excluir assinante?"
        description={
          <>
            <strong className="font-semibold text-foreground">{name}</strong>{" "}
            será removido definitivamente. Esta ação não pode ser desfeita. Se a
            assinatura apenas foi encerrada, prefira marcar o assinante como
            inativo.
          </>
        }
        confirmLabel="Excluir"
        tone="destructive"
        loading={pending}
        onConfirm={handleDelete}
      />
    </>
  )
}
