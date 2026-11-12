"use client"

import { useRef, useState, useTransition } from "react"
import { updateProfile as updateAuthProfile } from "firebase/auth"
import { CameraIcon } from "lucide-react"
import { toast } from "sonner"

import { Field } from "@/components/forms/field"
import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import { UserAvatar } from "@/components/shared/user-avatar"
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
import { ChangePasswordDialog } from "@/features/authentication/components/change-password-dialog"
import { roleLabels } from "@/features/authentication/roles"
import { updateProfile } from "@/features/team/queries"
import { InvoicesPanel } from "@/features/billing/components/invoices-panel"
import { SubscribeCallout } from "@/features/billing/components/subscribe-callout"
import { SubscriptionPanel } from "@/features/billing/components/subscription-panel"
import { getFirebaseAuth } from "@/lib/firebase/client"
import { uploadImage } from "@/lib/images/upload"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function ProfileCard() {
  const { status, user } = useAuth()
  const [name, setName] = useState<string | null>(null)
  const [error, setError] = useState<string>()
  const [saving, startSaving] = useTransition()
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const photoInput = useRef<HTMLInputElement>(null)

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

  const changePhoto = async (file: File | undefined) => {
    if (!file) return
    setUploadingPhoto(true)
    const upload = await uploadImage(file, "avatar")
    if (upload.ok && upload.data) {
      const saved = await updateProfile(user.id, { photo_url: upload.data.url })
      if (saved.ok) toast.success("Foto de perfil atualizada.")
      else toast.error(saved.message)
    } else {
      toast.error(upload.message)
    }
    setUploadingPhoto(false)
    if (photoInput.current) photoInput.current.value = ""
  }

  const removePhoto = async () => {
    setUploadingPhoto(true)
    const saved = await updateProfile(user.id, { photo_url: "" })
    setUploadingPhoto(false)
    if (saved.ok) toast.success("Foto removida.")
    else toast.error(saved.message)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seus dados</CardTitle>
        <CardDescription>Como você aparece no painel e nas notícias.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex items-center gap-4">
          <UserAvatar name={user.name} photoUrl={user.photoUrl} className="size-20 text-2xl" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Foto de perfil</p>
            <div className="flex flex-wrap gap-2">
              <input
                ref={photoInput}
                type="file"
                accept="image/*"
                className="sr-only"
                aria-label="Escolher foto de perfil"
                onChange={(event) => changePhoto(event.target.files?.[0])}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                loading={uploadingPhoto}
                onClick={() => photoInput.current?.click()}
              >
                <CameraIcon aria-hidden />
                {user.photoUrl ? "Trocar foto" : "Enviar foto"}
              </Button>
              {user.photoUrl ? (
                <Button type="button" size="sm" variant="ghost" disabled={uploadingPhoto} onClick={removePhoto}>
                  Remover
                </Button>
              ) : null}
            </div>
            <p className="type-caption text-muted-foreground">
              Do computador ou da galeria do celular. A foto é recortada em quadrado.
            </p>
          </div>
        </div>

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
            <ChangePasswordDialog email={user.email} />
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

/** Página "Minha conta": perfil, assinatura e faturas. */
export function AccountSettings() {
  const { status } = useAuth()
  const [tab, setTab] = useState("perfil")

  return (
    <Tabs value={tab} onValueChange={setTab} className="gap-6">
      <TabsList>
        <TabsTrigger value="perfil">Perfil</TabsTrigger>
        <TabsTrigger value="assinatura" disabled={status !== "authenticated"}>
          Assinatura
        </TabsTrigger>
        <TabsTrigger value="faturas" disabled={status !== "authenticated"}>
          Faturas
        </TabsTrigger>
      </TabsList>

      <TabsContent value="perfil">
        <div className="grid gap-4 lg:grid-cols-2">
          <ProfileCard />
          <div className="space-y-4 self-start">
            <Card>
              <CardHeader>
                <CardTitle>Aparência</CardTitle>
                <CardDescription>
                  Por padrão, o site acompanha o tema do seu navegador. Escolha Claro
                  ou Escuro para fixar. A escolha vale para este navegador.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeSwitcher />
              </CardContent>
            </Card>
            {/* Chamada para assinar: some depois que a pessoa assina. */}
            {status === "authenticated" ? (
              <SubscribeCallout
                onSubscribe={() => {
                  setTab("assinatura")
                  window.scrollTo({ top: 0, behavior: "smooth" })
                }}
              />
            ) : null}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="assinatura">
        <SubscriptionPanel />
      </TabsContent>

      <TabsContent value="faturas">
        <InvoicesPanel />
      </TabsContent>
    </Tabs>
  )
}
