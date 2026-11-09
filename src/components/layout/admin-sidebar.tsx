"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { ArrowUpRightIcon, MenuIcon } from "lucide-react"
import { motion } from "motion/react"

import { Logo } from "@/components/shared/logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { adminNavigation, type AdminNavItem } from "@/lib/navigation"
import { cn } from "@/lib/utils"

function NavLink({
  item,
  active,
  indicatorId,
  onNavigate,
}: {
  item: AdminNavItem
  active: boolean
  indicatorId: string
  onNavigate?: () => void
}) {
  const Icon = item.icon
  const base =
    "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none transition-colors duration-(--duration-fast)"

  if (item.comingSoon) {
    return (
      <span
        aria-disabled
        className={cn(base, "cursor-not-allowed text-sidebar-muted-foreground/60")}
      >
        <Icon className="size-4 shrink-0" aria-hidden />
        {item.label}
        <span className="type-overline ml-auto rounded-sm border border-sidebar-border px-1.5 py-0.5 text-[0.5625rem]">
          Em breve
        </span>
      </span>
    )
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        base,
        "focus-visible:ring-3 focus-visible:ring-sidebar-ring/50",
        active
          ? "text-sidebar-accent-foreground"
          : "text-sidebar-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      )}
    >
      {active ? (
        <motion.span
          layoutId={indicatorId}
          className="absolute inset-0 rounded-lg bg-sidebar-accent"
          transition={{ type: "spring", stiffness: 420, damping: 36 }}
        >
          <span className="absolute top-2.5 bottom-2.5 left-0 w-0.5 rounded-full bg-sidebar-primary" />
        </motion.span>
      ) : null}
      <Icon className="relative size-4 shrink-0" aria-hidden />
      <span className="relative">{item.label}</span>
    </Link>
  )
}

/** Conteúdo da sidebar — compartilhado entre o desktop e o menu móvel. */
export function AdminSidebarContent({
  onNavigate,
  instanceId = "desktop",
}: {
  onNavigate?: () => void
  /** Identifica a instância (desktop, gaveta, guia) para isolar a animação do item ativo. */
  instanceId?: string
}) {
  const pathname = usePathname()

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-(--topbar-h) shrink-0 items-center border-b border-sidebar-border px-5">
        <Link
          href="/admin/dashboard"
          onClick={onNavigate}
          className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/50"
          aria-label="Gente Querida, Gente Bacana — início do painel"
        >
          <Logo size="sm" />
        </Link>
      </div>

      <nav
        aria-label="Navegação do painel"
        className="flex-1 space-y-6 overflow-y-auto px-3 py-5"
      >
        {adminNavigation.map((group) => (
          <div key={group.label} className="space-y-1">
            <p className="type-overline px-3 pb-1 text-sidebar-muted-foreground/70">
              {group.label}
            </p>
            {group.items.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={
                  pathname === item.href || pathname.startsWith(`${item.href}/`)
                }
                indicatorId={`admin-nav-active-${instanceId}`}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex h-10 items-center justify-between rounded-lg px-3 text-sm text-sidebar-muted-foreground outline-none transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground focus-visible:ring-3 focus-visible:ring-sidebar-ring/50"
        >
          Ver o portal
          <ArrowUpRightIcon className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  )
}

/** Botão + gaveta de navegação para telas pequenas. */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          aria-label="Abrir menu"
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-(--sidebar-w) max-w-[85vw] gap-0 border-0 p-0"
      >
        <SheetTitle className="sr-only">Menu do painel</SheetTitle>
        <SheetDescription className="sr-only">
          Navegação entre os módulos do painel administrativo.
        </SheetDescription>
        <AdminSidebarContent
          instanceId="mobile"
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  )
}
