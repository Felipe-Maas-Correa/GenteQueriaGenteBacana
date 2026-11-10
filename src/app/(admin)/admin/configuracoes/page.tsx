import type { Metadata } from "next"
import { CheckCircle2Icon, CircleAlertIcon } from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { ThemeSwitcher } from "@/components/shared/theme-switcher"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AccountInfo } from "@/features/authentication/components/account-info"
import { isFirebaseConfigured } from "@/lib/firebase/config"
import { siteConfig } from "@/lib/site"
import { APP_TIME_ZONE } from "@/lib/utils/format"

import packageJson from "../../../../../package.json"

export const metadata: Metadata = { title: "Configurações" }

function InfoRow({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
      <dt className="type-small text-muted-foreground">{term}</dt>
      <dd className="type-small font-medium">{children}</dd>
    </div>
  )
}

export default function SettingsPage() {
  const configured = isFirebaseConfigured()

  return (
    <div className="space-y-6">
      <PageHeader
        overline="Sistema"
        title="Configurações"
        description="Informações do sistema e preferências de interface."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informações do sistema</CardTitle>
            <CardDescription>Dados básicos desta instalação.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y">
              <InfoRow term="Nome do portal">{siteConfig.name}</InfoRow>
              <InfoRow term="Versão">{packageJson.version}</InfoRow>
              <InfoRow term="Fuso horário">{APP_TIME_ZONE}</InfoRow>
              <InfoRow term="Banco de dados">
                {configured ? (
                  <Badge variant="success">
                    <CheckCircle2Icon aria-hidden />
                    Firebase conectado
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <CircleAlertIcon aria-hidden />
                    Não configurado
                  </Badge>
                )}
              </InfoRow>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sua conta</CardTitle>
            <CardDescription>
              Dados do usuário conectado. Alterações de acesso são feitas pela
              administração.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccountInfo />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Preferências de interface</CardTitle>
            <CardDescription>
              O tema escolhido fica salvo neste navegador.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
