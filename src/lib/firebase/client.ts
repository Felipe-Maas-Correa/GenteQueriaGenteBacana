import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

import { firebaseConfig, isFirebaseConfigured } from "./config"

type FirebaseServices = { app: FirebaseApp; auth: Auth; db: Firestore }

let services: FirebaseServices | null = null

/** Inicializa o Firebase uma única vez (padrão singleton). */
function initFirebase(): FirebaseServices {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
  return { app, auth: getAuth(app), db: getFirestore(app) }
}

/** Serviços do Firebase, ou `null` quando as variáveis de ambiente faltam. */
export function getFirebase(): FirebaseServices | null {
  if (!isFirebaseConfigured()) return null
  if (!services) services = initFirebase()
  return services
}

/** Serviços do Firebase; lança erro se não estiver configurado. */
export function requireFirebase(): FirebaseServices {
  const firebase = getFirebase()
  if (!firebase) {
    throw new Error(
      "Firebase não configurado: defina as variáveis NEXT_PUBLIC_FIREBASE_* em .env.local."
    )
  }
  return firebase
}

export function getDb(): Firestore {
  return requireFirebase().db
}

export function getFirebaseAuth(): Auth {
  return requireFirebase().auth
}
