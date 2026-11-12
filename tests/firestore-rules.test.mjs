// Testes das regras do Firestore (rodam no emulador local, nunca no banco real).
// Uso: npm run test:rules
//
// Cada "ataque" simula alguém usando o banco direto pelo console do
// navegador, sem passar pela tela do site. Todos precisam ser RECUSADOS;
// os usos normais do site precisam continuar funcionando.
import { readFileSync } from "node:fs"
import { after, before, beforeEach, describe, test } from "node:test"

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing"
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"

let env

const USERS = {
  admin: { uid: "admin", email: "admin@jornal.test", role: "admin", name: "Admin" },
  editor: { uid: "editor", email: "editor@jornal.test", role: "editor", name: "Editora" },
  off: { uid: "off", email: "off@jornal.test", role: "editor", name: "Desativado", disabled: true },
  alice: { uid: "alice", email: "alice@jornal.test", role: "reader", name: "Alice" },
  bob: { uid: "bob", email: "bob@jornal.test", role: "reader", name: "Bob" },
}

const db = (key) =>
  env.authenticatedContext(USERS[key].uid, { email: USERS[key].email }).firestore()
const anon = () => env.unauthenticatedContext().firestore()

function nextMonth() {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() + 1
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`
}

const subscription = (key, extra = {}) => ({
  name: USERS[key].name + " da Silva",
  email: USERS[key].email,
  phone: "(55) 99999-0000",
  address: "Rua A, 10, Centro",
  document: "52998224725",
  status: "ativa",
  due_day: 10,
  first_due_month: nextMonth(),
  custom_price_cents: null,
  custom_price_note: "",
  started_at: serverTimestamp(),
  created_at: serverTimestamp(),
  updated_at: serverTimestamp(),
  ...extra,
})

const comment = (key, extra = {}) => ({
  article_id: "pub",
  parent_id: null,
  author_uid: USERS[key].uid,
  author_name: USERS[key].name,
  author_photo: "",
  author_subscriber: false,
  text: "Ótima matéria!",
  liked_by: [],
  deleted: false,
  created_at: serverTimestamp(),
  ...extra,
})

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-jornal",
    firestore: { rules: readFileSync("firestore.rules", "utf8"), host: "127.0.0.1", port: 8085 },
  })
})

after(async () => {
  await env?.cleanup()
})

beforeEach(async () => {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const fs = ctx.firestore()
    for (const u of Object.values(USERS)) {
      await setDoc(doc(fs, "profiles", u.uid), {
        name: u.name,
        email: u.email,
        role: u.role,
        ...(u.disabled ? { disabled: true } : {}),
      })
    }
    await setDoc(doc(fs, "articles", "pub"), { status: "published", title: "Publicada" })
    await setDoc(doc(fs, "articles", "draft"), { status: "draft", title: "Rascunho" })
    await setDoc(doc(fs, "articles", "pub2"), { status: "published", title: "Outra" })
    await setDoc(doc(fs, "comentarios", "c1"), comment("alice", { created_at: new Date() }))
    await setDoc(doc(fs, "comentarios", "other"), comment("alice", { article_id: "pub2", created_at: new Date() }))
    await setDoc(doc(fs, "assinaturas", "alice"), subscription("alice", { started_at: new Date(), created_at: new Date(), updated_at: new Date() }))
    await setDoc(doc(fs, "faturas", "alice_2026-12"), { uid: "alice", amount_cents: 2990, status: "aberta" })
    await setDoc(doc(fs, "subscribers", "s1"), { name: "Assinante impresso", address: "Rua B" })
    await setDoc(doc(fs, "articles", "pub", "privado", "conteudo"), { body: "<p>texto pago</p>" })
    await setDoc(doc(fs, "articles", "draft", "privado", "conteudo"), { body: "<p>rascunho pago</p>" })
  })
})

describe("ataques que precisam ser recusados", () => {
  test("leitor troca o e-mail do perfil para o de outra pessoa", () =>
    assertFails(updateDoc(doc(db("alice"), "profiles", "alice"), { email: USERS.bob.email })))

  test("leitor se promove a administrador", () =>
    assertFails(updateDoc(doc(db("alice"), "profiles", "alice"), { role: "admin" })))

  test("conta desativada se reativa sozinha", () =>
    assertFails(updateDoc(doc(db("off"), "profiles", "off"), { disabled: false })))

  test("conta nova nasce como admin", async () => {
    const carol = env.authenticatedContext("carol", { email: "carol@jornal.test" }).firestore()
    await assertFails(
      setDoc(doc(carol, "profiles", "carol"), { name: "Carol", email: "carol@jornal.test", role: "admin" })
    )
  })

  test("conta nova com e-mail de outra pessoa", async () => {
    const carol = env.authenticatedContext("carol", { email: "carol@jornal.test" }).firestore()
    await assertFails(
      setDoc(doc(carol, "profiles", "carol"), { name: "Carol", email: USERS.admin.email, role: "reader" })
    )
  })

  test("foto de perfil apontando para site externo (rastreamento)", () =>
    assertFails(updateDoc(doc(db("alice"), "profiles", "alice"), { photo_url: "https://evil.example/x.png" })))

  test("leitor lê o perfil de outra pessoa", () => assertFails(getDoc(doc(db("alice"), "profiles", "bob"))))

  test("assinatura com primeira fatura em 2099 (fugir da cobrança)", () =>
    assertFails(setDoc(doc(db("bob"), "assinaturas", "bob"), subscription("bob", { first_due_month: "2099-01" }))))

  test("assinatura já com desconto", () =>
    assertFails(setDoc(doc(db("bob"), "assinaturas", "bob"), subscription("bob", { custom_price_cents: 0 }))))

  test("assinatura em nome de outra pessoa", () =>
    assertFails(setDoc(doc(db("bob"), "assinaturas", "alice"), subscription("bob"))))

  test("assinante muda o próprio vencimento/início da cobrança", () =>
    assertFails(updateDoc(doc(db("alice"), "assinaturas", "alice"), { first_due_month: "2099-01" })))

  test("assinante cancela a própria cobrança mudando a situação", () =>
    assertFails(updateDoc(doc(db("alice"), "assinaturas", "alice"), { status: "pendente" })))

  test("editor lê CPF/endereço da assinatura", () =>
    assertFails(getDoc(doc(db("editor"), "assinaturas", "alice"))))

  test("editor lê faturas", () => assertFails(getDoc(doc(db("editor"), "faturas", "alice_2026-12"))))

  test("leitor lê a fatura de outra pessoa", () =>
    assertFails(getDoc(doc(db("bob"), "faturas", "alice_2026-12"))))

  test("leitor marca a própria fatura como paga", () =>
    assertFails(updateDoc(doc(db("alice"), "faturas", "alice_2026-12"), { status: "paga" })))

  test("comentário se passando por outra pessoa (nome falso)", () =>
    assertFails(addDoc(collection(db("bob"), "comentarios"), comment("bob", { author_name: "Redação do Jornal" }))))

  test("comentário com foto externa", () =>
    assertFails(addDoc(collection(db("bob"), "comentarios"), comment("bob", { author_photo: "https://evil.example/p.png" }))))

  test("selo de assinante sem ser assinante", () =>
    assertFails(addDoc(collection(db("bob"), "comentarios"), comment("bob", { author_subscriber: true }))))

  test("comentário em rascunho", () =>
    assertFails(addDoc(collection(db("bob"), "comentarios"), comment("bob", { article_id: "draft" }))))

  test("resposta ligada a comentário de outra notícia", () =>
    assertFails(addDoc(collection(db("bob"), "comentarios"), comment("bob", { parent_id: "other" }))))

  test("comentário com campo extra", () =>
    assertFails(addDoc(collection(db("bob"), "comentarios"), comment("bob", { is_pinned: true }))))

  test("comentário em nome de outro uid", () =>
    assertFails(addDoc(collection(db("bob"), "comentarios"), comment("alice"))))

  test("curtir em nome de outra pessoa", () =>
    assertFails(updateDoc(doc(db("bob"), "comentarios", "c1"), { liked_by: arrayUnion("alice") })))

  test("alterar o texto do comentário de outra pessoa", () =>
    assertFails(updateDoc(doc(db("bob"), "comentarios", "c1"), { text: "texto trocado" })))

  test("apagar comentário de outra pessoa", () =>
    assertFails(updateDoc(doc(db("bob"), "comentarios", "c1"), { deleted: true, text: "" })))

  test("visitante lê rascunho", () => assertFails(getDoc(doc(anon(), "articles", "draft"))))

  test("leitor cria notícia", () =>
    assertFails(setDoc(doc(db("alice"), "articles", "fake"), { status: "published", title: "Falsa" })))

  test("leitor lê cadastro de entrega (dados pessoais)", () =>
    assertFails(getDoc(doc(db("alice"), "subscribers", "s1"))))

  test("editor desativado lê cadastro de entrega", () =>
    assertFails(getDoc(doc(db("off"), "subscribers", "s1"))))

  test("leitor envia foto de notícia (só a equipe)", () =>
    assertFails(addDoc(collection(db("alice"), "imagens"), {
      data: "AAAA", content_type: "image/jpeg", kind: "article", created_by: "alice",
      width: 1, height: 1, size: 3, created_at: serverTimestamp(),
    })))

  test("foto de perfil enviada em nome de outra pessoa", () =>
    assertFails(addDoc(collection(db("alice"), "imagens"), {
      data: "AAAA", content_type: "image/jpeg", kind: "avatar", created_by: "bob",
      width: 1, height: 1, size: 3, created_at: serverTimestamp(),
    })))

  test("leitor muda editorias do menu", () =>
    assertFails(setDoc(doc(db("alice"), "editorias", "x"), { name: "Golpe" })))

  test("editor muda a mensalidade", () =>
    assertFails(setDoc(doc(db("editor"), "config", "assinatura"), { monthly_price_cents: 1 })))

  test("visitante lê o texto exclusivo de assinantes", () =>
    assertFails(getDoc(doc(anon(), "articles", "pub", "privado", "conteudo"))))

  test("leitor não assinante lê o texto exclusivo", () =>
    assertFails(getDoc(doc(db("bob"), "articles", "pub", "privado", "conteudo"))))

  test("assinante lê texto exclusivo de rascunho", () =>
    assertFails(getDoc(doc(db("alice"), "articles", "draft", "privado", "conteudo"))))

  test("assinante altera o texto exclusivo", () =>
    assertFails(setDoc(doc(db("alice"), "articles", "pub", "privado", "conteudo"), { body: "x" })))

  test("coleção desconhecida", () => assertFails(setDoc(doc(db("admin"), "qualquer", "x"), { a: 1 })))
})

describe("usos normais que precisam funcionar", () => {
  test("conta nova cria o próprio perfil de leitor", async () => {
    const carol = env.authenticatedContext("carol", { email: "carol@jornal.test" }).firestore()
    await assertSucceeds(
      setDoc(doc(carol, "profiles", "carol"), {
        name: "Carol", email: "carol@jornal.test", role: "reader",
        created_at: serverTimestamp(), updated_at: serverTimestamp(),
      })
    )
  })

  test("leitor muda nome e foto (do próprio banco)", () =>
    assertSucceeds(updateDoc(doc(db("alice"), "profiles", "alice"), {
      name: "Alice Souza", photo_url: "/api/imagens/abc123", updated_at: serverTimestamp(),
    })))

  test("leitor lê o próprio perfil", () => assertSucceeds(getDoc(doc(db("alice"), "profiles", "alice"))))

  test("leitor assina (cobrança no mês seguinte)", () =>
    assertSucceeds(setDoc(doc(db("bob"), "assinaturas", "bob"), subscription("bob"))))

  test("assinante atualiza telefone e endereço", () =>
    assertSucceeds(updateDoc(doc(db("alice"), "assinaturas", "alice"), {
      phone: "(55) 98888-1111", address: "Rua Nova, 20", updated_at: serverTimestamp(),
    })))

  test("assinante lê as próprias faturas", () =>
    assertSucceeds(getDocs(query(collection(db("alice"), "faturas"), where("uid", "==", "alice")))))

  test("admin lê assinaturas e gera fatura", async () => {
    await assertSucceeds(getDoc(doc(db("admin"), "assinaturas", "alice")))
    await assertSucceeds(setDoc(doc(db("admin"), "faturas", "alice_2027-01"), { uid: "alice", amount_cents: 2990, status: "aberta" }))
  })

  test("leitor comenta com o próprio nome", () =>
    assertSucceeds(addDoc(collection(db("bob"), "comentarios"), comment("bob"))))

  test("assinante comenta com o selo", () =>
    assertSucceeds(addDoc(collection(db("alice"), "comentarios"), comment("alice", { author_subscriber: true }))))

  test("leitor responde um comentário", () =>
    assertSucceeds(addDoc(collection(db("bob"), "comentarios"), comment("bob", { parent_id: "c1" }))))

  test("leitor curte e descurte", async () => {
    await assertSucceeds(updateDoc(doc(db("bob"), "comentarios", "c1"), { liked_by: ["bob"] }))
    await assertSucceeds(updateDoc(doc(db("bob"), "comentarios", "c1"), { liked_by: [] }))
  })

  test("autor apaga o próprio comentário", () =>
    assertSucceeds(updateDoc(doc(db("alice"), "comentarios", "c1"), { deleted: true, text: "" })))

  test("equipe apaga comentário de outra pessoa", () =>
    assertSucceeds(updateDoc(doc(db("editor"), "comentarios", "c1"), { deleted: true, text: "" })))

  test("visitante lê notícia publicada e comentários", async () => {
    await assertSucceeds(getDoc(doc(anon(), "articles", "pub")))
    await assertSucceeds(getDocs(query(collection(anon(), "comentarios"), where("article_id", "==", "pub"))))
  })

  test("admin promove leitor e desativa editor", async () => {
    await assertSucceeds(updateDoc(doc(db("admin"), "profiles", "bob"), { role: "editor", updated_at: serverTimestamp() }))
    await assertSucceeds(updateDoc(doc(db("admin"), "profiles", "editor"), { disabled: true, updated_at: serverTimestamp() }))
  })

  test("editor cuida de notícias e do cadastro de entrega", async () => {
    await assertSucceeds(setDoc(doc(db("editor"), "articles", "nova"), { status: "draft", title: "Nova" }))
    await assertSucceeds(getDoc(doc(db("editor"), "subscribers", "s1")))
  })

  test("assinante lê o texto exclusivo de notícia publicada", () =>
    assertSucceeds(getDoc(doc(db("alice"), "articles", "pub", "privado", "conteudo"))))

  test("equipe lê e grava o texto exclusivo", async () => {
    await assertSucceeds(getDoc(doc(db("editor"), "articles", "draft", "privado", "conteudo")))
    await assertSucceeds(setDoc(doc(db("editor"), "articles", "pub", "privado", "conteudo"), { body: "<p>novo</p>" }))
  })

  test("leitor envia a própria foto de perfil", () =>
    assertSucceeds(addDoc(collection(db("alice"), "imagens"), {
      data: "AAAA", content_type: "image/jpeg", kind: "avatar", created_by: "alice",
      width: 1, height: 1, size: 3, created_at: serverTimestamp(),
    })))

  test("editor envia foto de notícia", () =>
    assertSucceeds(addDoc(collection(db("editor"), "imagens"), {
      data: "AAAA", content_type: "image/jpeg", kind: "article", created_by: "editor",
      width: 1, height: 1, size: 3, created_at: serverTimestamp(),
    })))
})
