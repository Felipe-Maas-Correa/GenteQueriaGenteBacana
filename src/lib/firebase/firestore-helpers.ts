import { Timestamp } from "firebase/firestore"

/** Converte um Timestamp do Firestore em ISO string (ou "" quando ausente). */
export function tsToISO(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  return ""
}

/**
 * O SDK do Firestore tenta reconectar indefinidamente quando o banco não
 * existe ou está fora do ar. Use em operações que não podem travar a tela.
 */
export function withTimeout<T>(promise: Promise<T>, ms = 8000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "timeout" })), ms)
    ),
  ])
}

/** Traduz erros comuns do Firestore em mensagens para o usuário. */
export function firestoreErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code
  switch (code) {
    case "permission-denied":
      return "Você não tem permissão para realizar esta ação."
    case "timeout":
      return "O banco de dados não respondeu. Verifique se o Firestore foi criado no projeto Firebase."
    case "unavailable":
      return "Serviço indisponível no momento. Tente novamente."
    case "failed-precondition":
      return "A consulta precisa de um índice que ainda não existe no Firestore."
    default:
      return "Não foi possível concluir. Tente novamente."
  }
}
