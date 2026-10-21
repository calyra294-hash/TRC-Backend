import { auth, db } from "../config/firebase.js";

export const authService = {
  async verificarTokenYObtenerPerfil(idToken) {
    try {
      console.log("🛠️ [Backend] 1. Recibido idToken, procediendo a verificar con Admin Auth...");
      
      // 1. Verificar el token
      const decodedToken = await auth.verifyIdToken(idToken);
      const uid = decodedToken.uid;
      console.log(`🛠️ [Backend] 2. Token verificado con éxito. UID extraído: ${uid}`);

      // 2. Buscar en Firestore
      console.log(`🛠️ [Backend] 3. Buscando documento en la colección 'usuario' para el UID: ${uid}...`);
      const userDocRef = db.collection("usuario").doc(uid);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.warn(`⚠️ [Backend] El documento con UID ${uid} NO existe en la colección 'usuario'.`);
        throw new Error("Perfil no encontrado en la colección usuario.");
      }

      console.log("🛠️ [Backend] 4. Documento encontrado en Firestore. Extrayendo datos...");
      const userData = userDoc.data();

      // 3. Retornar perfil consolidado
      const perfilConsolidado = {
        uid,
        email: decodedToken.email,
        ...userData,
      };
      
      console.log("✅ [Backend] 5. Perfil consolidado con éxito:", perfilConsolidado);
      return perfilConsolidado;

    } catch (error) {
      console.error("❌ [Backend] Error atrapado en verificarTokenYObtenerPerfil:", error.message);
      throw new Error(`Error en el servidor: ${error.message}`);
    }
  },

  async signOut() {
    return true;
  },
};