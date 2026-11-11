"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { CircleAlertIcon, CircleCheckIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { Field } from "@/components/forms/field"
import { useAuth } from "@/features/authentication/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"

import { sendResetEmail } from "../password-reset"
import { SIGNUP_EMAIL_KEY } from "./signup-form"

// Sem destino definido, volta para a capa; a equipe acessa o painel pelo menu.
const DEFAULT_HOME = "/"

function safeNext(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next
  return DEFAULT_HOME
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
    getValues,
    setError,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const [sendingReset, startReset] = useTransition()
  const forgotPassword = () => {
    const email = getValues("email").trim()
    if (!email) {
      setError("email", { message: "Digite seu e-mail para receber o link." })
      setFocus("email")
      return
    }
    startReset(async () => {
      const result = await sendResetEmail(email)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })
  }

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
            Agora é só entrar com seu e-mail e senha.
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

      <button
        type="button"
        disabled={disabled || sendingReset}
        onClick={forgotPassword}
        className="type-small -mt-1 justify-self-center rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50"
      >
        {sendingReset ? "Enviando…" : "Esqueci minha senha"}
      </button>
    </form>
  )
}
