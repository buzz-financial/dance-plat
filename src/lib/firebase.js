import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDQI-Ao_32vAnYN67yCcKIpncJyauW1UkE",
  authDomain: "dance-plat.firebaseapp.com",
  projectId: "dance-plat",
  storageBucket: "dance-plat.appspot.com", // <-- should be .appspot.com, not .app
  messagingSenderId: "721080377792",
  appId: "1:721080377792:web:ad977938f25563a7e0e825"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;