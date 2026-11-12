import type { NextConfig } from "next";

/**
 * O site é publicado no Firebase Hosting (plano gratuito), que só serve
 * arquivos estáticos. `output: "export"` gera a pasta `out/` com HTML, CSS e
 * JS; todos os dados (notícias, login, fotos) vêm do Firebase no navegador.
 *
 * Por isso não há rotas de API, redirects do servidor nem segmentos
 * dinâmicos na URL (as páginas usam ?slug= / ?id=).
 */
const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
