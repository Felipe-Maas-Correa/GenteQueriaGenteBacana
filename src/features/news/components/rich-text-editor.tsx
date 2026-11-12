"use client"

import { useRef, useState } from "react"
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  ImagePlusIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  Loader2Icon,
  MinusIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  UnderlineIcon,
  Undo2Icon,
  UnlinkIcon,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"

import { uploadArticleImage } from "../actions"
import { articleProseClass, bodyToHtml } from "../article-body"


function ToolbarButton({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Mantém a seleção do texto ao clicar no botão.
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "grid size-8 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-40 [&_svg]:size-4",
        active && "bg-foreground text-background hover:bg-foreground hover:text-background"
      )}
    >
      {children}
    </button>
  )
}

/** Envia a foto e a coloca na posição informada (ou onde está o cursor). */
async function uploadAndInsert(editor: Editor, file: File, position?: number) {
  const toastId = toast.loading("Enviando foto…")
  const result = await uploadArticleImage(file)
  if (result.ok && result.data) {
    const chain = editor.chain().focus()
    if (position !== undefined) {
      chain.insertContentAt(position, { type: "image", attrs: { src: result.data.url, alt: "" } }).run()
    } else {
      chain.setImage({ src: result.data.url, alt: "" }).run()
    }
    toast.success("Foto inserida no texto.", { id: toastId })
  } else {
    toast.error(result.message, { id: toastId })
  }
}

function imageFiles(list: FileList | null | undefined): File[] {
  return Array.from(list ?? []).filter((file) => file.type.startsWith("image/"))
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Endereço do link (https://…)", previous ?? "https://")
    if (url === null) return
    if (url.trim() === "" || url === "https://") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    if (!/^(https?:\/\/|mailto:)/.test(url)) {
      toast.error("Use um endereço começando com https:// ou mailto:")
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const insertImage = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    await uploadAndInsert(editor, file)
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ""
  }

  const sep = <span className="mx-1 h-5 w-px bg-border" aria-hidden />

  return (
    <div
      role="toolbar"
      aria-label="Formatação do texto"
      className="flex flex-wrap items-center gap-0.5 border-b bg-muted/60 p-1.5"
    >
      <ToolbarButton label="Negrito (Ctrl+B)" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
        <BoldIcon />
      </ToolbarButton>
      <ToolbarButton label="Itálico (Ctrl+I)" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <ItalicIcon />
      </ToolbarButton>
      <ToolbarButton label="Sublinhado (Ctrl+U)" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <UnderlineIcon />
      </ToolbarButton>
      <ToolbarButton label="Tachado" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <StrikethroughIcon />
      </ToolbarButton>
      {sep}
      <ToolbarButton label="Intertítulo" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2Icon />
      </ToolbarButton>
      <ToolbarButton label="Subtítulo menor" active={state.h3} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        <Heading3Icon />
      </ToolbarButton>
      <ToolbarButton label="Citação" active={state.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <QuoteIcon />
      </ToolbarButton>
      <ToolbarButton label="Lista" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <ListIcon />
      </ToolbarButton>
      <ToolbarButton label="Lista numerada" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrderedIcon />
      </ToolbarButton>
      <ToolbarButton label="Linha divisória" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        <MinusIcon />
      </ToolbarButton>
      {sep}
      <ToolbarButton label="Inserir link" active={state.link} onClick={setLink}>
        <LinkIcon />
      </ToolbarButton>
      <ToolbarButton
        label="Remover link"
        disabled={!state.link}
        onClick={() => editor.chain().focus().extendMarkRange("link").unsetLink().run()}
      >
        <UnlinkIcon />
      </ToolbarButton>
      <button
        type="button"
        title="Inserir foto no meio do texto (também dá para colar ou arrastar a imagem)"
        disabled={uploading}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => fileInput.current?.click()}
        className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60 [&_svg]:size-4"
      >
        {uploading ? <Loader2Icon className="animate-spin" /> : <ImagePlusIcon />}
        {uploading ? "Enviando…" : "Inserir foto"}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => insertImage(event.target.files?.[0])}
      />
      <span className="ml-auto flex">
        <ToolbarButton label="Desfazer (Ctrl+Z)" disabled={!state.canUndo} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2Icon />
        </ToolbarButton>
        <ToolbarButton label="Refazer (Ctrl+Shift+Z)" disabled={!state.canRedo} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2Icon />
        </ToolbarButton>
      </span>
    </div>
  )
}

type RichTextEditorProps = {
  id?: string
  value: string
  onChange: (html: string) => void
  invalid?: boolean
  describedBy?: string
}

/** Editor de texto da notícia (negrito, intertítulos, citações, listas, links e fotos). */
export function RichTextEditor({ id, value, onChange, invalid, describedBy }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
      Image,
      Placeholder.configure({ placeholder: "Escreva a notícia aqui…" }),
    ],
    content: bodyToHtml(value),
    editorProps: {
      attributes: {
        ...(id ? { id } : {}),
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": "Texto da notícia",
        ...(describedBy ? { "aria-describedby": describedBy } : {}),
        ...(invalid ? { "aria-invalid": "true" } : {}),
        class: cn(
          articleProseClass,
          "min-h-96 px-5 py-4 font-serif outline-none [&_img.ProseMirror-selectednode]:ring-3 [&_img.ProseMirror-selectednode]:ring-ring/50 [&_.is-editor-empty:first-child]:before:pointer-events-none [&_.is-editor-empty:first-child]:before:float-left [&_.is-editor-empty:first-child]:before:h-0 [&_.is-editor-empty:first-child]:before:text-muted-foreground [&_.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]"
        ),
      },
    },
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    onCreate: ({ editor: e }) => {
      const dom = e.view.dom
      dom.addEventListener("paste", (event) => {
        const files = imageFiles(event.clipboardData?.files)
        if (!files.length) return
        event.preventDefault()
        files.forEach((file) => void uploadAndInsert(e, file))
      })
      dom.addEventListener("drop", (event) => {
        const files = imageFiles(event.dataTransfer?.files)
        if (!files.length) return
        event.preventDefault()
        const position = e.view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        files.forEach((file) => void uploadAndInsert(e, file, position))
      })
    },
  })

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/40",
        invalid && "border-destructive"
      )}
    >
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b" />}
      {editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="min-h-96" aria-busy aria-label="Carregando editor" />
      )}
    </div>
  )
}
