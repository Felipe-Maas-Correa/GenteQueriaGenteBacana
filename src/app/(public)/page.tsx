import { Reveal } from "@/components/shared/reveal"
import { HomeFeed } from "@/features/news/components/public-views"

export default function HomePage() {
  return (
    <>
      {/* Capa: montada no painel em Redação › Página inicial */}
      <HomeFeed />

      {/* Manifesto */}
      <section className="border-b border-primary-foreground/10 bg-primary text-primary-foreground">
        <div className="page-container grid gap-4 py-10 lg:grid-cols-12 lg:gap-10 lg:py-14">
          <Reveal className="lg:col-span-3">
            <p className="type-overline text-primary-foreground/60">O jornal</p>
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-9">
            <p className="type-h2 max-w-3xl">
              Notícia de perto, contada por quem vive aqui —{" "}
              <em className="font-normal text-primary-foreground/70">
                com nome, endereço e gente de verdade.
              </em>
            </p>
            <p className="type-body mt-4 max-w-2xl text-primary-foreground/70">
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
