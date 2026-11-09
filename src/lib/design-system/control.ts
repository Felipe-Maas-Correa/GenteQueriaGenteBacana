/**
 * Aparência compartilhada pelos campos de formulário (input, select, textarea,
 * combobox). Centralizada aqui para que todos os campos mudem juntos.
 */
export const controlBase =
  "w-full min-w-0 rounded-lg border border-input bg-card text-base text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] duration-(--duration-fast) ease-standard placeholder:text-muted-foreground/80 hover:border-foreground/35 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 md:text-sm"

export const controlSizing = "h-(--control-h) px-(--control-px)"
