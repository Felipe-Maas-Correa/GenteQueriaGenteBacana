import { z } from "zod"

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
})

export type LoginInput = z.infer<typeof loginSchema>

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120, "Nome muito longo."),
    email: z.email("Informe um e-mail válido."),
    password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
    confirm: z.string(),
  })
  .refine((data) => data.password === data.confirm, {
    path: ["confirm"],
    message: "As senhas não conferem.",
  })

export type SignUpInput = z.infer<typeof signUpSchema>
