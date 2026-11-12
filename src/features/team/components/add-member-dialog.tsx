"use client"

import { useState, useTransition } from "react"
import { CheckCircle2Icon, EyeIcon, EyeOffIcon, UserPlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
import { cn } from "@/lib/utils"

import { addTeamMember, MIN_PASSWORD } from "../add-member"

type Role = "admin" | "editor"

const roles: { value: Role; title: string; description: string }[] = [
  { value: "admin", title: "Administrador", description: "Tudo, inclusive editorias e equipe." },
  { value: "editor", title: "Editor", description: "Notícias, página inicial, assinantes e áreas." },
]

type Result = { message: string; existed: boolean; email: string }

/** Botão "Adicionar membro": cria a conta já com papel e senha inicial. */
export function AddMemberDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>("admin")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [pending, startTransition] = useTransition()

  const reset = () => {
    setName("")
    setEmail("")
    setPassword("")
    setConfirm("")
    setShowPassword(false)
    setRole("admin")
    setError(null)
    setResult(null)
  }

  const submit = () => {
    setError(null)
    if (name.trim().length < 2) return setError("Informe o nome.")
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Informe um e-mail válido.")
    if (password.length < MIN_PASSWORD) {
      return setError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`)
    }
    if (password !== confirm) return setError("As senhas não conferem.")
    startTransition(async () => {
      const outcome = await addTeamMember({ name, email, role, password })
      if (!outcome.ok) return setError(outcome.message)
      setResult({ message: outcome.message, existed: outcome.data?.existed ?? false, email: email.trim() })
      toast.success(outcome.message)
      onAdded()
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return
        setOpen(next)
        if (!next) reset()
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <UserPlusIcon aria-hidden />
          Adicionar membro
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        {result ? (
          <>
            <DialogHeader>
              <DialogTitle>{result.existed ? "Papel atualizado" : "Membro cadastrado"}</DialogTitle>
              <DialogDescription>{result.message}</DialogDescription>
            </DialogHeader>
            {result.existed ? null : (
              <Alert variant="success">
                <CheckCircle2Icon aria-hidden />
                <AlertTitle>Próximo passo</AlertTitle>
                <AlertDescription>
                  Envie para a pessoa o e-mail <strong>{result.email}</strong> e a senha que
                  você definiu. Ela entra pelo site e pode trocar a senha em Minha conta ›
                  Trocar senha.
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>
                Cadastrar outra pessoa
              </Button>
              <Button onClick={() => (setOpen(false), reset())}>Concluir</Button>
            </DialogFooter>
          </>
        ) : (
          <form
            noValidate
            className="grid gap-5"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <DialogHeader>
              <DialogTitle>Adicionar membro da equipe</DialogTitle>
              <DialogDescription>
                Você define a senha inicial; a pessoa pode trocá-la depois em Minha conta.
                Se o e-mail já tiver conta, só o papel é alterado.
              </DialogDescription>
            </DialogHeader>

            {error ? (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid gap-1.5">
              <Label htmlFor="membro-nome">Nome</Label>
              <Input id="membro-nome" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" autoFocus />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="membro-email">E-mail</Label>
              <Input
                id="membro-email"
                type="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                placeholder="pessoa@exemplo.com.br"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="membro-senha">Senha inicial</Label>
                <div className="relative">
                  <Input
                    id="membro-senha"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    aria-pressed={showPassword}
                    className="absolute top-1/2 right-2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {showPassword ? <EyeOffIcon className="size-4" aria-hidden /> : <EyeIcon className="size-4" aria-hidden />}
                  </button>
                </div>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="membro-senha2">Confirme a senha</Label>
                <Input
                  id="membro-senha2"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <p className="type-caption -mt-2 text-muted-foreground sm:col-span-2">
                Mínimo de {MIN_PASSWORD} caracteres.
              </p>
            </div>

            <fieldset className="grid gap-2">
              <legend className="mb-1.5 text-sm font-medium">Papel</legend>
              {roles.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/40",
                    role === option.value ? "border-foreground bg-muted" : "hover:border-foreground/30"
                  )}
                >
                  <input
                    type="radio"
                    name="membro-papel"
                    value={option.value}
                    checked={role === option.value}
                    onChange={() => setRole(option.value)}
                    className="mt-1 accent-[var(--azul)]"
                  />
                  <span>
                    <span className="block text-sm font-medium">{option.title}</span>
                    <span className="block text-xs text-muted-foreground">{option.description}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <DialogFooter>
              <Button type="button" variant="ghost" disabled={pending} onClick={() => (setOpen(false), reset())}>
                Cancelar
              </Button>
              <Button type="submit" loading={pending}>
                Cadastrar membro
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
