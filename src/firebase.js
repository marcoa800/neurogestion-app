import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Las claves se leen del archivo .env (nunca se suben a GitHub)
// Copia .env.example → .env y rellena con tus valores de Firebase Console
const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FB_API_KEY            || '',
  authDomain:        import.meta.env.VITE_FB_AUTH_DOMAIN        || '',
  projectId:         import.meta.env.VITE_FB_PROJECT_ID         || '',
  storageBucket:     import.meta.env.VITE_FB_STORAGE_BUCKET     || '',
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_ID       || '',
  appId:             import.meta.env.VITE_FB_APP_ID             || '',
}

export const isConfigured = FIREBASE_CONFIG.apiKey.trim().length > 0

let _db, _auth, _provider

if (isConfigured) {
  const app = initializeApp(FIREBASE_CONFIG)
  _db = getFirestore(app)
  _auth = getAuth(app)
  _provider = new GoogleAuthProvider()
  _provider.setCustomParameters({ prompt: 'select_account' })
}

export const db       = _db
export const auth     = _auth
export const provider = _provider
