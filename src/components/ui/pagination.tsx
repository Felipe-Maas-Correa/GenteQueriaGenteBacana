import * as React from "react"
import Link from "next/link"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  MoreHorizontalIcon,
} from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
  return (
    <nav
      aria-label="Paginação"
      data-slot="pagination"
      className={cn("flex w-full justify-center", className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="pagination-content"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

function PaginationItem(props: React.ComponentProps<"li">) {
  return <li data-slot="pagination-item" {...props} />
}

type PaginationLinkProps = React.ComponentProps<typeof Link> & {
  isActive?: boolean
  disabled?: boolean
  size?: "icon-sm" | "sm"
}

function PaginationLink({
  className,
  isActive,
  disabled,
  size = "icon-sm",
  ...props
}: PaginationLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? -1 : undefined}
      data-slot="pagination-link"
      className={cn(
        buttonVariants({ variant: isActive ? "default" : "ghost", size }),
        "tabular-nums",
        disabled && "pointer-events-none opacity-40",
        className
      )}
      {...props}
    />
  )
}

function PaginationPrevious(props: Omit<PaginationLinkProps, "size">) {
  return (
    <PaginationLink aria-label="Página anterior" size="sm" {...props}>
      <ChevronLeftIcon aria-hidden />
      <span className="hidden sm:block">Anterior</span>
    </PaginationLink>
  )
}

function PaginationNext(props: Omit<PaginationLinkProps, "size">) {
  return (
    <PaginationLink aria-label="Próxima página" size="sm" {...props}>
      <span className="hidden sm:block">Próxima</span>
      <ChevronRightIcon aria-hidden />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "grid size-(--control-h-sm) place-items-center text-muted-foreground",
        className
      )}
      {...props}
    >
      <MoreHorizontalIcon className="size-4" />
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}
