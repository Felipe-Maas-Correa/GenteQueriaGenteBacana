import type { Article, CardSize } from "@/types/database"

/**
 * CONTEÚDO ILUSTRATIVO.
 *
 * Exibido apenas enquanto o Firebase não está configurado ou nenhuma notícia
 * foi publicada no painel. Assim que a primeira notícia real for publicada,
 * o site passa a mostrar somente o conteúdo da redação. Os textos não
 * representam fatos, pessoas ou lugares reais.
 */
type DemoSeed = {
  slug: string
  editoria: string
  title: string
  excerpt: string
  card_size: CardSize
  kicker?: string
}

const seeds: DemoSeed[] = [
  {
    slug: "feira-do-produtor-volta-a-praca",
    editoria: "comunidade",
    title: "A feira que devolve a praça para quem mora perto dela",
    excerpt:
      "Bancas, conversa e produto colhido na véspera: um retrato de como o encontro semanal muda o ritmo do bairro.",
    card_size: "hero",
  },
  {
    slug: "obras-na-avenida-principal",
    editoria: "cidade",
    title: "O que muda no trânsito com as obras da avenida principal",
    excerpt:
      "Desvios, prazos e os trechos que exigem mais atenção de motoristas e pedestres nas próximas semanas.",
    card_size: "small",
    kicker: "Serviço",
  },
  {
    slug: "biblioteca-comunitaria-amplia-horario",
    editoria: "cultura",
    title: "Biblioteca comunitária amplia horário e abre aos sábados",
    excerpt:
      "Voluntários organizam rodas de leitura e um acervo que cresce com doações dos próprios vizinhos.",
    card_size: "small",
  },
  {
    slug: "campeonato-amador-tem-rodada-decisiva",
    editoria: "esporte",
    title: "Rodada decisiva movimenta o campeonato amador",
    excerpt:
      "Quatro equipes chegam ao fim de semana com chances de classificação — e arquibancada garantida.",
    card_size: "small",
  },
  {
    slug: "mutirao-recupera-praca-do-bairro",
    editoria: "comunidade",
    title: "Mutirão de moradores recupera a praça do bairro em um fim de semana",
    excerpt:
      "Tinta, mudas e mão na massa: como a vizinhança se organizou para reabrir um espaço esquecido.",
    card_size: "large",
  },
  {
    slug: "por-que-o-jornal-local-importa",
    editoria: "opiniao",
    title:
      "Por que o jornal local ainda é o primeiro lugar onde a gente se reconhece",
    excerpt:
      "Notícia de perto não é notícia pequena: é a que muda a rua, a escola e a conversa do portão.",
    card_size: "small",
  },
  {
    slug: "calendario-de-servicos-da-semana",
    editoria: "cidade",
    title: "Serviços da semana: coleta, atendimentos e prazos para não perder",
    excerpt:
      "Um guia rápido com o que abre, o que fecha e o que precisa de agendamento nos próximos dias.",
    card_size: "small",
  },
]

/** Corpo padrão das páginas de exemplo — explica o que a página real conterá. */
const demoBody = [
  "Este é um texto de exemplo. Ele ocupa o lugar da reportagem para mostrar como uma notícia será apresentada no portal: título em destaque, linha fina, imagem principal e um corpo de texto confortável para ler no celular ou no computador.",
  "As notícias reais são escritas e publicadas pela equipe do jornal no painel administrativo, em Redação › Notícias, com editoria, autoria, foto e o tamanho do cartão na página inicial.",
  "## Como funciona",
  "A largura da coluna, o tamanho da letra e o espaçamento entre linhas foram escolhidos para leituras longas. Em telas pequenas, o texto ocupa toda a largura; em telas grandes, ele permanece em uma coluna estreita, como em uma página impressa.",
].join("\n\n")

export function demoAsArticles(): Article[] {
  return seeds.map((seed, index) => ({
    id: `demo-${seed.slug}`,
    slug: seed.slug,
    title: seed.title,
    excerpt: seed.excerpt,
    body: demoBody,
    editoria: seed.editoria,
    author: "Redação",
    kicker: seed.kicker ?? "",
    kicker_tone: "default",
    image_url: "",
    image_caption: "",
    status: "published",
    on_home: true,
    home_order: index,
    card_size: seed.card_size,
    show_image: true,
    show_excerpt: true,
    published_at: "",
    created_at: "",
    updated_at: "",
  }))
}
