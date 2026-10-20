import { auth, db } from "../config/firebase.js";

export const authService = {
  async verificarTokenYObtenerPerfil(idToken) {
    try {
      // 1. Verificar el token usando la instancia centralizada de Admin Auth
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;

      // 2. Buscar el documento del usuario en Firestore
      const userDocRef = db.collection("usuario").doc(uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        throw new Error("Perfil no encontrado en la colección usuario.");
      }

      const userData = userDoc.data();

      // 3. Retornar perfil consolidado con rol
      return {
        uid,
        email: decodedToken.email,
        ...userData,
      };
    } catch (error) {
      throw new Error(`Error en el servidor: ${error.message}`);
    }
  },

  async signOut() {
    return true;
  },
};