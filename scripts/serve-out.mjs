// Servidor local para testar a exportação estática (`out/`) como o Firebase
// Hosting a serve: URLs limpas (/noticia → noticia.html) e 404.html.
// Uso: node scripts/serve-out.mjs [porta]
import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { extname, join, normalize } from "node:path"

const root = join(process.cwd(), "out")
const port = Number(process.argv[2] ?? 3006)
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
  ".png": "image/png",
}

async function exists(file) {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^([/\\])+/, "")
  const candidates = [join(root, path), join(root, `${path}.html`), join(root, path, "index.html")]
  for (const file of candidates) {
    if (file.startsWith(root) && (await exists(file))) {
      res.writeHead(200, { "Content-Type": types[extname(file)] ?? "application/octet-stream" })
      return res.end(await readFile(file))
    }
  }
  res.writeHead(404, { "Content-Type": types[".html"] })
  res.end(await readFile(join(root, "404.html")).catch(() => "404"))
}).listen(port, () => console.log(`out/ em http://localhost:${port}`))
