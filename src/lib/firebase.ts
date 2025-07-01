import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: "ziraatx.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Config validation
const validateConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.error('❌ Firebase config eksik anahtarlar:', missingKeys);
    throw new Error(`Firebase configuration eksik: ${missingKeys.join(', ')}`);
  }
};

// Firebase Singleton Implementation
let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firebaseDb: Firestore | null = null;
let firebaseStorage: FirebaseStorage | null = null;
let isInitialized = false;

const initializeFirebase = (): FirebaseApp => {
  try {
    // Güçlü singleton kontrolü
    if (isInitialized && firebaseApp) {
      return firebaseApp;
    }
    
    // Firebase app zaten varsa kullan
    if (getApps().length > 0) {
      firebaseApp = getApp();
      isInitialized = true;
      return firebaseApp;
    }

    validateConfig();


    firebaseApp = initializeApp(firebaseConfig);
    isInitialized = true;
    return firebaseApp;
    
  } catch (error) {
    console.error('❌ Firebase initialization hatası:', error);
    throw error;
  }
};

// Singleton pattern ile Firebase services'leri export et
export const getFirebaseApp = (): FirebaseApp => {
  if (!firebaseApp) {
    firebaseApp = initializeFirebase();
  }
  return firebaseApp;
};

export const getFirebaseAuth = (): Auth => {
  if (!firebaseAuth) {
    firebaseAuth = getAuth(getFirebaseApp());
  }
  return firebaseAuth;
};

export const getFirebaseDb = (): Firestore => {
  if (!firebaseDb) {
    firebaseDb = getFirestore(getFirebaseApp());
  }
  return firebaseDb;
};

export const getFirebaseStorage = (): FirebaseStorage => {
  if (!firebaseStorage) {
    firebaseStorage = getStorage(getFirebaseApp());
  }
  return firebaseStorage;
};

// Direct exports - no proxy to avoid collection() issues
export const auth = getFirebaseAuth();
export const db = getFirebaseDb();
export const storage = getFirebaseStorage();

export default getFirebaseApp();
