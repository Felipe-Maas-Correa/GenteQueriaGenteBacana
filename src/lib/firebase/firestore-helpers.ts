import { Timestamp } from "firebase/firestore"

/** Converte um Timestamp do Firestore em ISO string (ou "" quando ausente). */
export function tsToISO(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return ""
}

/** Traduz erros comuns do Firestore em mensagens para o usuário. */
export function firestoreErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code
  switch (code) {
    case "permission-denied":
      return "Você não tem permissão para realizar esta ação."
    case "unavailable":
      return "Serviço indisponível no momento. Tente novamente."
    case "failed-precondition":
      return "A consulta precisa de um índice que ainda não existe no Firestore."
    default:
      return "Não foi possível concluir. Tente novamente."
  }
}
