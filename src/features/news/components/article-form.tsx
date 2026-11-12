"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EyeIcon,
  ExternalLinkIcon,
  GlobeIcon,
  ImagePlusIcon,
  ImageUpIcon,
  LockIcon,
  LockOpenIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Field } from "@/components/forms/field"
import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useEditorias } from "@/features/editorias/editorias-context"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/utils/format"
import {
  articleSchema,
  isoToLocalInput,
  slugify,
  type ArticleInput,
} from "@/lib/validations/article"
import type { Article, ArticleAccess } from "@/types/database"

import { deleteArticle, previewOf, saveArticle, uploadArticleImage } from "../actions"
import { isEmptyBody } from "../article-body"
import { StoredImage } from "../image-source"
import { ArticleCard, articleHref } from "./article-card"
import { CardSizePicker, SwitchRow } from "./card-controls"
import { ArticleView } from "./public-views"
import { RichTextEditor } from "./rich-text-editor"
import { routes } from "@/lib/routes"

const LIST_PATH = "/admin/noticias"

function Panel({
  title,
  children,
  className,
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-4 rounded-xl border bg-card p-5", className)}>
      <h2 className="type-overline text-muted-foreground">{title}</h2>
      {children}
    </section>
  )
}

const accessOptions: { value: ArticleAccess; label: string; hint: string; icon: typeof GlobeIcon }[] = [
  { value: "public", label: "Todos os leitores", hint: "Qualquer pessoa lê a notícia inteira.", icon: GlobeIcon },
  { value: "partial", label: "Prévia aberta", hint: "Todos leem o começo; o resto é só para assinantes.", icon: LockOpenIcon },
  { value: "subscribers", label: "Só assinantes", hint: "Quem não assina vê apenas título, foto e linha fina.", icon: LockIcon },
]

/** Pré-visualização em tela cheia: a edição continua aberta por baixo. */
function PreviewOverlay({ article, body, onClose }: { article: Article; body: string; onClose: () => void }) {
  const [asSubscriber, setAsSubscriber] = useState(true)
  const restricted = article.access !== "public"
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKey)
    }
  }, [onClose])

  const lockedBody = article.access === "partial" ? previewOf(body) : ""
  return (
    <div role="dialog" aria-modal aria-label="Pré-visualização da notícia" className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b bg-background/90 px-4 py-3 backdrop-blur-md">
        <Button type="button" onClick={onClose}>
          <ArrowLeftIcon aria-hidden />
          Voltar para a edição
        </Button>
        <span className="type-small text-muted-foreground">Pré-visualização — nada foi salvo nem publicado.</span>
        {restricted ? (
          <div className="ml-auto flex rounded-lg border p-0.5 text-sm">
            {[true, false].map((option) => (
              <button
                key={String(option)}
                type="button"
                onClick={() => setAsSubscriber(option)}
                className={cn(
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  asSubscriber === option ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                )}
              >
                {option ? "Como assinante" : "Como não assinante"}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <article className="pb-16">
        <ArticleView
          preview
          article={{ ...article, body: restricted && !asSubscriber ? lockedBody : body }}
          fullBody={restricted && !asSubscriber ? null : body}
        />
      </article>
    </div>
  )
}

function toInput(article?: Article): ArticleInput {
  return {
    title: article?.title ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    body: article?.body ?? "",
    editoria: article?.editoria ?? "",
    author: article?.author ?? "",
    kicker: article?.kicker ?? "",
    kicker_tone: article?.kicker_tone ?? "default",
    image_url: article?.image_url ?? "",
    image_caption: article?.image_caption ?? "",
    gallery: article?.gallery ?? [],
    access: article?.access ?? "public",
    status: article?.status ?? "draft",
    publish_at: isoToLocalInput(article?.published_at ?? ""),
    on_home: article?.on_home ?? true,
    card_size: article?.card_size ?? "small",
    show_image: article?.show_image ?? true,
    show_excerpt: article?.show_excerpt ?? true,
  }
}

export function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter()
  const { editorias } = useEditorias()
  const isEditing = Boolean(article)
  const [pending, startTransition] = useTransition()
  const [deleting, startDeleting] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [galleryUploading, setGalleryUploading] = useState(false)
  const galleryInput = useRef<HTMLInputElement>(null)
  // Enquanto o endereço não for editado à mão, acompanha o título.
  const [slugTouched, setSlugTouched] = useState(isEditing)
  const fileInput = useRef<HTMLInputElement>(null)
  // Referência de "agora" para decidir se a data escolhida é um agendamento.
  const [openedAt] = useState(() => Date.now())

  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<ArticleInput>({
    resolver: zodResolver(articleSchema),
    defaultValues: toInput(article),
  })

  const values = useWatch({ control }) as ArticleInput
  const preview: Article = {
    ...(article ?? {
      id: "preview",
      home_order: 0,
      published_at: "",
      created_at: "",
      updated_at: "",
    }),
    ...values,
    title: values.title || "Título da notícia",
    editoria: values.editoria || editorias[0]?.id || "",
  }

  const scheduled =
    Boolean(values.publish_at) && new Date(values.publish_at).getTime() > openedAt
  const statusLabel =
    values.status === "draft"
      ? "Rascunho"
      : scheduled
        ? `Agendada para ${formatDateTime(new Date(values.publish_at).toISOString())}`
        : "Publicada"

  const submit = (status: ArticleInput["status"]) =>
    handleSubmit((input) => {
      startTransition(async () => {
        const result = await saveArticle(article?.id ?? null, { ...input, status })
        if (result.ok) {
          toast.success(
            status === "published" &&
              input.publish_at &&
              new Date(input.publish_at).getTime() > Date.now()
              ? "Notícia agendada."
              : status === "published" && article?.status !== "published"
                ? "Notícia publicada."
                : result.message
          )
          reset({ ...input, status })
          // Publicada (no ar agora): abre a notícia no site para ver como ficou.
          // Rascunho ou agendada ainda não aparece no site: volta para a lista.
          const live =
            status === "published" &&
            !(input.publish_at && new Date(input.publish_at).getTime() > Date.now())
          router.push(live ? routes.article(input.slug) : LIST_PATH)
          return
        }
        toast.error(result.message)
        for (const [field, messages] of Object.entries(result.fieldErrors ?? {})) {
          if (messages?.[0]) {
            setError(field as keyof ArticleInput, { message: messages[0] })
          }
        }
      })
    })()

  const handleUpload = async (file: File | undefined) => {
    if (!file) return
    setUploading(true)
    const result = await uploadArticleImage(file)
    setUploading(false)
    if (fileInput.current) fileInput.current.value = ""
    if (result.ok && result.data) {
      setValue("image_url", result.data.url, { shouldDirty: true })
      setValue("show_image", true, { shouldDirty: true })
      toast.success(result.message)
    } else {
      toast.error(result.message)
    }
  }

  const gallery = values.gallery ?? []
  const setGallery = (next: string[]) => setValue("gallery", next, { shouldDirty: true })

  const handleGalleryUpload = async (list: FileList | null) => {
    const files = Array.from(list ?? []).filter((file) => file.type.startsWith("image/"))
    if (!files.length) return
    setGalleryUploading(true)
    const added: string[] = []
    for (const file of files) {
      const result = await uploadArticleImage(file)
      if (result.ok && result.data) added.push(result.data.url)
      else toast.error(result.message)
    }
    setGalleryUploading(false)
    if (galleryInput.current) galleryInput.current.value = ""
    if (!added.length) return
    // Sem foto principal, a primeira enviada vira a principal.
    if (!values.image_url) {
      setValue("image_url", added.shift() as string, { shouldDirty: true })
      setValue("show_image", true, { shouldDirty: true })
    }
    setGallery([...gallery, ...added].slice(0, 12))
  }

  const moveGallery = (index: number, delta: number) => {
    const next = [...gallery]
    const target = index + delta
    if (target < 0 || target >= next.length) return
    ;[next[index], next[target]] = [next[target], next[index]]
    setGallery(next)
  }

  const handleDelete = () => {
    if (!article) return
    startDeleting(async () => {
      const result = await deleteArticle(article.id)
      if (result.ok) {
        toast.success(result.message)
        router.push(LIST_PATH)
      } else {
        toast.error(result.message)
        setConfirmDelete(false)
      }
    })
  }

  const titleField = register("title")

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit(values.status)
      }}
      noValidate
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"
    >
      {/* ── Conteúdo ─────────────────────────────────────────── */}
      <div className="space-y-6">
        <Panel title="Texto">
          <Field label="Título" required error={errors.title?.message}>
            {(field) => (
              <Textarea
                rows={1}
                placeholder="Escreva o título da notícia"
                className="min-h-0 resize-none py-2.5 font-display text-xl leading-snug font-medium [field-sizing:content]"
                {...field}
                {...titleField}
                onChange={(event) => {
                  titleField.onChange(event)
                  if (!slugTouched) {
                    setValue("slug", slugify(event.target.value), {
                      shouldDirty: true,
                    })
                  }
                }}
              />
            )}
          </Field>

          <Field
            label="Linha fina"
            error={errors.excerpt?.message}
            hint="Resumo de uma ou duas frases. Aparece no cartão e abaixo do título."
          >
            {(field) => <Textarea rows={2} {...field} {...register("excerpt")} />}
          </Field>

          <Field
            label="Texto da notícia"
            error={errors.body?.message}
            hint="Clique onde a mídia deve ficar e use Inserir foto, Carrossel ou Vídeo. Clique numa foto para mudar o tamanho; arraste para mudar de lugar."
          >
            {(field) => (
              <Controller
                control={control}
                name="body"
                render={({ field: { value, onChange } }) => (
                  <RichTextEditor
                    id={field.id}
                    value={value}
                    onChange={(html) => onChange(isEmptyBody(html) ? "" : html)}
                    invalid={field["aria-invalid"]}
                    describedBy={field["aria-describedby"]}
                  />
                )}
              />
            )}
          </Field>
        </Panel>

        <Panel title="Foto principal (capa)">
          {values.image_url ? (
            <figure className="relative overflow-hidden rounded-md border">
              <StoredImage
                src={values.image_url}
                alt="Prévia da foto"
                loading="eager"
                className="aspect-[16/9] w-full object-cover"
              />
              <Button
                type="button"
                size="icon-sm"
                variant="secondary"
                className="absolute top-2 right-2"
                aria-label="Remover foto"
                onClick={() => setValue("image_url", "", { shouldDirty: true })}
              >
                <XIcon aria-hidden />
              </Button>
            </figure>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="sr-only"
              aria-label="Escolher foto do computador"
              onChange={(event) => handleUpload(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="outline"
              loading={uploading}
              onClick={() => fileInput.current?.click()}
            >
              <ImageUpIcon aria-hidden />
              {values.image_url ? "Trocar foto" : "Enviar foto"}
            </Button>
            <span className="type-caption text-muted-foreground">
              {values.image_url.startsWith("/api/imagens/")
                ? "Foto enviada do seu computador ou celular."
                : "Escolha uma foto do computador ou da galeria do celular, ou cole o endereço de uma imagem abaixo."}
            </span>
          </div>

          <div className="grid items-start gap-4 sm:grid-cols-2">
            {/* Foto enviada pelo painel: o endereço interno não precisa aparecer. */}
            {values.image_url.startsWith("/api/imagens/") ? null : (
              <Field label="Endereço da imagem" error={errors.image_url?.message}>
                {(field) => (
                  <Input placeholder="https://…" {...field} {...register("image_url")} />
                )}
              </Field>
            )}
            <Field
              label="Legenda / crédito"
              error={errors.image_caption?.message}
              className={values.image_url.startsWith("/api/imagens/") ? "sm:col-span-2" : undefined}
            >
              {(field) => <Input {...field} {...register("image_caption")} />}
            </Field>
          </div>

          <div className="space-y-3 border-t pt-4">
            <div>
              <p className="text-sm font-medium">Carrossel na capa</p>
              <p className="type-caption text-muted-foreground">
                Adicione mais fotos para a capa virar um carrossel (até 12). A foto principal é sempre a primeira.
              </p>
            </div>
            {gallery.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {gallery.map((src, index) => (
                  <div key={`${src}-${index}`} className="group relative overflow-hidden rounded-md border">
                    <StoredImage src={src} alt={`Foto extra ${index + 1}`} loading="eager" className="aspect-[3/2] w-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/55 p-0.5 text-white [&_button]:grid [&_button]:size-7 [&_button]:place-items-center [&_button]:rounded [&_button:hover]:bg-white/20 [&_svg]:size-3.5">
                      <button type="button" aria-label="Mover para a esquerda" onClick={() => moveGallery(index, -1)}>
                        <ArrowLeftIcon />
                      </button>
                      <button type="button" aria-label="Remover foto" onClick={() => setGallery(gallery.filter((_, i) => i !== index))}>
                        <XIcon />
                      </button>
                      <button type="button" aria-label="Mover para a direita" onClick={() => moveGallery(index, 1)}>
                        <ArrowRightIcon />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            <input
              ref={galleryInput}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              aria-label="Escolher fotos para o carrossel da capa"
              onChange={(event) => handleGalleryUpload(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              loading={galleryUploading}
              disabled={gallery.length >= 12}
              onClick={() => galleryInput.current?.click()}
            >
              <ImagePlusIcon aria-hidden />
              Adicionar fotos ao carrossel
            </Button>
          </div>
        </Panel>
      </div>

      {/* ── Lateral: publicação e cartão ─────────────────────── */}
      <aside className="space-y-6">
        <Panel title="Publicação">
          <p className="type-small flex items-center justify-between">
            Situação
            <span
              className={cn(
                "font-medium",
                scheduled && values.status === "published"
                  ? "text-info"
                  : values.status === "published"
                    ? "text-success"
                    : "text-muted-foreground"
              )}
            >
              {statusLabel}
            </span>
          </p>

          <Field
            label="Data e hora de publicação"
            error={errors.publish_at?.message}
            hint={
              scheduled
                ? "Data no futuro: a notícia entra no ar sozinha nesse horário."
                : "Vazio = publica na hora. Escolha uma data futura para agendar."
            }
          >
            {(field) => (
              <div className="flex gap-2">
                <Input type="datetime-local" {...field} {...register("publish_at")} />
                {values.publish_at ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Limpar data"
                    onClick={() => setValue("publish_at", "", { shouldDirty: true })}
                  >
                    <XIcon aria-hidden />
                  </Button>
                ) : null}
              </div>
            )}
          </Field>

          <Field label="Editoria" required error={errors.editoria?.message}>
            {(field) => (
              <Controller
                control={control}
                name="editoria"
                render={({ field: { value, onChange } }) => (
                  <Select value={value} onValueChange={onChange}>
                    <SelectTrigger {...field} className="w-full">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {editorias.map((editoria) => (
                        <SelectItem key={editoria.id} value={editoria.id}>
                          {editoria.name}
                          {editoria.in_menu ? null : (
                            <span className="text-xs text-muted-foreground">(fora do menu)</span>
                          )}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
          </Field>

          <Field label="Autor" error={errors.author?.message}>
            {(field) => <Input placeholder="Redação" {...field} {...register("author")} />}
          </Field>

          <Field
            label="Endereço (URL)"
            required
            error={errors.slug?.message}
            hint={routes.article(values.slug || "…")}
          >
            {(field) => {
              const slugField = register("slug")
              return (
                <Input
                  {...field}
                  {...slugField}
                  onChange={(event) => {
                    setSlugTouched(true)
                    slugField.onChange(event)
                  }}
                />
              )
            }}
          </Field>

          {article ? (
            <p className="type-caption text-muted-foreground">
              Criada em {formatDateTime(article.created_at)}
              {article.published_at
                ? ` · publicada em ${formatDateTime(article.published_at)}`
                : ""}
            </p>
          ) : null}
        </Panel>

        <Panel title="Quem pode ler">
          <Controller
            control={control}
            name="access"
            render={({ field: { value, onChange } }) => (
              <div role="radiogroup" aria-label="Quem pode ler" className="space-y-2">
                {accessOptions.map((option) => {
                  const Icon = option.icon
                  const active = value === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => onChange(option.value)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60",
                        active && "border-foreground bg-muted/60 ring-1 ring-foreground"
                      )}
                    >
                      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                      <span>
                        <span className="block text-sm font-medium">{option.label}</span>
                        <span className="type-caption block text-muted-foreground">{option.hint}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          />
        </Panel>

        <Panel title="Cartão na página inicial">
          <Controller
            control={control}
            name="on_home"
            render={({ field: { value, onChange } }) => (
              <SwitchRow
                id="article-on-home"
                title="Mostrar na página inicial"
                checked={value}
                onCheckedChange={onChange}
              />
            )}
          />

          <Controller
            control={control}
            name="card_size"
            render={({ field: { value, onChange } }) => (
              <CardSizePicker value={value} onChange={onChange} />
            )}
          />

          <Controller
            control={control}
            name="show_image"
            render={({ field: { value, onChange } }) => (
              <SwitchRow
                id="article-show-image"
                title="Com foto"
                description={
                  values.image_url ? undefined : "Sem foto enviada, usa a arte da editoria."
                }
                checked={value}
                onCheckedChange={onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="show_excerpt"
            render={({ field: { value, onChange } }) => (
              <SwitchRow
                id="article-show-excerpt"
                title="Com linha fina"
                checked={value}
                onCheckedChange={onChange}
              />
            )}
          />

          <div className="grid grid-cols-[1fr_auto] items-end gap-2">
            <Field
              label="Chapéu"
              error={errors.kicker?.message}
              hint="Ex.: Urgente, Exclusivo, Ao vivo."
            >
              {(field) => <Input {...field} {...register("kicker")} />}
            </Field>
            <Controller
              control={control}
              name="kicker_tone"
              render={({ field: { value, onChange } }) => (
                <Button
                  type="button"
                  variant={value === "urgent" ? "destructive" : "outline"}
                  aria-pressed={value === "urgent"}
                  className="mb-6"
                  onClick={() => onChange(value === "urgent" ? "default" : "urgent")}
                >
                  Urgente
                </Button>
              )}
            />
          </div>

          <div className="space-y-2 border-t pt-4">
            <p className="type-overline text-muted-foreground">Prévia do cartão</p>
            <div className="pointer-events-none rounded-md border bg-background p-4 [zoom:0.6]">
              <ArticleCard article={preview} />
            </div>
          </div>
        </Panel>
      </aside>

      {/* ── Barra de ações ───────────────────────────────────── */}
      <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t bg-background/90 px-4 py-4 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:col-span-2">
        {isEditing ? (
          <Button
            type="button"
            variant="destructive-soft"
            onClick={() => setConfirmDelete(true)}
            disabled={pending}
          >
            <Trash2Icon aria-hidden />
            Excluir
          </Button>
        ) : null}
        {article?.status === "published" ? (
          <Button asChild variant="ghost">
            <Link href={articleHref(article)} target="_blank">
              <ExternalLinkIcon aria-hidden />
              Ver no site
            </Link>
          </Button>
        ) : null}
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => setPreviewOpen(true)}>
            <EyeIcon aria-hidden />
            Pré-visualizar
          </Button>
          <Button asChild variant="ghost">
            <Link href={LIST_PATH}>Voltar</Link>
          </Button>
          {values.status === "published" ? (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={pending || deleting}
                onClick={() => submit("draft")}
              >
                {scheduled ? "Cancelar agendamento" : "Despublicar"}
              </Button>
              <Button
                type="button"
                loading={pending}
                disabled={deleting || (isEditing && !isDirty)}
                onClick={() => submit("published")}
              >
                Salvar alterações
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={pending || deleting}
                onClick={() => submit("draft")}
              >
                Salvar rascunho
              </Button>
              <Button
                type="button"
                variant="accent"
                loading={pending}
                disabled={deleting}
                onClick={() => submit("published")}
              >
                {scheduled ? "Agendar" : "Publicar"}
              </Button>
            </>
          )}
        </div>
      </div>

      {previewOpen ? (
        <PreviewOverlay article={preview} body={values.body} onClose={() => setPreviewOpen(false)} />
      ) : null}

      {article ? (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title="Excluir notícia?"
          description={
            <>
              <strong className="font-semibold text-foreground">{article.title}</strong>{" "}
              será removida definitivamente do site e do painel.
            </>
          }
          confirmLabel="Excluir"
          tone="destructive"
          loading={deleting}
          onConfirm={handleDelete}
        />
      ) : null}
    </form>
  )
}
