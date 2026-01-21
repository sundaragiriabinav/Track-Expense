import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// REPLACE THESE WITH YOUR ACTUAL KEYS FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyB1KiEa_HnzHvs9YxW3-XW5bLakcKInFpI",
  authDomain: "smart-expense-analyzer.firebaseapp.com",
  projectId: "smart-expense-analyzer",
  storageBucket: "smart-expense-analyzer.firebasestorage.app",
  messagingSenderId: "723248380383",
  appId: "1:723248380383:web:faf76074864709a8c6ac6a",
  measurementId: "G-Z7NRJ8302W",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
console.log("Firebase Initialized Successfully");
