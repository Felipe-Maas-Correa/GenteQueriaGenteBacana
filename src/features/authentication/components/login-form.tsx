"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { CircleAlertIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { Field } from "@/components/forms/field"
import { useAuth } from "@/features/authentication/auth-context"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

const ADMIN_HOME = "/admin/dashboard"

function safeNext(next: string | null): string {
  if (next && next.startsWith("/admin") && !next.startsWith("//")) return next
  return ADMIN_HOME
}

export function LoginForm({ disabled = false }: { disabled?: boolean }) {
  const { signIn } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = await signIn(values)
      if (result.ok) {
        router.replace(safeNext(searchParams.get("next")))
      } else {
        setFormError(result.message)
      }
    })
  })

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      {formError ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Field label="E-mail" required error={errors.email?.message}>
        {(control) => (
          <Input
            type="email"
            autoComplete="username"
            inputMode="email"
            placeholder="voce@exemplo.com.br"
            disabled={disabled}
            {...control}
            {...register("email")}
          />
        )}
      </Field>

      <Field label="Senha" required error={errors.password?.message}>
        {(control) => (
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-11"
              disabled={disabled}
              {...control}
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              aria-pressed={showPassword}
              className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
            >
              {showPassword ? (
                <EyeOffIcon className="size-4" aria-hidden />
              ) : (
                <EyeIcon className="size-4" aria-hidden />
              )}
            </button>
          </div>
        )}
      </Field>

      <Button type="submit" size="lg" loading={pending} disabled={disabled}>
        Entrar
      </Button>
    </form>
  )
}
