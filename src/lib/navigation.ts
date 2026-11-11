import {
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  MapPinIcon,
  NewspaperIcon,
  PaletteIcon,
  SettingsIcon,
  ShieldCheckIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

export type AdminNavItem = {
  label: string
  href: string
  icon: LucideIcon
  /** Módulo planejado, ainda não implementado: aparece desabilitado. */
  comingSoon?: boolean
}

export type AdminNavGroup = { label: string; items: AdminNavItem[] }

/**
 * Navegação do painel administrativo. Para adicionar um módulo, inclua um item
 * aqui — sidebar, menu móvel e breadcrumbs são gerados a partir desta lista.
 */
export const adminNavigation: AdminNavGroup[] = [
  {
    label: "Visão geral",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboardIcon },
    ],
  },
  {
    label: "Circulação",
    items: [
      { label: "Assinantes", href: "/admin/assinantes", icon: UsersIcon },
      { label: "Áreas", href: "/admin/areas", icon: MapPinIcon },
    ],
  },
  {
    label: "Redação",
    items: [
      { label: "Notícias", href: "/admin/noticias", icon: NewspaperIcon },
      {
        label: "Página inicial",
        href: "/admin/pagina-inicial",
        icon: LayoutTemplateIcon,
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      { label: "Equipe", href: "/admin/equipe", icon: ShieldCheckIcon },
      { label: "Guia de Estilo", href: "/admin/guia-de-estilo", icon: PaletteIcon },
      { label: "Configurações", href: "/admin/configuracoes", icon: SettingsIcon },
    ],
  },
]

/** Rótulos dos segmentos de URL usados nos breadcrumbs. */
export const adminSegmentLabels: Record<string, string> = {
  admin: "Painel",
  dashboard: "Dashboard",
  assinantes: "Assinantes",
  novo: "Novo assinante",
  etiquetas: "Etiquetas",
  areas: "Áreas",
  noticias: "Notícias",
  nova: "Nova notícia",
  "pagina-inicial": "Página inicial",
  equipe: "Equipe",
  "guia-de-estilo": "Guia de Estilo",
  configuracoes: "Configurações",
}
