/** Meses do ano. O mês de referência é sempre armazenado como número (1–12). */
export const MONTHS = [
  { value: 1, label: "Janeiro", short: "Jan" },
  { value: 2, label: "Fevereiro", short: "Fev" },
  { value: 3, label: "Março", short: "Mar" },
  { value: 4, label: "Abril", short: "Abr" },
  { value: 5, label: "Maio", short: "Mai" },
  { value: 6, label: "Junho", short: "Jun" },
  { value: 7, label: "Julho", short: "Jul" },
  { value: 8, label: "Agosto", short: "Ago" },
  { value: 9, label: "Setembro", short: "Set" },
  { value: 10, label: "Outubro", short: "Out" },
  { value: 11, label: "Novembro", short: "Nov" },
  { value: 12, label: "Dezembro", short: "Dez" },
] as const

export function monthLabel(month: number | null | undefined): string {
  return MONTHS.find((m) => m.value === month)?.label ?? ""
}
