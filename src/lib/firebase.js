// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyCxyjQmvxrHtHj24fX2lbUeCTDZNWDc3o0",
  authDomain: "music-plat.firebaseapp.com",
  projectId: "music-plat",
  storageBucket: "music-plat.firebasestorage.app",
  messagingSenderId: "288855710473",
  appId: "1:288855710473:web:0c271189d208928e17d1d8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;