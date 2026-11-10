import { DatabaseIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

/**
 * Exibido no lugar dos dados enquanto as variáveis do Firebase não estão
 * definidas. Nenhum dado fictício é mostrado.
 */
export function SetupNotice({ className }: { className?: string }) {
  return (
    <Alert variant="warning" className={className}>
      <DatabaseIcon aria-hidden />
      <AlertTitle>Firebase ainda não conectado</AlertTitle>
      <AlertDescription>
        <p>
          Para carregar e salvar dados, crie o arquivo <code>.env.local</code> a
          partir de <code>.env.example</code>, preencha as variáveis{" "}
          <code>NEXT_PUBLIC_FIREBASE_*</code> com a configuração do seu projeto
          Firebase e reinicie o servidor. O passo a passo está no{" "}
          <code>README.md</code>.
        </p>
      </AlertDescription>
    </Alert>
  )
}
