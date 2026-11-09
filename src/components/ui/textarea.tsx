import * as React from "react"

import { controlBase } from "@/lib/design-system/control"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        controlBase,
        "flex field-sizing-content min-h-24 px-(--control-px) py-2.5 leading-relaxed",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
