"use client"

import { useEffect, useRef, useState } from "react"
import { PrinterIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { formatNumber } from "@/lib/utils/format"

import {
  defaultLabelFields,
  labelFields,
  labelTemplates,
  PAGE_HEIGHT_MM,
  PAGE_WIDTH_MM,
  paginateLabels,
  type LabelFieldId,
} from "../labels"
import type { SubscriberListItem } from "../queries"
import { SubscriberLabel } from "./subscriber-label"

const MM_TO_PX = 96 / 25.4

/** Escala a prévia para caber na largura disponível (apenas na tela). */
function usePreviewScale() {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const available = entry.contentRect.width
      setScale(Math.min(1, available / (PAGE_WIDTH_MM * MM_TO_PX)))
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, scale] as const
}

/**
 * Configuração e prévia das folhas de etiquetas. Na impressão, apenas as
 * folhas são enviadas ao papel (todo o restante usa `print:hidden`).
 */
export function LabelSheet({ subscribers }: { subscribers: SubscriberListItem[] }) {
  const [templateId, setTemplateId] = useState(labelTemplates[0].id)
  const [fields, setFields] = useState<ReadonlySet<LabelFieldId>>(
    () => new Set(defaultLabelFields)
  )
  const [skip, setSkip] = useState(0)
  const [printOutlines, setPrintOutlines] = useState(false)
  const [previewRef, scale] = usePreviewScale()

  const template =
    labelTemplates.find((item) => item.id === templateId) ?? labelTemplates[0]
  const perPage = template.columns * template.rows
  const safeSkip = Math.min(skip, perPage - 1)
  const pages = paginateLabels(subscribers, perPage, safeSkip)

  const toggleField = (id: LabelFieldId, checked: boolean) => {
    setFields((current) => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[19rem_1fr] print:block">
      {/* Página A4 sem margens: as margens vêm do modelo de etiqueta. */}
      <style>{`@page { size: A4 portrait; margin: 0; }`}</style>

      <aside className="h-fit space-y-6 rounded-xl border bg-card p-5 lg:sticky lg:top-[calc(var(--topbar-h)+1.5rem)] print:hidden">
        <fieldset className="space-y-3">
          <legend className="type-overline text-muted-foreground">
            Informações na etiqueta
          </legend>
          {labelFields.map((field) => (
            <div key={field.id} className="flex items-center gap-2.5">
              <Checkbox
                id={`label-field-${field.id}`}
                checked={fields.has(field.id)}
                onCheckedChange={(checked) =>
                  toggleField(field.id, checked === true)
                }
              />
              <Label htmlFor={`label-field-${field.id}`} className="font-normal">
                {field.label}
              </Label>
            </div>
          ))}
        </fieldset>

        <div className="space-y-1.5">
          <Label htmlFor="label-template" className="type-overline text-muted-foreground">
            Modelo da folha (A4)
          </Label>
          <Select value={templateId} onValueChange={setTemplateId}>
            <SelectTrigger id="label-template">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {labelTemplates.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="label-start" className="type-overline text-muted-foreground">
            Começar na posição
          </Label>
          <Input
            id="label-start"
            type="number"
            inputMode="numeric"
            min={1}
            max={perPage}
            value={safeSkip + 1}
            onChange={(event) => {
              const value = Number(event.target.value)
              if (Number.isInteger(value)) {
                setSkip(Math.min(perPage - 1, Math.max(0, value - 1)))
              }
            }}
          />
          <p className="type-caption font-normal text-muted-foreground">
            Útil para reaproveitar uma folha já usada: as posições anteriores
            ficam em branco.
          </p>
        </div>

        <label
          htmlFor="label-outlines"
          className="flex cursor-pointer items-center justify-between gap-3"
        >
          <span className="type-small">Imprimir contorno das etiquetas</span>
          <Switch
            id="label-outlines"
            checked={printOutlines}
            onCheckedChange={setPrintOutlines}
          />
        </label>

        <div className="space-y-2 border-t pt-5">
          <Button
            className="w-full"
            size="lg"
            onClick={() => window.print()}
            disabled={subscribers.length === 0 || fields.size === 0}
          >
            <PrinterIcon aria-hidden />
            Imprimir etiquetas
          </Button>
          <p className="type-caption font-normal text-muted-foreground">
            {formatNumber(subscribers.length)} etiqueta
            {subscribers.length === 1 ? "" : "s"} em {formatNumber(pages.length)}{" "}
            folha{pages.length === 1 ? "" : "s"}. Na janela de impressão, use
            papel A4, escala 100% e margens “Nenhuma”.
          </p>
          {fields.size === 0 ? (
            <p className="type-caption text-destructive" role="alert">
              Selecione ao menos uma informação para a etiqueta.
            </p>
          ) : null}
        </div>
      </aside>

      <div
        ref={previewRef}
        className="min-w-0 space-y-6 print:space-y-0"
        aria-label="Prévia das folhas de etiquetas"
      >
        {pages.map((page, pageIndex) => (
          <div
            key={pageIndex}
            className="print:h-auto! print:w-auto!"
            // Reserva na tela o espaço da folha já escalada.
            style={{
              height: `${PAGE_HEIGHT_MM * MM_TO_PX * scale}px`,
              width: `${PAGE_WIDTH_MM * MM_TO_PX * scale}px`,
            }}
          >
            <div
              className="relative origin-top-left overflow-hidden bg-white shadow-md ring-1 ring-black/10 print:transform-none! print:shadow-none print:ring-0"
              style={{
                width: `${PAGE_WIDTH_MM}mm`,
                height: `${PAGE_HEIGHT_MM}mm`,
                transform: `scale(${scale})`,
                breakAfter: pageIndex < pages.length - 1 ? "page" : "auto",
                breakInside: "avoid",
              }}
            >
              <div
                className="absolute grid"
                style={{
                  top: `${template.marginTop}mm`,
                  left: `${template.marginLeft}mm`,
                  gridTemplateColumns: `repeat(${template.columns}, ${template.labelWidth}mm)`,
                  gridAutoRows: `${template.labelHeight}mm`,
                  columnGap: `${template.columnGap}mm`,
                  rowGap: `${template.rowGap}mm`,
                }}
              >
                {Array.from({ length: perPage }, (_, slot) => {
                  const subscriber = page[slot] ?? null
                  return (
                    <div
                      key={slot}
                      data-print-outline={printOutlines || undefined}
                      className="overflow-hidden rounded-[1.5mm] outline-1 -outline-offset-1 outline-black/15 outline-dashed print:outline-none data-print-outline:print:outline-solid data-print-outline:print:outline-black/40"
                    >
                      {subscriber ? (
                        <SubscriberLabel subscriber={subscriber} fields={fields} />
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
