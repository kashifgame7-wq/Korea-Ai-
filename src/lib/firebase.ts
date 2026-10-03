import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore with specific database ID if provided
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on boot as recommended in the skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or configuration needs check.');
    }
  }
}
testConnection();

// Auth helper functions
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    await syncUserProfile(user);
    return user;
  } catch (err: any) {
    console.error('Google sign-in error:', err);
    throw err;
  }
}

export async function loginWithEmail(email: string, pass: string) {
  const result = await signInWithEmailAndPassword(auth, email, pass);
  await syncUserProfile(result.user);
  return result.user;
}

export async function registerWithEmail(email: string, pass: string, name?: string) {
  const result = await createUserWithEmailAndPassword(auth, email, pass);
  if (name && result.user) {
    await updateProfile(result.user, { displayName: name });
  }
  await syncUserProfile(result.user);
  return result.user;
}

export async function loginAsGuest() {
  const result = await signInAnonymously(auth);
  return result.user;
}

export async function logOut() {
  await signOut(auth);
}

export async function syncUserProfile(user: User) {
  if (!user || user.isAnonymous) return;
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        userId: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || '',
        lastLogin: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user profile to firestore:', err);
  }
}

export { onAuthStateChanged };
export type { User };
