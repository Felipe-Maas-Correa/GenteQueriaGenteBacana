import { ArticleReader } from "@/features/news/components/public-views"

// As notícias são lidas do Firestore no navegador, então a página é dinâmica.
export const instant = false

export default async function ArticlePage({
  params,
}: PageProps<"/noticias/[slug]">) {
  const { slug } = await params
  return <ArticleReader slug={slug} />
}
