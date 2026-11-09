/**
 * Informações institucionais do portal.
 *
 * As editorias abaixo são uma estrutura inicial e devem ser confirmadas com os
 * responsáveis pelo jornal. Dados de contato, endereço e redes sociais ainda
 * não foram informados — por isso não aparecem no site.
 */
export const siteConfig = {
  name: "Gente Querida, Gente Bacana",
  shortName: "Gente Querida",
  description:
    "Portal de jornalismo regional: notícias, histórias e serviços da nossa comunidade.",
  locale: "pt-BR",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const

export const editorias = [
  { slug: "cidade", label: "Cidade" },
  { slug: "comunidade", label: "Comunidade" },
  { slug: "cultura", label: "Cultura" },
  { slug: "esporte", label: "Esporte" },
  { slug: "opiniao", label: "Opinião" },
] as const

export type EditoriaSlug = (typeof editorias)[number]["slug"]

export function editoriaLabel(slug: string): string {
  return editorias.find((e) => e.slug === slug)?.label ?? slug
}
