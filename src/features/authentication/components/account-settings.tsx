"use client"

import { useState, useTransition } from "react"
import { sendPasswordResetEmail, updateProfile as updateAuthProfile } from "firebase/auth"
import { KeyRoundIcon } from "lucide-react"
import { toast } from "sonner"

import { Field } from "@/components/forms/field"
import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/authentication/auth-context"
import { roleLabels } from "@/features/authentication/roles"
import { updateProfile } from "@/features/team/queries"
import { getFirebaseAuth } from "@/lib/firebase/client"

function ProfileCard() {
  const { status, user } = useAuth()
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const [saving, startSaving] = useTransition()
  const [sendingReset, startReset] = useTransition()

  if (status === "loading") return <Skeleton className="h-64 w-full" />
  if (status !== "authenticated" || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Seus dados</CardTitle>
          <CardDescription>
            Entre na sua conta para ver e editar seus dados.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const value = name ?? user.name
  const changed = value.trim() !== user.name

  const save = () => {
    const trimmed = value.trim()
    if (trimmed.length < 2) {
      setError("Informe seu nome (mínimo de 2 caracteres).")
      return
    }
    setError(undefined)
    startSaving(async () => {
      const result = await updateProfile(user.id, { name: trimmed })
      if (result.ok) {
        const authUser = getFirebaseAuth().currentUser
        if (authUser) await updateAuthProfile(authUser, { displayName: trimmed }).catch(() => {})
        setName(null)
        toast.success("Seus dados foram atualizados.")
      } else {
        toast.error(result.message)
      }
    })
  }

  const resetPassword = () =>
    startReset(async () => {
      try {
        await sendPasswordResetEmail(getFirebaseAuth(), user.email)
        toast.success(`Enviamos um link para ${user.email} para você criar uma nova senha.`)
      } catch {
        toast.error("Não foi possível enviar o e-mail. Tente novamente.")
      }
    })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus dados</CardTitle>
        <CardDescription>Como você aparece no painel e nas notícias.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault()
            save()
          }}
          noValidate
        >
          <Field label="Nome" required error={error}>
            {(field) => (
              <Input
                {...field}
                value={value}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            )}
          </Field>
          <Field label="E-mail" hint="O e-mail de acesso é alterado pela administração.">
            {(field) => <Input {...field} value={user.email} readOnly disabled />}
          </Field>
          <p className="type-small flex items-center justify-between">
            <span className="text-muted-foreground">Nível de acesso</span>
            <Badge variant="brand">{roleLabels[user.role]}</Badge>
          </p>
          <div className="flex flex-wrap gap-2 border-t pt-5">
            <Button type="submit" loading={saving} disabled={!changed}>
              Salvar dados
            </Button>
            <Button type="button" variant="outline" loading={sendingReset} onClick={resetPassword}>
              <KeyRoundIcon aria-hidden />
              Trocar senha
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** Página "Minha conta": dados do usuário e preferências pessoais. */
export function AccountSettings() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ProfileCard />
      <Card className="self-start">
        <CardHeader>
          <CardTitle>Aparência</CardTitle>
          <CardDescription>
            Por padrão, o site acompanha o tema do seu navegador. Escolha Claro ou
            Escuro para fixar. A escolha vale para este navegador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>
    </div>
  )
}
