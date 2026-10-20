// src/config/firebaseAdmin.js (o firebase.js en el backend)
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth"; // <-- ¡Ojo! Debe ser de firebase-admin/auth

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

// Evitamos inicializar la app múltiples veces en caliente
let app;
if (!getApps().length) {
  app = initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  app = getApp();
}

// Exportamos tanto la base de datos como el servicio de autenticación del Admin SDK
const db = getFirestore(app);
const auth = getAuth(app);

export { auth, db };