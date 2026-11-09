import { z } from "zod"

export const areaSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome da área (mínimo de 2 caracteres).")
    .max(80, "O nome pode ter no máximo 80 caracteres."),
  description: z
    .string()
    .trim()
    .max(300, "A descrição pode ter no máximo 300 caracteres."),
})

export type AreaInput = z.infer<typeof areaSchema>
