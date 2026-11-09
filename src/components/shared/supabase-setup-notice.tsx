import { DatabaseIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/**
 * Exibido no lugar dos dados enquanto as variáveis do Supabase não estão
 * definidas. Nenhum dado fictício é mostrado.
 */
export function SupabaseSetupNotice({ className }: { className?: string }) {
  return (
    <Alert variant="warning" className={className}>
      <DatabaseIcon aria-hidden />
      <AlertTitle>Banco de dados ainda não conectado</AlertTitle>
      <AlertDescription>
        <p>
          Para carregar e salvar dados, crie o arquivo <code>.env.local</code> a
          partir de <code>.env.example</code>, preencha{" "}
          <code>NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code>, aplique as
          migrations de <code>supabase/migrations</code> e reinicie o servidor.
          O passo a passo está no <code>README.md</code>.
        </p>
      </AlertDescription>
    </Alert>
  )
}
