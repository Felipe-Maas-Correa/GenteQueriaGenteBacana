"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import {
  ExternalLinkIcon,
  ImageUpIcon,
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
import type { Article } from "@/types/database"

import { deleteArticle, saveArticle, uploadArticleImage } from "../actions"
import { isEmptyBody } from "../article-body"
import { StoredImage } from "../image-source"
import { ArticleCard, articleHref } from "./article-card"
import { CardSizePicker, SwitchRow } from "./card-controls"
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
          if (!article && result.data) {
            router.replace(routes.editArticle(result.data.id))
          } else {
            router.refresh()
          }
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
            hint="Para pôr uma foto no meio do texto: clique onde ela deve ficar e use Inserir foto (ou cole/arraste a imagem)."
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

        <Panel title="Foto principal">
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
