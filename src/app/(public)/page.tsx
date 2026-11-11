import { Reveal } from "@/components/shared/reveal"
import { HomeFeed } from "@/features/news/components/public-views"

export default function HomePage() {
  return (
    <>
      {/* Capa: montada no painel em Redação › Página inicial */}
      <HomeFeed />

      {/* Manifesto */}
      <section className="bg-primary text-primary-foreground">
        <div className="page-container grid gap-10 py-20 lg:grid-cols-12 lg:py-28">
          <Reveal className="lg:col-span-3">
            <p className="type-overline text-primary-foreground/60">O jornal</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-9">
            <p className="type-h1 max-w-4xl">
              Notícia de perto, contada por quem vive aqui —{" "}
              <em className="font-normal text-primary-foreground/70">
                com nome, endereço e gente de verdade.
              </em>
            </p>
            <p className="type-lead mt-8 max-w-2xl text-primary-foreground/70">
              O Gente Querida, Gente Bacana nasce para acompanhar o dia a dia da
              comunidade: o que muda na cidade, quem faz a diferença no bairro e
              o que vale a pena saber antes de sair de casa.
            </p>
          </Reveal>
        </div>
      </section>
    </>
  )
}
