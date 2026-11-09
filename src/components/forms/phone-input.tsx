"use client"

import { Input } from "@/components/ui/input"
import { formatPhone } from "@/lib/utils/format"

type PhoneInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type"
> & {
  value: string
  onChange: (value: string) => void
}

/** Campo de telefone com máscara brasileira aplicada durante a digitação. */
export function PhoneInput({ value, onChange, ...props }: PhoneInputProps) {
  return (
    <Input
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="(00) 00000-0000"
      maxLength={15}
      value={formatPhone(value)}
      onChange={(event) => onChange(formatPhone(event.target.value))}
      {...props}
    />
  )
}
