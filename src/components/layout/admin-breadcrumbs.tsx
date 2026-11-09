"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { adminSegmentLabels } from "@/lib/navigation"

/** Breadcrumbs gerados a partir da URL e dos rótulos de `lib/navigation`. */
export function AdminBreadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean).slice(1)

  const crumbs = segments.map((segment, index) => ({
    href: `/admin/${segments.slice(0, index + 1).join("/")}`,
    // Segmentos sem rótulo conhecido são identificadores de registros.
    label: adminSegmentLabels[segment] ?? "Editar",
  }))

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <Fragment key={crumb.href}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem
                className={isLast ? "min-w-0" : "hidden sm:inline-flex"}
              >
                {isLast ? (
                  <BreadcrumbPage className="truncate font-medium">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
