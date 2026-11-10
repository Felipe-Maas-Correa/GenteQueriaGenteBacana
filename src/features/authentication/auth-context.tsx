"use client"

import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
} from "firebase/auth"
import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from "firebase/firestore"

import { getFirebase } from "@/lib/firebase/client"
import { actionError, type ActionResult } from "@/lib/utils/action-result"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import type { Profile, UserRole } from "@/types/database"

const STAFF_ROLES: readonly UserRole[] = ["admin", "editor"]

export function isStaff(role: UserRole | undefined): boolean {
  return role !== undefined && STAFF_ROLES.includes(role)
}

export type AuthStatus =
  | "loading"
  | "unconfigured"
  | "anonymous"
  | "authenticated"

export type CurrentUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

type AuthContextValue = {
  status: AuthStatus
  user: CurrentUser | null
  signIn: (input: LoginInput) => Promise<ActionResult>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapUser(firebaseUser: FirebaseUser, profile: Profile | null): CurrentUser {
  const email = profile?.email ?? firebaseUser.email ?? ""
  return {
    id: firebaseUser.uid,
    email,
    name:
      profile?.name ||
      firebaseUser.displayName ||
      email.split("@")[0] ||
      "Usuário",
    role: profile?.role ?? "pending",
  }
}

/**
 * Garante que exista um documento de perfil para o usuário autenticado.
 * Novos usuários nascem com papel `pending` (sem acesso aos dados); a promoção
 * para `editor`/`admin` é feita por um administrador.
 */
async function ensureProfile(firebaseUser: FirebaseUser) {
  const firebase = getFirebase()
  if (!firebase) return
  const ref = doc(firebase.db, "profiles", firebaseUser.uid)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    await setDoc(ref, {
      name: firebaseUser.displayName ?? "",
      email: firebaseUser.email ?? "",
      role: "pending",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    })
  }
}

function translateAuthError(code: string | undefined): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou senha incorretos."
    case "auth/user-disabled":
      return "Este usuário está desativado."
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns instantes e tente novamente."
    case "auth/network-request-failed":
      return "Falha de conexão. Verifique sua internet."
    default:
      return "Não foi possível entrar. Tente novamente."
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const firebase = getFirebase()
  const [status, setStatus] = useState<AuthStatus>(
    firebase ? "loading" : "unconfigured"
  )
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (!firebase) return
    return onAuthStateChanged(firebase.auth, async (nextUser) => {
      setFirebaseUser(nextUser)
      if (!nextUser) {
        setProfile(null)
        setStatus("anonymous")
        return
      }
      try {
        await ensureProfile(nextUser)
      } catch {
        // Regras podem recusar a criação em cenários atípicos; segue com pending.
      }
      setStatus("authenticated")
    })
  }, [firebase])

  // Acompanha o perfil (papel) em tempo real enquanto houver usuário.
  useEffect(() => {
    if (!firebase || !firebaseUser) return
    const ref = doc(firebase.db, "profiles", firebaseUser.uid)
    return onSnapshot(
      ref,
      (snapshot) => {
        setProfile(
          snapshot.exists()
            ? ({ id: snapshot.id, ...snapshot.data() } as unknown as Profile)
            : null
        )
      },
      () => setProfile(null)
    )
  }, [firebase, firebaseUser])

  const signIn = useCallback(
    async (input: LoginInput): Promise<ActionResult> => {
      if (!firebase) {
        return actionError("O Firebase ainda não foi configurado neste ambiente.")
      }
      const parsed = loginSchema.safeParse(input)
      if (!parsed.success) return actionError("Confira os campos informados.")
      try {
        await signInWithEmailAndPassword(
          firebase.auth,
          parsed.data.email,
          parsed.data.password
        )
        return { ok: true, message: "Autenticado." }
      } catch (error) {
        const code = (error as { code?: string }).code
        return actionError(translateAuthError(code))
      }
    },
    [firebase]
  )

  const signOutUser = useCallback(async () => {
    if (firebase) await signOut(firebase.auth)
  }, [firebase])

  const value = useMemo<AuthContextValue>(() => {
    const user =
      status === "authenticated" && firebaseUser
        ? mapUser(firebaseUser, profile)
        : null
    return { status, user, signIn, signOutUser }
  }, [status, firebaseUser, profile, signIn, signOutUser])

  return <AuthContext value={value}>{children}</AuthContext>
}

export function useAuth(): AuthContextValue {
  const context = use(AuthContext)
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de <AuthProvider>.")
  }
  return context
}
