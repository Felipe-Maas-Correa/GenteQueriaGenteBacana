import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const alertVariants = cva(
  "group/alert relative grid w-full gap-0.5 rounded-lg border px-4 py-3 text-left text-sm has-[>svg]:grid-cols-[auto_1fr] has-[>svg]:gap-x-3 *:[svg]:row-span-2 *:[svg]:translate-y-0.5 *:[svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        info: "border-info/25 bg-info-soft text-foreground *:[svg]:text-info",
        success:
          "border-success/25 bg-success-soft text-foreground *:[svg]:text-success",
        warning:
          "border-warning/30 bg-warning-soft text-foreground *:[svg]:text-warning",
        destructive:
          "border-destructive/25 bg-destructive-soft text-foreground *:[svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Alert({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "font-semibold group-has-[>svg]/alert:col-start-2",
        className
      )}
      {...props}
    />
  )
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-sm text-pretty text-foreground/80 group-has-[>svg]/alert:col-start-2 [&_a]:font-medium [&_a]:underline [&_a]:underline-offset-3 [&_code]:rounded-sm [&_code]:bg-foreground/8 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.8125rem]",
        className
      )}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
