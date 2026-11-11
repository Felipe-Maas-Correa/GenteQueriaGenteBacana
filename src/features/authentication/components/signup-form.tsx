"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { CircleAlertIcon } from "lucide-react"
import { toast } from "sonner"

import { Field } from "@/components/forms/field"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/authentication/auth-context"
import { signUpSchema, type SignUpInput } from "@/lib/validations/auth"

/** Chave do e-mail recém-cadastrado, usada para preencher a aba Entrar. */
export const SIGNUP_EMAIL_KEY = "gqgb:signup-email"

export function SignUpForm({ disabled = false }: { disabled?: boolean }) {
  const { signUp, signOutUser } = useAuth()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirm: "" },
  })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    startTransition(async () => {
      const result = await signUp(values)
      if (result.ok) {
        // O Firebase entra automaticamente após criar a conta; saímos para
        // que a pessoa faça o primeiro login na aba Entrar.
        await signOutUser()
        try {
          sessionStorage.setItem(SIGNUP_EMAIL_KEY, values.email)
        } catch {
          // Armazenamento indisponível: o e-mail só não vem preenchido.
        }
        toast.success("Conta criada com sucesso!", {
          description: "Agora entre com seu e-mail e senha.",
        })
        router.replace("/login?conta=criada")
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

      <Field label="Nome" required error={errors.name?.message}>
        {(control) => (
          <Input autoComplete="name" disabled={disabled} {...control} {...register("name")} />
        )}
      </Field>
      <Field label="E-mail" required error={errors.email?.message}>
        {(control) => (
          <Input
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@exemplo.com.br"
            disabled={disabled}
            {...control}
            {...register("email")}
          />
        )}
      </Field>
      <Field label="Senha" required error={errors.password?.message} hint="Mínimo de 8 caracteres.">
        {(control) => (
          <Input
            type="password"
            autoComplete="new-password"
            disabled={disabled}
            {...control}
            {...register("password")}
          />
        )}
      </Field>
      <Field label="Confirme a senha" required error={errors.confirm?.message}>
        {(control) => (
          <Input
            type="password"
            autoComplete="new-password"
            disabled={disabled}
            {...control}
            {...register("confirm")}
          />
        )}
      </Field>

      <Button type="submit" size="lg" loading={pending} disabled={disabled}>
        Criar conta
      </Button>
    </form>
  )
}
