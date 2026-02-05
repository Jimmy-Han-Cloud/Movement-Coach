import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey) return null;

  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  }
  if (!_auth) {
    _auth = getAuth(_app);
  }
  return _auth;
}
