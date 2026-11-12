"use client"

import { StoredImage } from "@/features/news/image-source"
import { cn } from "@/lib/utils"

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  const letters = [parts[0]?.[0], parts.length > 1 ? parts.at(-1)?.[0] : ""]
  return letters.join("").toUpperCase() || "?"
}

/** Foto de perfil, ou as iniciais quando a pessoa ainda não enviou foto. */
export function UserAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string
  photoUrl?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-primary font-display text-sm font-medium text-primary-foreground",
        className
      )}
    >
      {photoUrl ? (
        <StoredImage src={photoUrl} alt="" loading="eager" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  )
}
