/**
 * Endereços das páginas com conteúdo do banco.
 *
 * O site é publicado como exportação estática no Firebase Hosting (plano
 * gratuito), que não executa servidor. Por isso as páginas de notícia e de
 * edição recebem o identificador por parâmetro (?slug= / ?id=) em vez de um
 * segmento dinâmico na URL.
 */
export const routes = {
  article: (slug: string) => `/noticia?slug=${encodeURIComponent(slug)}`,
  editArticle: (id: string) => `/admin/noticias/editar?id=${encodeURIComponent(id)}`,
  editSubscriber: (id: string) => `/admin/assinantes/editar?id=${encodeURIComponent(id)}`,
}
