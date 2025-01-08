const { initializeApp } = require("firebase/app");
const { getAuth, GoogleAuthProvider, signInWithPopup } = require("firebase/auth");

const firebaseConfig = {
    apiKey: "AIzaSyD6OXyVs8VA_-WsYn-D9NMXp_PxGWT_bik",
    authDomain: "cityyanta-376f2.firebaseapp.com",
    projectId: "cityyanta-376f2",
    storageBucket: "cityyanta-376f2.firebasestorage.app",
    messagingSenderId: "103997864822",
    appId: "1:103997864822:web:697f7794e4a286c57d5857",
    measurementId: "G-083GLHD4ED"
  };

  
// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

module.exports = { auth};