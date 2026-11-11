"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { CircleAlertIcon, CircleCheckIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { Field } from "@/components/forms/field"
import { useAuth } from "@/features/authentication/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

import { SIGNUP_EMAIL_KEY } from "./signup-form"

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

  const accountCreated = searchParams.get("conta") === "criada"

  const {
    register,
    handleSubmit,
    setValue,
    setFocus,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  // Depois do cadastro: preenche o e-mail e leva o cursor para a senha.
  useEffect(() => {
    if (!accountCreated) return
    try {
      const email = sessionStorage.getItem(SIGNUP_EMAIL_KEY)
      sessionStorage.removeItem(SIGNUP_EMAIL_KEY)
      if (email) {
        setValue("email", email)
        setFocus("password")
      }
    } catch {
      // Armazenamento indisponível: a pessoa digita o e-mail.
    }
  }, [accountCreated, setValue, setFocus])

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
      {accountCreated && !formError ? (
        <Alert variant="success" role="status">
          <CircleCheckIcon aria-hidden />
          <AlertTitle>Conta criada com sucesso!</AlertTitle>
          <AlertDescription>
            Entre com seu e-mail e senha. O acesso ao painel é liberado por um
            administrador do jornal.
          </AlertDescription>
        </Alert>
      ) : null}
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
