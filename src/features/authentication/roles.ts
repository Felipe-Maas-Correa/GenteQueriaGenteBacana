import type { UserRole } from "@/types/database"

/** Rótulos dos papéis de acesso (espelham o enum `user_role` do banco). */
export const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  editor: "Editor",
  pending: "Acesso pendente",
}
