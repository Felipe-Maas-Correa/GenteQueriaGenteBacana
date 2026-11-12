"use client"

import { useRef, useState } from "react"
import {
  EditorContent,
  Node,
  mergeAttributes,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
  useEditorState,
  type Editor,
  type NodeViewProps,
} from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import {
  BoldIcon,
  Heading2Icon,
  Heading3Icon,
  ArrowLeftIcon,
  ArrowRightIcon,
  GalleryHorizontalIcon,
  ImagePlusIcon,
  PlusIcon,
  Trash2Icon,
  VideoIcon,
  XIcon,
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
import { StoredImage } from "../image-source"
import { IMAGE_SIZES, imageSizeLabels, parseVideo, readGallery, type ImageSize } from "../media"


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

const sizeWidth: Record<ImageSize, string> = {
  small: "mx-auto w-1/3",
  medium: "mx-auto w-1/2",
  large: "mx-auto w-3/4",
  full: "w-full",
}

/** Barrinha que aparece sobre o bloco selecionado (tamanho, excluir…). */
function BlockMenu({ children }: { children: React.ReactNode }) {
  return (
    <span
      contentEditable={false}
      className="absolute top-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border bg-background p-1 font-sans text-xs shadow-md"
    >
      {children}
    </span>
  )
}

function MenuButton({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md px-2 font-medium transition-colors hover:bg-muted [&_svg]:size-3.5",
        active && "bg-foreground text-background hover:bg-foreground"
      )}
    >
      {children}
    </button>
  )
}

/** Foto no texto: mostra as fotos internas (Firestore) e permite mudar o tamanho. */
function ImageView({ node, selected, updateAttributes, deleteNode }: NodeViewProps) {
  const size = (IMAGE_SIZES as readonly string[]).includes(node.attrs.size) ? (node.attrs.size as ImageSize) : "full"
  return (
    <NodeViewWrapper className="relative my-6 block" data-drag-handle>
      {selected && (
        <BlockMenu>
          {IMAGE_SIZES.map((option) => (
            <MenuButton
              key={option}
              label={`Tamanho: ${imageSizeLabels[option]}`}
              active={size === option}
              onClick={() => updateAttributes({ size: option })}
            >
              {imageSizeLabels[option]}
            </MenuButton>
          ))}
          <MenuButton label="Excluir foto" onClick={deleteNode}>
            <Trash2Icon />
          </MenuButton>
        </BlockMenu>
      )}
      <StoredImage
        src={node.attrs.src as string}
        alt={(node.attrs.alt as string) ?? ""}
        loading="eager"
        className={cn("!my-0 block cursor-grab rounded-sm", sizeWidth[size], selected && "ring-3 ring-ring/50")}
      />
    </NodeViewWrapper>
  )
}

const ArticleImageNode = Image.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "full",
        parseHTML: (element) => element.getAttribute("data-size") ?? "full",
        renderHTML: (attributes) =>
          attributes.size && attributes.size !== "full" ? { "data-size": attributes.size } : {},
      },
    }
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView)
  },
})

/** Carrossel no meio do texto: escolha, ordene e remova as fotos. */
function GalleryView({ node, selected, updateAttributes, deleteNode }: NodeViewProps) {
  const images = (node.attrs.images as string[]) ?? []
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const addFiles = async (list: FileList | null) => {
    const files = imageFiles(list)
    if (!files.length) return
    setUploading(true)
    const added: string[] = []
    for (const file of files) {
      const result = await uploadArticleImage(file)
      if (result.ok && result.data) added.push(result.data.url)
      else toast.error(result.message)
    }
    updateAttributes({ images: [...images, ...added].slice(0, 30) })
    setUploading(false)
    if (input.current) input.current.value = ""
  }

  const move = (index: number, delta: number) => {
    const next = [...images]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    updateAttributes({ images: next })
  }

  return (
    <NodeViewWrapper
      className={cn("relative my-6 rounded-lg border-2 border-dashed bg-muted/40 p-3 font-sans", selected && "border-ring")}
      data-drag-handle
    >
      <div contentEditable={false} className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GalleryHorizontalIcon className="size-4" />
          Carrossel de fotos
          <span className="font-normal text-muted-foreground">({images.length})</span>
          <button
            type="button"
            title="Excluir carrossel"
            onClick={deleteNode}
            className="ml-auto grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-destructive [&_svg]:size-4"
          >
            <Trash2Icon />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {images.map((src, index) => (
            <div key={`${src}-${index}`} className="group relative overflow-hidden rounded-md bg-background">
              <StoredImage src={src} alt="" loading="eager" className="!my-0 aspect-[3/2] w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 p-0.5 text-white opacity-0 transition group-hover:opacity-100 [&_button]:grid [&_button]:size-6 [&_button]:place-items-center [&_button]:rounded [&_button:hover]:bg-white/20 [&_svg]:size-3.5">
                <button type="button" title="Mover para a esquerda" onClick={() => move(index, -1)}>
                  <ArrowLeftIcon />
                </button>
                <button
                  type="button"
                  title="Remover foto"
                  onClick={() => updateAttributes({ images: images.filter((_, i) => i !== index) })}
                >
                  <XIcon />
                </button>
                <button type="button" title="Mover para a direita" onClick={() => move(index, 1)}>
                  <ArrowRightIcon />
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            disabled={uploading}
            onClick={() => input.current?.click()}
            className="grid aspect-[3/2] place-items-center rounded-md border border-dashed bg-background text-xs text-muted-foreground hover:bg-muted disabled:opacity-60"
          >
            <span className="flex flex-col items-center gap-1 [&_svg]:size-5">
              {uploading ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
              {uploading ? "Enviando…" : "Adicionar fotos"}
            </span>
          </button>
        </div>
        <input
          ref={input}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>
    </NodeViewWrapper>
  )
}

const GalleryNode = Node.create({
  name: "gallery",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      images: {
        default: [],
        parseHTML: (element) => readGallery(element.getAttribute("data-images")),
        renderHTML: (attributes) => ({ "data-images": JSON.stringify(attributes.images ?? []) }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="gallery"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "gallery" })]
  },
  addNodeView() {
    return ReactNodeViewRenderer(GalleryView)
  },
})

/** Vídeo no texto: só a prévia (o player de verdade aparece na leitura). */
function VideoView({ node, selected, deleteNode }: NodeViewProps) {
  const info = parseVideo((node.attrs.src as string) ?? "")
  return (
    <NodeViewWrapper className="relative my-6 block font-sans" data-drag-handle>
      <div
        contentEditable={false}
        className={cn(
          "relative grid aspect-video cursor-grab place-items-center overflow-hidden rounded-sm bg-black text-white",
          selected && "ring-3 ring-ring/50"
        )}
      >
        {info?.thumbnail && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={info.thumbnail} alt="" className="!my-0 absolute inset-0 size-full object-cover opacity-70" />
        )}
        <span className="relative flex flex-col items-center gap-2 text-sm">
          <VideoIcon className="size-10" />
          {info
            ? `Vídeo ${info.provider === "youtube" ? "do YouTube" : info.provider === "vimeo" ? "do Vimeo" : "(arquivo)"} — começa sem som`
            : "Link de vídeo inválido"}
        </span>
        <button
          type="button"
          title="Excluir vídeo"
          onClick={deleteNode}
          className="absolute top-2 right-2 grid size-8 place-items-center rounded-md bg-black/60 hover:bg-black/80 [&_svg]:size-4"
        >
          <Trash2Icon />
        </button>
      </div>
    </NodeViewWrapper>
  )
}

const VideoNode = Node.create({
  name: "video",
  group: "block",
  atom: true,
  draggable: true,
  addAttributes() {
    return {
      src: {
        default: "",
        parseHTML: (element) => element.getAttribute("data-src") ?? "",
        renderHTML: (attributes) => ({ "data-src": attributes.src }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-type="video"]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes, { "data-type": "video" })]
  },
  addNodeView() {
    return ReactNodeViewRenderer(VideoView)
  },
})

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

  const insertVideo = () => {
    const url = window.prompt("Link do vídeo (YouTube, Vimeo ou arquivo .mp4)", "https://")
    if (!url || url === "https://") return
    if (!parseVideo(url)) {
      toast.error("Não reconheci esse link. Use um endereço do YouTube, do Vimeo ou de um arquivo .mp4.")
      return
    }
    editor.chain().focus().insertContent({ type: "video", attrs: { src: url.trim() } }).run()
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
      <button
        type="button"
        title="Carrossel de fotos no meio do texto"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => editor.chain().focus().insertContent({ type: "gallery", attrs: { images: [] } }).run()}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 [&_svg]:size-4"
      >
        <GalleryHorizontalIcon />
        Carrossel
      </button>
      <button
        type="button"
        title="Vídeo do YouTube, Vimeo ou link .mp4"
        onMouseDown={(event) => event.preventDefault()}
        onClick={insertVideo}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-background px-2.5 text-sm font-medium outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40 [&_svg]:size-4"
      >
        <VideoIcon />
        Vídeo
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
      ArticleImageNode,
      GalleryNode,
      VideoNode,
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
        // Arrastar uma foto que já está no texto: o editor só a MOVE.
        if (e.view.dragging) return
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
