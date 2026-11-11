/**
 * Informações institucionais do portal.
 *
 * As editorias (menu do site) ficam no banco e são geridas no painel, em
 * Redação › Editorias. Dados de contato, endereço e redes sociais ainda não
 * foram informados — por isso não aparecem no site.
 */
export const siteConfig = {
  name: "Gente Querida, Gente Bacana",
  shortName: "Gente Querida",
  description:
    "Portal de jornalismo regional: notícias, histórias e serviços da nossa comunidade.",
  locale: "pt-BR",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const
