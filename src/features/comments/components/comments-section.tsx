"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { HeartIcon, MessageCircleIcon } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { SubscriberBadge } from "@/components/shared/subscriber-badge"
import { UserAvatar } from "@/components/shared/user-avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isStaff, useAuth } from "@/features/authentication/auth-context"
import { getMySubscription } from "@/features/billing/data"
import { useAsync } from "@/hooks/use-async"
import { cn } from "@/lib/utils"

import {
  addComment,
  deleteComment,
  listComments,
  MAX_COMMENT_LENGTH,
  syncMyComments,
  timeAgo,
  toggleLike,
  type Author,
  type Comment,
} from "../data"

const PAGE = 10

/* ── Caixa de texto ─────────────────────────────────────────── */

function Composer({
  author,
  placeholder,
  initialText = "",
  autoFocus,
  compact,
  onSubmit,
  onCancel,
}: {
  author: Author
  placeholder: string
  initialText?: string
  autoFocus?: boolean
  compact?: boolean
  onSubmit: (text: string) => Promise<boolean>
  onCancel?: () => void
}) {
  const [text, setText] = useState(initialText)
  const [pending, startTransition] = useTransition()
  const ref = useRef<HTMLTextAreaElement>(null)

  const submit = () =>
    startTransition(async () => {
      if (await onSubmit(text)) setText("")
    })

  return (
    <form
      className="flex items-start gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <UserAvatar name={author.name} photoUrl={author.photo} className={compact ? "size-7 text-[0.625rem]" : undefined} />
      <div className="min-w-0 flex-1 space-y-2">
        <textarea
          ref={ref}
          rows={1}
          autoFocus={autoFocus}
          value={text}
          maxLength={MAX_COMMENT_LENGTH}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => setText(event.target.value)}
          onFocus={(event) => {
            // Cursor no fim (útil quando já vem "@nome ").
            const end = event.target.value.length
            event.target.setSelectionRange(end, end)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) submit()
            if (event.key === "Escape") onCancel?.()
          }}
          className="block w-full resize-none border-0 border-b border-input bg-transparent px-0 py-2 text-sm outline-none transition-colors [field-sizing:content] placeholder:text-muted-foreground focus:border-foreground"
        />
        {text.trim() || onCancel ? (
          <div className="flex items-center justify-end gap-2">
            {text.length > MAX_COMMENT_LENGTH * 0.8 ? (
              <span className="mr-auto text-xs text-muted-foreground">
                {text.length}/{MAX_COMMENT_LENGTH}
              </span>
            ) : null}
            {onCancel ? (
              <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={pending}>
                Cancelar
              </Button>
            ) : null}
            <Button type="submit" size="sm" loading={pending} disabled={!text.trim()}>
              {compact ? "Responder" : "Publicar"}
            </Button>
          </div>
        ) : null}
      </div>
    </form>
  )
}

/* ── Um comentário ──────────────────────────────────────────── */

function CommentRow({
  comment,
  meId,
  canModerate,
  compact,
  onLike,
  onReply,
  onDelete,
  now,
}: {
  comment: Comment
  meId: string | null
  canModerate: boolean
  compact?: boolean
  onLike: (comment: Comment) => void
  onReply: (comment: Comment) => void
  onDelete: (comment: Comment) => void
  now: number
}) {
  const liked = meId ? comment.liked_by.includes(meId) : false
  const likes = comment.liked_by.length
  const canDelete = !comment.deleted && meId !== null && (comment.author_uid === meId || canModerate)

  if (comment.deleted) {
    return (
      <p className={cn("py-1 text-sm text-muted-foreground italic", compact ? "pl-10" : "pl-12")}>
        Comentário apagado.
      </p>
    )
  }

  return (
    <div className="flex gap-3">
      <UserAvatar
        name={comment.author_name}
        photoUrl={comment.author_photo}
        className={compact ? "size-7 text-[0.625rem]" : undefined}
      />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-1.5 text-sm leading-tight">
          <span className="inline-flex items-center gap-1 font-semibold">
            {comment.author_name}
            {comment.author_subscriber ? <SubscriberBadge /> : null}
          </span>
          <span aria-hidden className="text-muted-foreground">·</span>
          <time dateTime={comment.created_at} className="text-xs text-muted-foreground">
            {timeAgo(comment.created_at, now)}
          </time>
        </p>
        <p className="mt-1 text-[0.9375rem] leading-relaxed break-words whitespace-pre-line text-foreground/90">
          {comment.text}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {likes > 0 ? (
            <span>
              {likes} {likes === 1 ? "curtida" : "curtidas"}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="font-semibold outline-none hover:text-foreground focus-visible:underline"
          >
            Responder
          </button>
          {canDelete ? (
            <button
              type="button"
              onClick={() => onDelete(comment)}
              className="outline-none hover:text-destructive focus-visible:underline"
            >
              Apagar
            </button>
          ) : null}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onLike(comment)}
        aria-pressed={liked}
        aria-label={liked ? "Descurtir" : "Curtir"}
        className="grid size-8 shrink-0 place-items-center self-start rounded-full outline-none transition-transform active:scale-90 focus-visible:ring-3 focus-visible:ring-ring/40"
      >
        {/* Ao curtir, o coração "pula". */}
        <motion.span
          key={liked ? "on" : "off"}
          initial={{ scale: liked ? 0.4 : 1 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 11 }}
          className="grid place-items-center"
        >
          <HeartIcon
            className={cn(
              "size-4 transition-colors",
              liked ? "fill-[color:var(--vermelho)] text-[color:var(--vermelho)]" : "text-muted-foreground hover:text-foreground"
            )}
            aria-hidden
          />
        </motion.span>
      </button>
    </div>
  )
}

/* ── Seção ──────────────────────────────────────────────────── */

function Thread({
  initial,
  articleId,
  author,
  loginHref,
  canModerate,
}: {
  initial: Comment[]
  articleId: string
  author: Author | null
  loginHref: string
  canModerate: boolean
}) {
  const [items, setItems] = useState(initial)
  const [open, setOpen] = useState<Set<string>>(new Set())
  const [replyTo, setReplyTo] = useState<{ rootId: string; mention: string } | null>(null)
  const [visible, setVisible] = useState(PAGE)
  const [now] = useState(() => Date.now())
  const meId = author?.uid ?? null

  const { roots, replies } = useMemo(() => {
    const byParent = new Map<string, Comment[]>()
    for (const c of items) {
      if (!c.parent_id) continue
      if (c.deleted) continue // resposta apagada some
      byParent.set(c.parent_id, [...(byParent.get(c.parent_id) ?? []), c])
    }
    for (const list of byParent.values()) list.sort((a, b) => a.created_at.localeCompare(b.created_at))
    const top = items
      .filter((c) => !c.parent_id && (!c.deleted || (byParent.get(c.id)?.length ?? 0) > 0))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    return { roots: top, replies: byParent }
  }, [items])

  const total = items.filter((c) => !c.deleted).length

  const requireLogin = () => {
    toast.info("Entre na sua conta para comentar e curtir.", {
      action: { label: "Entrar", onClick: () => (window.location.href = loginHref) },
    })
  }

  const publish = async (text: string, parentId: string | null) => {
    if (!author) return requireLogin(), false
    const result = await addComment({ articleId, parentId, author, text })
    if (!result.ok || !result.data) {
      toast.error(result.message)
      return false
    }
    const created = result.data.comment
    setItems((list) => [...list, created])
    if (parentId) {
      setOpen((set) => new Set(set).add(parentId))
      setReplyTo(null)
    }
    return true
  }

  const like = async (comment: Comment) => {
    if (!meId) return requireLogin()
    const liking = !comment.liked_by.includes(meId)
    const apply = (add: boolean) =>
      setItems((list) =>
        list.map((c) =>
          c.id === comment.id
            ? { ...c, liked_by: add ? [...c.liked_by, meId] : c.liked_by.filter((u) => u !== meId) }
            : c
        )
      )
    apply(liking) // otimista
    const result = await toggleLike(comment, meId, liking)
    if (!result.ok) {
      apply(!liking)
      toast.error(result.message)
    }
  }

  const remove = async (comment: Comment) => {
    if (!window.confirm("Apagar este comentário?")) return
    const result = await deleteComment(comment)
    if (!result.ok) return toast.error(result.message)
    setItems((list) =>
      list.map((c) => (c.id === comment.id ? { ...c, deleted: true, text: "" } : c))
    )
    toast.success(result.message)
  }

  const startReply = (comment: Comment) => {
    if (!author) return requireLogin()
    const rootId = comment.parent_id ?? comment.id
    setOpen((set) => new Set(set).add(rootId))
    // Responder uma resposta marca a pessoa com @, como nas redes sociais.
    setReplyTo({ rootId, mention: comment.parent_id ? `@${comment.author_name} ` : "" })
  }

  return (
    <div className="space-y-8">
      <h2 id="comentarios" className="type-h3 flex items-center gap-2">
        <MessageCircleIcon className="size-5" aria-hidden />
        Comentários{total ? <span className="text-muted-foreground">({total})</span> : null}
      </h2>

      {author ? (
        <Composer author={author} placeholder="Escreva um comentário…" onSubmit={(text) => publish(text, null)} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4">
          <p className="text-sm text-muted-foreground">Entre na sua conta para comentar e curtir.</p>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href={loginHref}>Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login?modo=cadastro">Criar conta</Link>
            </Button>
          </div>
        </div>
      )}

      {roots.length === 0 ? (
        <p className="text-sm text-muted-foreground">Seja o primeiro a comentar.</p>
      ) : (
        <ul className="space-y-6">
          <AnimatePresence initial={false}>
          {roots.slice(0, visible).map((root) => {
            const list = replies.get(root.id) ?? []
            const isOpen = open.has(root.id)
            return (
              <motion.li
                key={root.id}
                layout="position"
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
                className="space-y-3"
              >
                <CommentRow
                  comment={root}
                  meId={meId}
                  canModerate={canModerate}
                  onLike={like}
                  onReply={startReply}
                  onDelete={remove}
                  now={now}
                />

                {list.length || replyTo?.rootId === root.id ? (
                  <div className="space-y-3 pl-12">
                    {list.length ? (
                      <button
                        type="button"
                        onClick={() =>
                          setOpen((set) => {
                            const next = new Set(set)
                            if (next.has(root.id)) next.delete(root.id)
                            else next.add(root.id)
                            return next
                          })
                        }
                        className="flex items-center gap-3 text-xs font-semibold text-muted-foreground outline-none hover:text-foreground focus-visible:underline"
                      >
                        <span className="h-px w-6 bg-current" aria-hidden />
                        {isOpen ? "Ocultar respostas" : `Ver respostas (${list.length})`}
                      </button>
                    ) : null}

                    <AnimatePresence initial={false}>
                      {isOpen ? (
                        <motion.div
                          key="respostas"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                          className="space-y-3 overflow-hidden"
                        >
                          {list.map((reply) => (
                            <motion.div
                              key={reply.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              <CommentRow
                                comment={reply}
                                meId={meId}
                                canModerate={canModerate}
                                compact
                                onLike={like}
                                onReply={startReply}
                                onDelete={remove}
                                now={now}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <AnimatePresence initial={false}>
                    {author && replyTo?.rootId === root.id ? (
                      <motion.div
                        key="responder"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                      <Composer
                        key={replyTo.mention}
                        author={author}
                        compact
                        autoFocus
                        initialText={replyTo.mention}
                        placeholder={`Responder a ${root.author_name}…`}
                        onSubmit={(text) => publish(text, root.id)}
                        onCancel={() => setReplyTo(null)}
                      />
                      </motion.div>
                    ) : null}
                    </AnimatePresence>
                  </div>
                ) : null}
              </motion.li>
            )
          })}
          </AnimatePresence>
        </ul>
      )}

      {roots.length > visible ? (
        <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>
          Ver mais comentários ({roots.length - visible})
        </Button>
      ) : null}
    </div>
  )
}

/** Comentários no fim da notícia. */
export function CommentsSection({ articleId, articleSlug }: { articleId: string; articleSlug: string }) {
  const { user } = useAuth()
  const comments = useAsync(() => listComments(articleId), [articleId])
  const subscription = useAsync(
    () => (user ? getMySubscription(user.id).catch(() => null) : Promise.resolve(null)),
    [user?.id]
  )

  const loginHref = `/login?next=${encodeURIComponent(`/noticia?slug=${articleSlug}`)}`
  const author: Author | null = user
    ? {
        uid: user.id,
        // Exatamente o nome do perfil (as regras do banco conferem).
        name: user.profileName || "Leitor",
        photo: user.photoUrl,
        subscriber: subscription.data?.status === "ativa",
      }
    : null

  // Comentários antigos com nome/foto/selo desatualizados (o perfil mudou
  // depois): na tela já aparecem certos e o banco é corrigido em seguida.
  const identityKnown = Boolean(author) && !subscription.loading
  const isStale = (c: Comment) =>
    author !== null &&
    c.author_uid === author.uid &&
    (c.author_name !== author.name ||
      c.author_photo !== author.photo ||
      c.author_subscriber !== author.subscriber)
  const stale = identityKnown && (comments.data ?? []).some(isStale)
  const list = (comments.data ?? []).map((c) =>
    identityKnown && author && isStale(c)
      ? { ...c, author_name: author.name, author_photo: author.photo, author_subscriber: author.subscriber }
      : c
  )
  useEffect(() => {
    if (stale && user) syncMyComments(user.id).catch(() => {})
  }, [stale, user])

  return (
    <section aria-labelledby="comentarios" className="border-t py-12 sm:py-16">
      <div className="page-container">
        <div className="mx-auto max-w-2xl">
          {comments.loading && !comments.data ? (
            <div className="space-y-4" aria-busy aria-label="Carregando comentários">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : comments.error ? (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os comentários.{" "}
              <button type="button" onClick={comments.reload} className="text-brand hover:underline">
                Tentar de novo
              </button>
            </p>
          ) : user && subscription.loading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <Thread
              key={`${comments.data?.length ?? 0}-${author?.subscriber ?? "anon"}`}
              initial={list}
              articleId={articleId}
              author={author}
              loginHref={loginHref}
              canModerate={isStaff(user?.role)}
            />
          )}
        </div>
      </div>
    </section>
  )
}
