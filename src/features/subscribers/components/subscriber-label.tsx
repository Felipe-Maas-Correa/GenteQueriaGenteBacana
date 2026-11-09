import { formatDate, formatPhone } from "@/lib/utils/format"
import { monthLabel } from "@/lib/utils/months"

import type { LabelFieldId } from "../labels"
import type { SubscriberListItem } from "../queries"

type SubscriberLabelProps = {
  subscriber: SubscriberListItem
  fields: ReadonlySet<LabelFieldId>
}

/**
 * Conteúdo de uma etiqueta. Usa unidades de impressão (pt/mm) e cores fixas
 * em preto, pois o destino é o papel — não a interface.
 */
export function SubscriberLabel({ subscriber, fields }: SubscriberLabelProps) {
  const phone = formatPhone(subscriber.phone)
  const meta = [
    fields.has("area") && subscriber.area
      ? { key: "area", term: "Área", value: subscriber.area.name }
      : null,
    fields.has("phone") && phone
      ? { key: "phone", term: "Tel.", value: phone }
      : null,
    fields.has("dueDate")
      ? { key: "due", term: "Venc.", value: formatDate(subscriber.due_date) }
      : null,
    fields.has("referenceMonth")
      ? {
          key: "month",
          term: "Ref.",
          value: monthLabel(subscriber.reference_month),
        }
      : null,
  ].filter((entry) => entry !== null)

  return (
    <div
      className="flex h-full w-full flex-col justify-center overflow-hidden font-sans text-black"
      style={{ padding: "2.5mm 4mm", gap: "0.8mm" }}
    >
      {fields.has("name") ? (
        <p
          className="line-clamp-2 font-semibold"
          style={{ fontSize: "10.5pt", lineHeight: 1.15 }}
        >
          {subscriber.name}
        </p>
      ) : null}
      {fields.has("address") ? (
        <p className="line-clamp-3" style={{ fontSize: "8.5pt", lineHeight: 1.2 }}>
          {subscriber.address}
        </p>
      ) : null}
      {meta.length > 0 ? (
        <dl
          className="flex flex-wrap"
          style={{
            fontSize: "7pt",
            lineHeight: 1.25,
            columnGap: "2.5mm",
            marginTop: "0.6mm",
            paddingTop: "0.9mm",
            borderTop: "0.2mm solid #000",
          }}
        >
          {meta.map((entry) => (
            <div key={entry.key} className="flex whitespace-nowrap" style={{ gap: "0.8mm" }}>
              <dt className="font-semibold uppercase" style={{ letterSpacing: "0.04em" }}>
                {entry.term}
              </dt>
              <dd>{entry.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  )
}
