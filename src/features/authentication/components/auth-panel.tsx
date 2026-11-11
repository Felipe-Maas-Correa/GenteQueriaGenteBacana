"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { LoginForm } from "./login-form"
import { SignUpForm } from "./signup-form"

/** Abas "Entrar" e "Criar conta". `?modo=cadastro` abre direto no cadastro. */
export function AuthPanel({ disabled = false }: { disabled?: boolean }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const mode = searchParams.get("modo") === "cadastro" ? "cadastro" : "entrar"

  return (
    <Tabs
      value={mode}
      onValueChange={(next) => {
        const params = new URLSearchParams(searchParams)
        if (next === "cadastro") params.set("modo", "cadastro")
        else params.delete("modo")
        const query = params.toString()
        router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
      }}
      className="gap-6"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="entrar">Entrar</TabsTrigger>
        <TabsTrigger value="cadastro">Criar conta</TabsTrigger>
      </TabsList>

      <TabsContent value="entrar" className="space-y-4">
        <LoginForm disabled={disabled} />
      </TabsContent>

      <TabsContent value="cadastro" className="space-y-4">
        <p className="type-small text-muted-foreground">
          Crie sua conta de leitor para acompanhar as notícias do jornal.
        </p>
        <SignUpForm disabled={disabled} />
      </TabsContent>
    </Tabs>
  )
}
