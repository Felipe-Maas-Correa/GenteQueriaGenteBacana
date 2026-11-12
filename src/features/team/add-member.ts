import { deleteApp, initializeApp } from "firebase/app"
import {
  createUserWithEmailAndPassword,
  inMemoryPersistence,
  initializeAuth,
  signOut,
  updateProfile as updateAuthProfile,
} from "firebase/auth"
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore"

import { firebaseConfig } from "@/lib/firebase/config"
import { getDb } from "@/lib/firebase/client"
import { firestoreErrorMessage } from "@/lib/firebase/firestore-helpers"
import { actionError, type ActionResult } from "@/lib/utils/action-result"

type NewMember = {
  name: string
  email: string
  role: "admin" | "editor"
  /** Senha inicial definida pelo administrador (a pessoa pode trocar depois). */
  password: string
}

export const MIN_PASSWORD = 8

/**
 * Cadastra um membro da equipe direto do navegador (o site é estático, sem
 * servidor):
 *
 * 1. Cria a conta numa instância separada do Firebase, com sessão só na
 *    memória — assim o administrador continua logado.
 * 2. A própria conta nova cria seu perfil como "reader" (o que as regras
 *    permitem) e sai.
 * 3. O administrador promove o perfil para o papel escolhido.
 * 4. O administrador passa a senha inicial para a pessoa, que pode trocá-la
 *    em Minha conta › Trocar senha.
 *
 * Se o e-mail já tiver conta, só o papel é alterado (a senha continua a dela).
 */
export async function addTeamMember({
  name,
  email,
  role,
  password,
}: NewMember): Promise<ActionResult<{ existed: boolean }>> {
  if (password.length < MIN_PASSWORD) {
    return actionError(`A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.`)
  }
  const cleanEmail = email.trim().toLowerCase()
  const cleanName = name.trim()
  const db = getDb()

  let uid: string | null = null
  let existed = false

  const secondary = initializeApp(firebaseConfig, `cadastro-${Date.now()}`)
  try {
    const secondaryAuth = initializeAuth(secondary, { persistence: inMemoryPersistence })
    try {
      const { user } = await createUserWithEmailAndPassword(
        secondaryAuth,
        cleanEmail,
        password
      )
      uid = user.uid
      await updateAuthProfile(user, { displayName: cleanName })
      await setDoc(doc(getFirestore(secondary), "profiles", uid), {
        name: cleanName,
        email: cleanEmail,
        role: "reader",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      })
      await signOut(secondaryAuth)
    } catch (error) {
      const code = (error as { code?: string }).code
      if (code === "auth/email-already-in-use") {
        existed = true
      } else if (code === "auth/weak-password") {
        return actionError("Senha muito fraca. Use pelo menos 8 caracteres, misturando letras e números.")
      } else if (code === "auth/invalid-email") {
        return actionError("Informe um e-mail válido.")
      } else if (code === "auth/operation-not-allowed") {
        return actionError("Ative o login por e-mail/senha no Firebase (Authentication › Método de login).")
      } else {
        return actionError("Não foi possível criar a conta. Tente novamente.")
      }
    }
  } finally {
    await deleteApp(secondary).catch(() => {})
  }

  try {
    if (existed) {
      const found = await getDocs(
        query(collection(db, "profiles"), where("email", "==", cleanEmail))
      )
      const profile = found.docs[0]
      if (!profile) {
        return actionError(
          "Este e-mail já tem conta, mas ainda não entrou no site. Peça para a pessoa entrar uma vez e tente de novo."
        )
      }
      await updateDoc(profile.ref, { role, updated_at: serverTimestamp() })
      return {
        ok: true,
        message: `${cleanEmail} já tinha conta: o papel foi atualizado e a senha continua a que a pessoa usa.`,
        data: { existed: true },
      }
    }

    await updateDoc(doc(db, "profiles", uid!), { role, updated_at: serverTimestamp() })
  } catch (error) {
    return actionError(firestoreErrorMessage(error))
  }

  return {
    ok: true,
    message: `Conta de ${cleanName} criada. Passe o e-mail e a senha para a pessoa entrar.`,
    data: { existed: false },
  }
}
