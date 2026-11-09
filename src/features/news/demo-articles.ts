import type { EditoriaSlug } from "@/lib/site"

/**
 * CONTEÚDO ILUSTRATIVO.
 *
 * O módulo de notícias (redação, banco de dados e imagens) ainda não foi
 * implementado. Estes textos existem apenas para demonstrar a estrutura
 * editorial do portal e são sinalizados como exemplo em todas as telas.
 * Não representam fatos, pessoas ou lugares reais.
 */
export type DemoArticle = {
  slug: string
  editoria: EditoriaSlug
  title: string
  excerpt: string
  readingMinutes: number
}

export const demoArticles: DemoArticle[] = [
  {
    slug: "feira-do-produtor-volta-a-praca",
    editoria: "comunidade",
    title: "A feira que devolve a praça para quem mora perto dela",
    excerpt:
      "Bancas, conversa e produto colhido na véspera: um retrato de como o encontro semanal muda o ritmo do bairro.",
    readingMinutes: 6,
  },
  {
    slug: "obras-na-avenida-principal",
    editoria: "cidade",
    title: "O que muda no trânsito com as obras da avenida principal",
    excerpt:
      "Desvios, prazos e os trechos que exigem mais atenção de motoristas e pedestres nas próximas semanas.",
    readingMinutes: 4,
  },
  {
    slug: "biblioteca-comunitaria-amplia-horario",
    editoria: "cultura",
    title: "Biblioteca comunitária amplia horário e abre aos sábados",
    excerpt:
      "Voluntários organizam rodas de leitura e um acervo que cresce com doações dos próprios vizinhos.",
    readingMinutes: 3,
  },
  {
    slug: "campeonato-amador-tem-rodada-decisiva",
    editoria: "esporte",
    title: "Rodada decisiva movimenta o campeonato amador",
    excerpt:
      "Quatro equipes chegam ao fim de semana com chances de classificação — e arquibancada garantida.",
    readingMinutes: 3,
  },
  {
    slug: "por-que-o-jornal-local-importa",
    editoria: "opiniao",
    title: "Por que o jornal local ainda é o primeiro lugar onde a gente se reconhece",
    excerpt:
      "Notícia de perto não é notícia pequena: é a que muda a rua, a escola e a conversa do portão.",
    readingMinutes: 5,
  },
  {
    slug: "mutirao-recupera-praca-do-bairro",
    editoria: "comunidade",
    title: "Mutirão de moradores recupera a praça do bairro em um fim de semana",
    excerpt:
      "Tinta, mudas e mão na massa: como a vizinhança se organizou para reabrir um espaço esquecido.",
    readingMinutes: 4,
  },
  {
    slug: "calendario-de-servicos-da-semana",
    editoria: "cidade",
    title: "Serviços da semana: coleta, atendimentos e prazos para não perder",
    excerpt:
      "Um guia rápido com o que abre, o que fecha e o que precisa de agendamento nos próximos dias.",
    readingMinutes: 2,
  },
]

/** Corpo padrão das páginas de exemplo — explica o que a página real conterá. */
export const demoArticleBody: string[] = [
  "Este é um texto de exemplo. Ele ocupa o lugar da reportagem para mostrar como uma notícia será apresentada no portal: título em destaque, linha de apoio, imagem principal e um corpo de texto confortável para ler no celular ou no computador.",
  "Quando o módulo de redação estiver ativo, o conteúdo desta página será escrito e publicado pela equipe do jornal diretamente no painel administrativo, com data de publicação, autoria, fotografias e editoria definidas a cada matéria.",
  "A largura da coluna, o tamanho da letra e o espaçamento entre linhas foram escolhidos para leituras longas. Em telas pequenas, o texto ocupa toda a largura; em telas grandes, ele permanece em uma coluna estreita, como em uma página impressa.",
  "Citações, intertítulos, galerias e matérias relacionadas seguem o mesmo sistema visual do restante do portal e serão acrescentados junto com o módulo de notícias.",
]

export function getDemoArticle(slug: string): DemoArticle | undefined {
  return demoArticles.find((article) => article.slug === slug)
}
