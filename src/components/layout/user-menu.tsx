"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { LogOutIcon, SettingsIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/features/authentication/auth-context"
import { roleLabels } from "@/features/authentication/roles"

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const letters = [parts[0]?.[0], parts.length > 1 ? parts.at(-1)?.[0] : ""]
  return letters.join("").toUpperCase() || "?"
}

/** Menu do usuário autenticado: identificação, atalhos e saída. */
export function UserMenu() {
  const { user, signOutUser } = useAuth()
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2.5 rounded-full p-0.5 pr-1 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 sm:pr-3"
        aria-label={`Menu de ${user.name}`}
      >
        <span className="grid size-9 place-items-center rounded-full bg-primary font-display text-sm font-medium text-primary-foreground">
          {initials(user.name)}
        </span>
        <span className="hidden max-w-40 truncate text-sm font-medium sm:block">
          {user.name}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="space-y-1.5 py-2">
          <p className="truncate text-sm font-medium text-foreground">
            {user.name}
          </p>
          <p className="truncate text-xs font-normal text-muted-foreground">
            {user.email}
          </p>
          <Badge variant="brand">{roleLabels[user.role]}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin/configuracoes">
            <SettingsIcon aria-hidden />
            Configurações
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={pending}
          onSelect={(event) => {
            event.preventDefault()
            startTransition(async () => {
              await signOutUser()
              router.replace("/login")
            })
          }}
        >
          <LogOutIcon aria-hidden />
          {pending ? "Saindo…" : "Sair"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
