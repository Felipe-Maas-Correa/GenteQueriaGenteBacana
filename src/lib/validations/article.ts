import { z } from "zod"

export const CARD_SIZES = ["hero", "large", "small"] as const

export const cardSizeLabels: Record<(typeof CARD_SIZES)[number], string> = {
  hero: "Manchete",
  large: "Grande",
  small: "Pequeno",
}

export const cardSizeHints: Record<(typeof CARD_SIZES)[number], string> = {
  hero: "Ocupa a largura toda, com título enorme.",
  large: "Dois terços da linha.",
  small: "Um terço da linha.",
}

export const articleSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Informe o título (mínimo de 5 caracteres).")
    .max(180, "O título pode ter no máximo 180 caracteres."),
  slug: z
    .string()
    .trim()
    .min(3, "Informe o endereço da notícia.")
    .max(120, "O endereço pode ter no máximo 120 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Use apenas letras minúsculas, números e hífens."
    ),
  excerpt: z
    .string()
    .trim()
    .max(400, "A linha fina pode ter no máximo 400 caracteres."),
  body: z.string().trim().max(100_000, "O texto está longo demais."),
  editoria: z.string().min(1, "Selecione a editoria."),
  author: z.string().trim().max(120, "Máximo de 120 caracteres."),
  kicker: z
    .string()
    .trim()
    .max(40, "O chapéu pode ter no máximo 40 caracteres."),
  kicker_tone: z.enum(["default", "urgent"]),
  image_url: z
    .string()
    .trim()
    .refine(
      // Endereço externo (https://…) ou foto enviada pelo painel (/api/imagens/…).
      (value) =>
        value === "" ||
        /^https?:\/\//.test(value) ||
        /^\/api\/imagens\/[A-Za-z0-9]+$/.test(value),
      "Informe um endereço de imagem válido (https://…) ou use Enviar foto."
    ),
  image_caption: z
    .string()
    .trim()
    .max(240, "A legenda pode ter no máximo 240 caracteres."),
  /** Fotos extras da capa (carrossel); a primeira foto continua em image_url. */
  gallery: z
    .array(
      z.string().refine(
        (value) => /^https?:\/\//.test(value) || /^\/api\/imagens\/[A-Za-z0-9]+$/.test(value),
        "Foto inválida."
      )
    )
    .max(12, "Use no máximo 12 fotos na capa."),
  access: z.enum(["public", "partial", "subscribers"]),
  status: z.enum(["draft", "published"]),
  /**
   * Data/hora de publicação (campo datetime-local, no fuso do navegador).
   * Vazio = agora. No futuro = notícia agendada.
   */
  publish_at: z
    .string()
    .refine(
      (value) => value === "" || !Number.isNaN(new Date(value).getTime()),
      "Informe uma data e hora válidas."
    ),
  on_home: z.boolean(),
  card_size: z.enum(CARD_SIZES),
  show_image: z.boolean(),
  show_excerpt: z.boolean(),
})

export type ArticleInput = z.infer<typeof articleSchema>

/** ISO → valor do campo datetime-local (no fuso do navegador). */
export function isoToLocalInput(iso: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  const offset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

/** Gera um endereço amigável a partir do título. */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)
    .replace(/-+$/g, "")
}
