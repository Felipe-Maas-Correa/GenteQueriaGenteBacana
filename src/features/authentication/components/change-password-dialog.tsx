"use client"

import { useState, useTransition } from "react"
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth"
import { EyeIcon, EyeOffIcon, KeyRoundIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getFirebaseAuth } from "@/lib/firebase/client"

import { sendResetEmail } from "../password-reset"

const MIN = 8

/** Trocar a senha dentro da plataforma: senha atual + nova senha. */
export function ChangePasswordDialog({ email }: { email: string }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [sendingEmail, startEmail] = useTransition()

  const reset = () => {
    setCurrent("")
    setNext("")
    setConfirm("")
    setShow(false)
    setError(null)
  }

  const submit = () => {
    setError(null)
    if (!current) return setError("Informe a senha atual.")
    if (next.length < MIN) return setError(`A nova senha precisa ter pelo menos ${MIN} caracteres.`)
    if (next !== confirm) return setError("As novas senhas não conferem.")
    if (next === current) return setError("A nova senha precisa ser diferente da atual.")
    startTransition(async () => {
      const user = getFirebaseAuth().currentUser
      if (!user) return setError("Sua sessão expirou. Entre de novo.")
      try {
        // O Firebase exige confirmar a senha atual antes de trocar.
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(email, current))
        await updatePassword(user, next)
        toast.success("Senha alterada com sucesso.")
        setOpen(false)
        reset()
      } catch (cause) {
        const code = (cause as { code?: string }).code
        setError(
          code === "auth/wrong-password" || code === "auth/invalid-credential"
            ? "A senha atual está incorreta."
            : code === "auth/weak-password"
              ? "Senha muito fraca. Misture letras e números."
              : code === "auth/too-many-requests"
                ? "Muitas tentativas. Aguarde alguns minutos."
                : "Não foi possível trocar a senha. Tente novamente."
        )
      }
    })
  }

  const forgot = () =>
    startEmail(async () => {
      const result = await sendResetEmail(email)
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })

  const type = show ? "text" : "password"

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (pending) return
        setOpen(value)
        if (!value) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <KeyRoundIcon aria-hidden />
          Trocar senha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form
          noValidate
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault()
            submit()
          }}
        >
          <DialogHeader>
            <DialogTitle>Trocar senha</DialogTitle>
            <DialogDescription>Confirme a senha atual e escolha a nova.</DialogDescription>
          </DialogHeader>

          {error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-1.5">
            <Label htmlFor="senha-atual">Senha atual</Label>
            <div className="relative">
              <Input
                id="senha-atual"
                type={type}
                autoComplete="current-password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className="pr-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((value) => !value)}
                aria-label={show ? "Ocultar senhas" : "Mostrar senhas"}
                aria-pressed={show}
                className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {show ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
              </button>
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="senha-nova">Nova senha</Label>
            <Input id="senha-nova" type={type} autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            <p className="type-caption text-muted-foreground">Mínimo de {MIN} caracteres.</p>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="senha-confirma">Confirme a nova senha</Label>
            <Input id="senha-confirma" type={type} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>

          <DialogFooter className="items-center sm:justify-between">
            <button
              type="button"
              onClick={forgot}
              disabled={sendingEmail}
              className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
            >
              {sendingEmail ? "Enviando…" : "Esqueci a senha atual"}
            </button>
            <Button type="submit" loading={pending}>
              Salvar nova senha
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
