"use client"

import Link from "next/link"

import { useEditorias } from "@/features/editorias/editorias-context"

/** Editorias do rodapé, lidas do banco (as mesmas do menu do topo). */
export function FooterEditorias({ linkClass }: { linkClass: string }) {
  const { menu } = useEditorias()
  return (
    <ul className="grid gap-2">
      {menu.map((editoria) => (
        <li key={editoria.id}>
          <Link href={`/noticias#${editoria.slug}`} className={linkClass}>
            {editoria.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
