"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth"
import { CircleAlertIcon, CircleCheckIcon, EyeIcon, EyeOffIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { useAsync } from "@/hooks/use-async"
import { getFirebaseAuth } from "@/lib/firebase/client"

function codeError(code: string | undefined): string {
  switch (code) {
    case "auth/expired-action-code":
      return "Este link expirou. Peça um novo em Minha conta › Trocar senha."
    case "auth/invalid-action-code":
      return "Este link já foi usado ou não é válido. Peça um novo link."
    case "auth/user-disabled":
      return "Esta conta está desativada."
    case "auth/weak-password":
      return "Escolha uma senha mais forte (mínimo de 8 caracteres)."
    default:
      return "Não foi possível redefinir a senha. Tente novamente."
  }
}

/**
 * Página que recebe o link do e-mail de redefinição (Firebase "action URL").
 * Valida o código, pede a nova senha e confirma.
 */
export function ResetPasswordForm() {
  const params = useSearchParams()
  const mode = params.get("mode")
  const oobCode = params.get("oobCode") ?? ""

  const check = useAsync(async () => {
    if (mode !== "resetPassword" || !oobCode) throw { code: "auth/invalid-action-code" }
    return verifyPasswordResetCode(getFirebaseAuth(), oobCode)
  }, [mode, oobCode])

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [pending, startTransition] = useTransition()

  if (check.loading) return <Skeleton className="h-56 w-full" />

  if (check.error || !check.data) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <AlertTitle>Link inválido</AlertTitle>
          <AlertDescription>
            Este link já foi usado, expirou ou está incompleto. Peça um novo em
            Minha conta › Trocar senha.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Ir para o login</Link>
        </Button>
      </div>
    )
  }

  if (done) {
    return (
      <div className="space-y-6">
        <Alert variant="success" role="status">
          <CircleCheckIcon aria-hidden />
          <AlertTitle>Senha alterada com sucesso!</AlertTitle>
          <AlertDescription>Agora é só entrar com a nova senha.</AlertDescription>
        </Alert>
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    )
  }

  const submit = () => {
    setError(null)
    if (password.length < 8) return setError("A senha precisa ter pelo menos 8 caracteres.")
    if (password !== confirm) return setError("As senhas não conferem.")
    startTransition(async () => {
      try {
        await confirmPasswordReset(getFirebaseAuth(), oobCode, password)
        setDone(true)
      } catch (cause) {
        setError(codeError((cause as { code?: string }).code))
      }
    })
  }

  return (
    <form
      noValidate
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
    >
      <p className="type-small text-muted-foreground">
        Conta: <strong className="font-medium text-foreground">{check.data}</strong>
      </p>

      {error ? (
        <Alert variant="destructive">
          <CircleAlertIcon aria-hidden />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-1.5">
        <Label htmlFor="nova-senha" className="type-small font-medium">
          Nova senha
        </Label>
        <div className="relative">
          <Input
            id="nova-senha"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            className="pr-11"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            aria-pressed={show}
            className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            {show ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
          </button>
        </div>
        <p className="type-caption text-muted-foreground">Mínimo de 8 caracteres.</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="confirmar-senha" className="type-small font-medium">
          Confirme a nova senha
        </Label>
        <Input
          id="confirmar-senha"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>

      <Button type="submit" size="lg" loading={pending}>
        Salvar nova senha
      </Button>
    </form>
  )
}
