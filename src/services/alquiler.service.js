import db from "../config/firebase.js";

const COLECCION = "alquiler";

// OBTENER TODOS LOS ALQUILERES
export const obtenerAlquileresService = async () => {
    try {
        const snapshot = await db.collection(COLECCION).get();

        return snapshot.docs.map((doc) => {
            const data = doc.data();

            return {
                id: doc.id,
                ...data,
            };
        });
    } catch (error) {
        throw new Error(`Error al consultar alquileres: ${error.message}`);
    }
};