"use client"

import { useState } from "react"
import { FlaskConicalIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDialog } from "@/components/shared/confirm-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAsync } from "@/hooks/use-async"
import { useEditorias } from "@/features/editorias/editorias-context"
import type { Editoria } from "@/features/editorias/data"
import { isoToLocalInput, slugify, type ArticleInput } from "@/lib/validations/article"
import type { Article, ArticleAccess } from "@/types/database"

import { deleteArticle, saveArticle } from "../actions"
import { listAllArticles } from "../queries"

/**
 * Ferramenta TEMPORÁRIA de testes: cria 5 notícias fictícias por editoria e
 * apaga todas elas depois. Toda notícia de teste tem o título começando com
 * "[TESTE]" e o endereço com "teste-", e é assim que o botão de apagar as
 * encontra. Remova este cartão (e o arquivo) quando não precisar mais.
 */

const TITLE_PREFIX = "[TESTE] "
const SLUG_PREFIX = "teste-"
const PER_EDITORIA = 5

const isTestArticle = (article: Article) =>
  article.slug.startsWith(SLUG_PREFIX) && article.title.startsWith(TITLE_PREFIX)

type Sample = { title: string; excerpt: string }

/** Pautas fictícias por editoria (pelo slug). Editorias novas usam o modelo genérico. */
const SAMPLES: Record<string, Sample[]> = {
  cidade: [
    { title: "Obras de recapeamento chegam a três ruas do centro", excerpt: "Trabalho deve durar duas semanas, com desvios sinalizados para o trânsito." },
    { title: "Coleta seletiva passa a ter novo roteiro nos bairros", excerpt: "Caminhão passa em dias alternados; moradores devem separar o lixo reciclável." },
    { title: "Praça central recebe nova iluminação de LED", excerpt: "Troca das lâmpadas promete mais segurança e menos gasto de energia à noite." },
    { title: "Moradores pedem faixa de pedestres perto da escola", excerpt: "Abaixo-assinado com 200 nomes foi entregue para análise do pedido." },
    { title: "Feira do produtor muda de endereço no mês que vem", excerpt: "Bancas vão para uma área coberta, com mais espaço para estacionar." },
  ],
  comunidade: [
    { title: "Campanha do agasalho arrecada mais de 500 peças", excerpt: "Roupas e cobertores serão distribuídos para famílias cadastradas." },
    { title: "Voluntários revitalizam horta comunitária do bairro", excerpt: "Canteiros novos vão abastecer a cozinha da associação de moradores." },
    { title: "Associação de bairro elege nova diretoria", excerpt: "Chapa única foi escolhida em assembleia com a presença de 80 sócios." },
    { title: "Mutirão de limpeza reúne famílias no sábado", excerpt: "Grupo recolheu entulho e plantou mudas às margens do arroio." },
    { title: "Biblioteca comunitária abre espaço para contação de histórias", excerpt: "Encontros acontecem toda quarta-feira à tarde e são abertos às crianças." },
  ],
  cultura: [
    { title: "Festival de música reúne bandas da região no fim de semana", excerpt: "Programação tem rock, sertanejo e música nativista no palco da praça." },
    { title: "Exposição de fotografia retrata o cotidiano do interior", excerpt: "Mostra fica aberta à visitação por um mês, com entrada gratuita." },
    { title: "Grupo de teatro estreia peça sobre a história da cidade", excerpt: "Elenco formado por moradores ensaiou durante seis meses." },
    { title: "Oficina de artesanato tem inscrições abertas", excerpt: "Aulas de crochê e cerâmica são gratuitas e têm vagas limitadas." },
    { title: "Coral prepara apresentação de fim de ano", excerpt: "Repertório mistura canções natalinas e música popular brasileira." },
  ],
  esporte: [
    { title: "Time local vence clássico regional por 2 a 1", excerpt: "Gol da vitória saiu nos acréscimos e garantiu a liderança do grupo." },
    { title: "Corrida de rua deve reunir 300 atletas em dezembro", excerpt: "Percurso de 5 km passa pelas principais ruas do centro." },
    { title: "Escolinha de futsal abre novas vagas para crianças", excerpt: "Treinos são no ginásio municipal, duas vezes por semana." },
    { title: "Campeonato de bocha chega à fase final", excerpt: "Quatro equipes disputam o título no próximo domingo." },
    { title: "Ciclistas organizam passeio pelas estradas do interior", excerpt: "Pedalada tem 40 km e parada para café colonial no meio do caminho." },
  ],
  opiniao: [
    { title: "Por que precisamos falar sobre o trânsito no centro", excerpt: "Mais carros, ruas estreitas e pouca sinalização pedem uma conversa franca." },
    { title: "A importância das feiras para o pequeno produtor", excerpt: "Vender direto ao consumidor mantém a renda no campo e a comida fresca na mesa." },
    { title: "Cuidar da praça é tarefa de todos", excerpt: "Espaço público bem conservado depende de quem usa, não só de quem administra." },
    { title: "O que esperar do próximo ano na cidade", excerpt: "Obras, eventos e projetos que devem marcar os próximos meses." },
    { title: "Leitura também se ensina em casa", excerpt: "O exemplo dos pais pesa tanto quanto a escola na formação de leitores." },
  ],
  saude: [
    { title: "Grupo de caminhada se reúne às terças e quintas", excerpt: "Encontros começam às 7h na praça e têm acompanhamento de educador físico." },
    { title: "Posto de saúde ganha nova sala de espera", excerpt: "Reforma ampliou o espaço e trouxe mais conforto para quem aguarda." },
    { title: "Palestra aborda alimentação saudável na escola", excerpt: "Nutricionista conversou com alunos sobre lanches e consumo de água." },
    { title: "Projeto incentiva a doação de sangue entre jovens", excerpt: "Estudantes organizam caravana até o hemocentro mais próximo." },
    { title: "Unidade móvel visita comunidades do interior", excerpt: "Atendimento leva consultas básicas a quem mora longe do centro." },
  ],
}

const AUTHORS = ["Ana Lima", "Carlos Menezes", "Júlia Prado", "Rafael Torres", "Beatriz Nunes"]

function samplesFor(editoria: Editoria): Sample[] {
  const known = SAMPLES[editoria.slug]
  if (known) return known
  return Array.from({ length: PER_EDITORIA }, (_, index) => ({
    title: `Notícia de exemplo ${index + 1} de ${editoria.name}`,
    excerpt: `Texto curto de exemplo para conferir a editoria ${editoria.name}.`,
  }))
}

const photo = (seed: string, variant = 0) =>
  `https://picsum.photos/seed/${seed}${variant ? `-${variant}` : ""}/1200/800`

function bodyFor(sample: Sample, editoria: Editoria): string {
  return [
    "<p><strong>Notícia fictícia, criada só para testar o site.</strong></p>",
    `<p>${sample.excerpt}</p>`,
    "<h2>Mais detalhes</h2>",
    `<p>Este texto serve para conferir como uma notícia de ${editoria.name} aparece na página, no cartão e na pesquisa. Nomes, números e datas são inventados.</p>`,
    "<p>Os parágrafos seguintes existem para dar volume ao texto e testar a leitura em telas diferentes, a prévia das notícias restritas e a rolagem da página.</p>",
    "<p>Quando os testes terminarem, todas as notícias marcadas como teste serão removidas pela equipe.</p>",
  ].join("")
}

/** Monta as notícias de teste: foto, carrossel, sem foto e acessos variados. */
function buildTestArticles(editorias: Editoria[]): ArticleInput[] {
  const now = Date.now()
  return editorias.flatMap((editoria, editoriaIndex) =>
    samplesFor(editoria)
      .slice(0, PER_EDITORIA)
      .map((sample, index): ArticleInput => {
        const slugBase = `${SLUG_PREFIX}${editoria.slug}-${index + 1}`
        const slug = `${slugBase}-${slugify(sample.title)}`.slice(0, 120).replace(/-+$/g, "")
        // 0–2: foto única; 3: capa em carrossel; 4: sem foto e com acesso restrito.
        const hasImage = index < 4
        const access: ArticleAccess =
          index === 4 ? (editoriaIndex % 2 === 0 ? "partial" : "subscribers") : "public"
        // Datas no passado, espalhadas nos últimos dias.
        const hoursAgo = (editoriaIndex * PER_EDITORIA + index) * 5 + 1
        return {
          title: `${TITLE_PREFIX}${sample.title}`,
          slug,
          excerpt: sample.excerpt,
          body: bodyFor(sample, editoria),
          editoria: editoria.id,
          author: AUTHORS[(editoriaIndex + index) % AUTHORS.length],
          kicker: index === 0 ? "Teste · Urgente" : "Teste",
          kicker_tone: index === 0 ? "urgent" : "default",
          image_url: hasImage ? photo(slugBase) : "",
          image_caption: hasImage ? "Foto ilustrativa (teste)" : "",
          gallery: index === 3 ? [photo(slugBase, 1), photo(slugBase, 2)] : [],
          access,
          status: "published",
          publish_at: isoToLocalInput(new Date(now - hoursAgo * 3_600_000).toISOString()),
          on_home: false,
          card_size: "small",
          show_image: hasImage,
          show_excerpt: true,
        }
      })
  )
}

export function TestNewsCard() {
  const { editorias } = useEditorias()
  const existing = useAsync(
    () => listAllArticles().then((articles) => articles.filter(isTestArticle)),
    []
  )
  const [progress, setProgress] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const count = existing.data?.length ?? 0
  const busy = progress !== null

  async function createAll() {
    const inputs = buildTestArticles(editorias)
    const taken = new Set((existing.data ?? []).map((article) => article.slug))
    const pending = inputs.filter((input) => !taken.has(input.slug))
    if (!pending.length) {
      toast.info("As notícias de teste já existem.")
      return
    }
    let created = 0
    let failed = 0
    for (const [index, input] of pending.entries()) {
      setProgress(`Criando ${index + 1} de ${pending.length}…`)
      const result = await saveArticle(null, input)
      if (result.ok) created += 1
      else failed += 1
    }
    setProgress(null)
    existing.reload()
    if (failed) toast.error(`${created} criadas e ${failed} com erro. Tente de novo para completar.`)
    else toast.success(`${created} notícias de teste criadas.`)
  }

  async function deleteAll() {
    const targets = existing.data ?? []
    let removed = 0
    let failed = 0
    for (const [index, article] of targets.entries()) {
      setProgress(`Apagando ${index + 1} de ${targets.length}…`)
      const result = await deleteArticle(article.id)
      if (result.ok) removed += 1
      else failed += 1
    }
    setProgress(null)
    setConfirmDelete(false)
    existing.reload()
    if (failed) toast.error(`${removed} apagadas e ${failed} com erro. Tente de novo.`)
    else toast.success(`${removed} notícias de teste apagadas.`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notícias de teste</CardTitle>
        <CardDescription>
          Cria {PER_EDITORIA} notícias fictícias por editoria ({editorias.length * PER_EDITORIA} no
          total), publicadas e fora da página inicial, com o título começando por “[TESTE]”. Elas
          aparecem no site real até serem apagadas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="type-small text-muted-foreground" aria-live="polite">
          {progress ??
            (existing.loading && !existing.data
              ? "Verificando…"
              : existing.error
                ? "Não foi possível verificar as notícias de teste."
                : count
                  ? `${count} ${count === 1 ? "notícia de teste publicada" : "notícias de teste publicadas"}.`
                  : "Nenhuma notícia de teste no momento.")}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={createAll} loading={busy && !confirmDelete} disabled={busy || !editorias.length || existing.loading}>
            <FlaskConicalIcon aria-hidden />
            Criar notícias de teste
          </Button>
          <Button
            variant="outline"
            onClick={() => setConfirmDelete(true)}
            disabled={busy || !count}
          >
            <Trash2Icon aria-hidden />
            Apagar notícias de teste
          </Button>
        </div>
      </CardContent>
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Apagar as notícias de teste?"
        description={`As ${count} notícias com “[TESTE]” no título serão excluídas de vez. As notícias reais não são afetadas.`}
        confirmLabel="Apagar"
        tone="destructive"
        loading={busy}
        onConfirm={deleteAll}
      />
    </Card>
  )
}
