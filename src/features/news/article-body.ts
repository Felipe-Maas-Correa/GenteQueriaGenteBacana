/**
 * Corpo da notícia.
 *
 * O texto é guardado como HTML gerado pelo editor (Tiptap). Notícias antigas,
 * gravadas em texto simples (parágrafos separados por linha em branco e "## "
 * para intertítulos), são convertidas para HTML ao abrir no editor ou no site.
 */

const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")

export function isHtmlBody(body: string): boolean {
  return /^\s*<[a-z][\s\S]*>/i.test(body)
}

/** Converte o formato antigo (texto simples) em HTML. */
export function plainTextToHtml(body: string): string {
  return body
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) =>
      block.startsWith("## ")
        ? `<h2>${escapeHtml(block.slice(3))}</h2>`
        : `<p>${block.split("\n").map(escapeHtml).join("<br>")}</p>`
    )
    .join("")
}

export function bodyToHtml(body: string): string {
  return isHtmlBody(body) ? body : plainTextToHtml(body)
}

/** O editor vazio produz "<p></p>"; tratamos como texto vazio. */
export function isEmptyBody(html: string): boolean {
  return html.replace(/<[^>]*>/g, "").trim() === "" && !/<img|data-type=/i.test(html)
}

let hooksInstalled = false

/** Remove qualquer HTML perigoso antes de exibir (roda só no navegador). */
export async function sanitizeBody(html: string): Promise<string> {
  const { default: DOMPurify } = await import("dompurify")
  if (!hooksInstalled) {
    // Link que abre em nova aba não pode controlar a página de origem
    // (tabnabbing); qualquer outro "target" é descartado.
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName !== "A") return
      if (node.getAttribute("target") === "_blank") {
        node.setAttribute("rel", "noopener noreferrer")
      } else {
        node.removeAttribute("target")
      }
    })
    hooksInstalled = true
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "h2", "h3", "strong", "b", "em", "i", "u", "s", "a",
      "blockquote", "ul", "ol", "li", "hr", "img", "figure", "figcaption", "div",
    ],
    // data-*: tamanho da foto, carrossel e vídeo (montados em media.ts a
    // partir de dados validados — nunca um <iframe> vindo do texto).
    ALLOWED_ATTR: ["href", "target", "rel", "src", "alt", "title", "data-size", "data-type", "data-images", "data-src"],
    ALLOW_DATA_ATTR: false,
  })
}

/** Estilo compartilhado entre o editor e a página da notícia. */
export const articleProseClass =
  "space-y-5 text-[1.0625rem] leading-relaxed [&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-4 [&_blockquote]:border-brand [&_blockquote]:pl-5 [&_blockquote]:font-display [&_blockquote]:text-xl [&_blockquote]:italic [&_h2]:type-h3 [&_h2]:pt-3 [&_h3]:type-h4 [&_h3]:pt-2 [&_hr]:my-8 [&_hr]:border-border [&_img]:my-6 [&_img]:w-full [&_img]:rounded-sm [&_img[data-size=small]]:mx-auto [&_img[data-size=small]]:w-1/3 [&_img[data-size=medium]]:mx-auto [&_img[data-size=medium]]:w-1/2 [&_img[data-size=large]]:mx-auto [&_img[data-size=large]]:w-3/4 [&_li]:my-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:list-disc [&_ul]:pl-6"
