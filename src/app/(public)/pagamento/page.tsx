import type { Metadata } from "next"
import { Suspense } from "react"

import { PaymentCheckoutFromQuery } from "@/features/billing/components/payment-checkout"

export const metadata: Metadata = {
  title: "Pagamento",
  robots: { index: false, follow: false },
}

/** Pagamento de uma fatura: /pagamento?fatura=… (dados vêm do Firestore no navegador). */
export default function PaymentPage() {
  return (
    <Suspense>
      <PaymentCheckoutFromQuery />
    </Suspense>
  )
}
