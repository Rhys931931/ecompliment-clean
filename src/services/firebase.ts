import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging } from 'firebase/messaging'; // <--- NEW

const firebaseConfig = {
  apiKey: "AIzaSyA6zMvQnsY0gZPl9ciCyI_HeaTYvn3DuTA",
  authDomain: "compliment-app-production.firebaseapp.com",
  projectId: "compliment-app-production",
  storageBucket: "compliment-app-production.firebasestorage.app",
  messagingSenderId: "294989386360",
  appId: "1:294989386360:web:8db856205d65686f79d38d",
  measurementId: "G-4S3YW74X7Q"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const messaging = getMessaging(app); // <--- EXPORTED
export const googleProvider = new GoogleAuthProvider();
