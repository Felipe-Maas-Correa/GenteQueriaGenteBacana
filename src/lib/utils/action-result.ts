/** Formato padronizado de retorno das Server Actions. */
export type ActionResult<TData = undefined> =
  | { ok: true; message: string; data?: TData }
  | {
      ok: false
      message: string
      fieldErrors?: Record<string, string[] | undefined>
    }

export function actionError(
  message: string,
  fieldErrors?: Record<string, string[] | undefined>
): { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> } {
  return { ok: false, message, fieldErrors }
}
