// Import from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Your config from Firebase console
const firebaseConfig = {
  apiKey: "AIzaSyDDJX6q82kZX8opu2inc3ix1P-ll4ZqUQI",
  authDomain: "keytag-generator.firebaseapp.com", 
  projectId: "keytag-generator",
  storageBucket: "keytag-generator.appspot.com", 
  appId: "1:362326639027:web:fe5ec9377f76a37aca8bc6"
};

// Init
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);