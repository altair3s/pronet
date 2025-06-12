// firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Configuration Firebase à partir de votre .env
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaI-U",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "unieapp.com",
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL || "htdatabase.app",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "unicom-e678a",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "e.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "9860",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:392fe19",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || ""
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services Firebase
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Export de l'app pour utilisation avancée
export default app;