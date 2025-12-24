import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getMessaging } from "firebase/messaging";
import { getFunctions } from "firebase/functions"; // <--- NEW
import { validateEnvironment } from "./env-guard";

const firebaseConfig = {
  apiKey: "AIzaSyA6zMvQnsY0gZPl9ciCyI_HeaTYvn3DuTA",
  authDomain: "compliment-app-production.firebaseapp.com",
  projectId: "compliment-app-production",
  storageBucket: "compliment-app-production.firebasestorage.app",
  messagingSenderId: "294989386360",
  appId: "1:294989386360:web:8db856205d65686f79d38d",
  measurementId: "G-4S3YW74X7Q"
};

// LAW #5B: RUNTIME CHECK
validateEnvironment(firebaseConfig);

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app);
export const functions = getFunctions(app); // <--- EXPORTED
