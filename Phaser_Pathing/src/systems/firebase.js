import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCwvQAEGwWHcMQSDg_8KMeKSP5Pl8Gv5lM",
  authDomain: "mementotd-a6090.firebaseapp.com",
  projectId: "mementotd-a6090",
  storageBucket: "mementotd-a6090.firebasestorage.app",
  messagingSenderId: "558757808130",
  appId: "1:558757808130:web:cfe80b5ea5f6a58fb7ff1b",
  measurementId: "G-6SYXPPDY2P"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

window.db = db;
window.auth = auth;
