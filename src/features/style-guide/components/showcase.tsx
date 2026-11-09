import { cn } from "@/lib/utils"

/** Seção do Guia de Estilo, com âncora para a navegação lateral. */
export function GuideSection({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="scroll-mt-28 space-y-6 border-t pt-10"
    >
      <header className="max-w-2xl space-y-1.5">
        <h2 id={`${id}-title`} className="type-h2">
          {title}
        </h2>
        <p className="type-small text-muted-foreground">{description}</p>
      </header>
      {children}
    </section>
  )
}

/** Moldura de demonstração: título, exemplo ao vivo e a forma de uso. */
export function Showcase({
  title,
  description,
  usage,
  children,
  className,
  contentClassName,
}: {
  title: string
  description?: string
  /** Trecho curto mostrando como usar o componente. */
  usage?: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border bg-card",
        className
      )}
    >
      <div className="space-y-0.5 border-b px-5 py-3.5">
        <h3 className="type-h4">{title}</h3>
        {description ? (
          <p className="type-caption font-normal text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      <div
        className={cn(
          "flex flex-wrap items-center gap-3 px-5 py-6",
          contentClassName
        )}
      >
        {children}
      </div>
      {usage ? (
        <pre className="type-data overflow-x-auto border-t bg-muted/60 px-5 py-3 text-[0.75rem] text-muted-foreground">
          <code>{usage}</code>
        </pre>
      ) : null}
    </div>
  )
}
