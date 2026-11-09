import { z } from "zod"

import { onlyDigits } from "@/lib/utils/format"

export const SUBSCRIBER_STATUSES = ["active", "inactive"] as const

export const subscriberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Informe o nome completo.")
    .max(160, "O nome pode ter no máximo 160 caracteres."),
  address: z
    .string()
    .trim()
    .min(3, "Informe o endereço.")
    .max(300, "O endereço pode ter no máximo 300 caracteres."),
  phone: z
    .string()
    .refine((value) => {
      const length = onlyDigits(value).length
      return length === 0 || length === 10 || length === 11
    }, "Informe o telefone com DDD (10 ou 11 dígitos)."),
  area_id: z.uuid("Selecione uma área."),
  due_date: z.iso.date("Informe a data de vencimento."),
  reference_month: z
    .number("Selecione o mês de referência.")
    .int()
    .min(1, "Selecione o mês de referência.")
    .max(12, "Selecione o mês de referência."),
  observation: z
    .string()
    .trim()
    .max(2000, "As observações podem ter no máximo 2000 caracteres."),
  status: z.enum(SUBSCRIBER_STATUSES),
  label_enabled: z.boolean(),
})

export type SubscriberInput = z.infer<typeof subscriberSchema>
