// lib/firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your Firebase configuration (GET THIS FROM FIREBASE CONSOLE)
// Go to Firebase Console > Project Settings > Your apps > Firebase SDK snippet
const firebaseConfig = {
  apiKey: "AIzaSyCL-l3C7tWYyhbQWVcJIL-SnmbV69JpaEw",
  authDomain: "marketmnl.firebaseapp.com",
  projectId: "marketmnl",
  storageBucket: "marketmnl.firebasestorage.app",
  messagingSenderId: "6849567096",
  appId: "1:6849567096:web:481341e8a9ec894e8f508d",
};

// Initialize Firebase only once
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
