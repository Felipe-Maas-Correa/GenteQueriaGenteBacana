import type { UserRole } from "@/types/database"

/** Rótulos dos papéis de acesso (espelham o enum `user_role` do banco). */
export const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  editor: "Editor",
  reader: "Leitor",
}

/** Papel válido a partir do banco; valores antigos ("pending") viram leitor. */
export function normalizeRole(value: unknown): UserRole {
  return value === "admin" || value === "editor" ? value : "reader"
}
