"use client"

import { useId } from "react"
import { CircleAlertIcon } from "lucide-react"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type FieldControlProps = {
  id: string
  "aria-invalid": boolean | undefined
  "aria-describedby": string | undefined
}

type FieldProps = {
  label: string
  /** Mensagem de erro de validação; quando presente, o campo fica em estado inválido. */
  error?: string
  /** Texto de apoio exibido abaixo do campo. */
  hint?: string
  required?: boolean
  className?: string
  /** Recebe as props de acessibilidade que devem ser repassadas ao controle. */
  children: (control: FieldControlProps) => React.ReactNode
}

/**
 * Estrutura padrão de um campo de formulário: rótulo, controle, apoio e erro,
 * já conectados por id/aria para leitores de tela.
 */
export function Field({
  label,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const errorId = `${id}-error`
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") ||
    undefined

  return (
    <div className={cn("grid gap-1.5", className)} data-invalid={!!error || undefined}>
      <Label htmlFor={id} className="type-small font-medium">
        {label}
        {required ? (
          <span className="text-brand" aria-hidden>
            *
          </span>
        ) : (
          <span className="type-caption font-normal text-muted-foreground">
            opcional
          </span>
        )}
      </Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
      })}
      {hint && !error ? (
        <p id={hintId} className="type-caption font-normal text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? <FieldError id={errorId}>{error}</FieldError> : null}
    </div>
  )
}

export function FieldError({
  id,
  children,
}: {
  id?: string
  children: React.ReactNode
}) {
  return (
    <p
      id={id}
      role="alert"
      className="type-caption flex items-start gap-1 text-destructive"
    >
      <CircleAlertIcon className="mt-px size-3.5 shrink-0" aria-hidden />
      {children}
    </p>
  )
}
