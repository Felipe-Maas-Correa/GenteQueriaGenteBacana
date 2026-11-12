// Servidor local para testar a exportação estática (`out/`) como o Firebase
// Hosting a serve: URLs limpas (/noticia → noticia.html), 404.html e os
// cabeçalhos de segurança definidos em firebase.json (CSP etc.).
// Uso: node scripts/serve-out.mjs [porta]
import { createServer } from "node:http"
import { readFile, stat } from "node:fs/promises"
import { readFileSync } from "node:fs"
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

// Cabeçalhos do firebase.json ("**" vale para tudo; "/x/**" para o prefixo).
const rules = JSON.parse(readFileSync("firebase.json", "utf8")).hosting?.headers ?? []
function headersFor(pathname) {
  const result = {}
  for (const rule of rules) {
    const prefix = rule.source.replace(/\*\*$/, "")
    if (rule.source === "**" || pathname.startsWith(prefix)) {
      for (const h of rule.headers) result[h.key] = h.value
    }
  }
  // Localhost não tem HTTPS: estes dois só fazem sentido no site publicado.
  delete result["Strict-Transport-Security"]
  if (result["Content-Security-Policy"]) {
    result["Content-Security-Policy"] = result["Content-Security-Policy"].replace(/;\s*upgrade-insecure-requests/, "")
  }
  return result
}

async function exists(file) {
  try {
    return (await stat(file)).isFile()
  } catch {
    return false
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, "http://x")
  const path = normalize(decodeURIComponent(url.pathname)).replace(/^([/\\])+/, "")
  const candidates = [join(root, path), join(root, `${path}.html`), join(root, path, "index.html")]
  const security = headersFor(url.pathname)
  for (const file of candidates) {
    if (file.startsWith(root) && (await exists(file))) {
      res.writeHead(200, { ...security, "Content-Type": types[extname(file)] ?? "application/octet-stream" })
      return res.end(await readFile(file))
    }
  }
  res.writeHead(404, { ...security, "Content-Type": types[".html"] })
  res.end(await readFile(join(root, "404.html")).catch(() => "404"))
}).listen(port, () => console.log(`out/ em http://localhost:${port}`))
