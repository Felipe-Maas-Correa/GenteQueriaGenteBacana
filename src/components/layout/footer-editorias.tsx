"use client"

import { EditoriaLink } from "@/components/layout/editoria-link"

import { useEditorias } from "@/features/editorias/editorias-context"

/** Editorias do rodapé, lidas do banco (as mesmas do menu do topo). */
export function FooterEditorias({ linkClass }: { linkClass: string }) {
  const { menu } = useEditorias()
  return (
    <ul className="grid gap-2">
      {menu.map((editoria) => (
        <li key={editoria.id}>
          <EditoriaLink slug={editoria.slug} className={linkClass}>
            {editoria.name}
          </EditoriaLink>
        </li>
      ))}
    </ul>
  )
}
