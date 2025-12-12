// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
    apiKey: "AIzaSyD9AGlS72t1aVBvHuGLgjDixfVtXtwUjz8",
    authDomain: "shopsense-aab8d.firebaseapp.com",
    projectId: "shopsense-aab8d",
    storageBucket: "shopsense-aab8d.firebasestorage.app",
    messagingSenderId: "357808857360",
    appId: "1:357808857360:web:7e3568b8822ba912178595",
    measurementId: "G-V8ERQX6Q3B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { app, messaging, getToken, onMessage };
