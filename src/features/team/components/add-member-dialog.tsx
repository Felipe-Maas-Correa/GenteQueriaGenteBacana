"use client"

import { useState, useTransition } from "react"
import { CheckIcon, CopyIcon, MailCheckIcon, UserPlusIcon } from "lucide-react"
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
import { getFirebaseAuth } from "@/lib/firebase/client"
import { cn } from "@/lib/utils"

type Role = "admin" | "editor"

const roles: { value: Role; title: string; description: string }[] = [
  { value: "admin", title: "Administrador", description: "Tudo, inclusive editorias e equipe." },
  { value: "editor", title: "Editor", description: "Notícias, página inicial, assinantes e áreas." },
]

type Result = { message: string; link?: string; emailSent?: boolean; existed?: boolean }

/** Botão "Adicionar membro": cria a conta e envia o convite para criar a senha. */
export function AddMemberDialog({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("admin")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const reset = () => {
    setName("")
    setEmail("")
    setRole("admin")
    setError(null)
    setResult(null)
    setCopied(false)
  }

  const submit = () => {
    setError(null)
    if (name.trim().length < 2) return setError("Informe o nome.")
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError("Informe um e-mail válido.")
    startTransition(async () => {
      try {
        const token = await getFirebaseAuth().currentUser?.getIdToken()
        if (!token) return setError("Sua sessão expirou. Faça login novamente.")
        const response = await fetch("/api/equipe", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), role }),
        })
        const body = (await response.json().catch(() => ({}))) as Result & { ok?: boolean }
        if (!response.ok || !body.ok) {
          return setError(body.message ?? "Não foi possível cadastrar. Tente novamente.")
        }
        setResult(body)
        toast.success(body.message)
        onAdded()
      } catch {
        setError("Falha de conexão. Tente novamente.")
      }
    })
  }

  const copyLink = async () => {
    if (!result?.link) return
    await navigator.clipboard.writeText(result.link)
    setCopied(true)
    toast.success("Link copiado.")
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

            {result.link ? (
              <Alert variant={result.emailSent ? "success" : "warning"}>
                <MailCheckIcon aria-hidden />
                <AlertTitle>
                  {result.emailSent ? "Convite enviado por e-mail" : "Envie o link manualmente"}
                </AlertTitle>
                <AlertDescription>
                  {result.emailSent
                    ? "Se não chegar (veja o spam), copie o link abaixo e mande por WhatsApp."
                    : "Mande este link para a pessoa criar a senha. Ele vale por 1 hora."}
                </AlertDescription>
              </Alert>
            ) : null}

            {result.link ? (
              <Button variant="outline" onClick={copyLink}>
                {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />}
                {copied ? "Link copiado" : "Copiar link de criação de senha"}
              </Button>
            ) : null}

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
                A pessoa recebe um e-mail para criar a própria senha. Se ela já tiver
                conta de leitor, só o papel é alterado.
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
                Cadastrar e enviar convite
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
