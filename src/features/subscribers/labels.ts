/**
 * Modelos de folha de etiquetas (todas as medidas em milímetros, papel A4).
 * Para suportar outro modelo de folha, basta acrescentar um item a esta lista.
 */
export type LabelTemplate = {
  id: string
  name: string
  columns: number
  rows: number
  labelWidth: number
  labelHeight: number
  marginTop: number
  marginLeft: number
  columnGap: number
  rowGap: number
}

export const PAGE_WIDTH_MM = 210
export const PAGE_HEIGHT_MM = 297

export const labelTemplates: LabelTemplate[] = [
  {
    id: "a4-21",
    name: "21 por folha — 63,5 × 38,1 mm",
    columns: 3,
    rows: 7,
    labelWidth: 63.5,
    labelHeight: 38.1,
    marginTop: 15.15,
    marginLeft: 7.25,
    columnGap: 2.5,
    rowGap: 0,
  },
  {
    id: "a4-14",
    name: "14 por folha — 99,1 × 38,1 mm",
    columns: 2,
    rows: 7,
    labelWidth: 99.1,
    labelHeight: 38.1,
    marginTop: 15.15,
    marginLeft: 4.65,
    columnGap: 2.5,
    rowGap: 0,
  },
  {
    id: "a4-24",
    name: "24 por folha — 70 × 37 mm",
    columns: 3,
    rows: 8,
    labelWidth: 70,
    labelHeight: 37,
    marginTop: 0.5,
    marginLeft: 0,
    columnGap: 0,
    rowGap: 0,
  },
]

export const labelFields = [
  { id: "name", label: "Nome" },
  { id: "address", label: "Endereço" },
  { id: "phone", label: "Telefone" },
  { id: "area", label: "Área" },
  { id: "dueDate", label: "Vencimento" },
  { id: "referenceMonth", label: "Mês de referência" },
] as const

export type LabelFieldId = (typeof labelFields)[number]["id"]

export const defaultLabelFields: LabelFieldId[] = ["name", "address", "area"]

/** Distribui os itens em folhas, pulando as primeiras `skip` posições da 1ª folha. */
export function paginateLabels<T>(
  items: T[],
  perPage: number,
  skip: number
): (T | null)[][] {
  const slots: (T | null)[] = [
    ...Array.from({ length: skip }, () => null),
    ...items,
  ]
  const pages: (T | null)[][] = []
  for (let index = 0; index < slots.length; index += perPage) {
    pages.push(slots.slice(index, index + perPage))
  }
  return pages
}
