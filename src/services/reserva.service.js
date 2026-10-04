import db from "../config/firebase.js";

const COLECCION = "reserva";

// OBTENER TODAS LAS RESERVAS
export const obtenerReservasService = async () => {
    try {
        const snapshot = await db.collection(COLECCION).get();

        return snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
        }));
    } catch (error) {
        throw new Error(`Error al consultar reservas: ${error.message}`);
    }
};

// OBTENER UNA RESERVA POR ID
export const obtenerReservaPorIdService = async (id) => {
    try {
        const doc = await db.collection(COLECCION).doc(id).get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data(),
        };
    } catch (error) {
        throw new Error(`Error al consultar la reserva: ${error.message}`);
    }
};

// CREAR UNA RESERVA
export const crearReservaService = async (datos) => {
    try {
        const reserva = {
            id_usuario: datos.id_usuario || "",
            fecha_inicio: datos.fecha_inicio,
            fecha_fin: datos.fecha_fin,
            estado_aprobacion: datos.estado_aprobacion || "Pendiente",
            monto_total: Number(datos.monto_total) || 0,
            vehiculos_resumen: datos.vehiculos_resumen || {},
        };

        const docRef = await db.collection(COLECCION).add(reserva);

        return {
            id: docRef.id,
            ...reserva,
        };
    } catch (error) {
        throw new Error(`Error al crear la reserva: ${error.message}`);
    }
};

// ACTUALIZAR ESTADO DE UNA RESERVA
export const actualizarEstadoReservaService = async (id, estado) => {
    try {
        const referencia = db.collection(COLECCION).doc(id);
        const doc = await referencia.get();

        if (!doc.exists) {
            return null;
        }

        await referencia.update({
            estado_aprobacion: estado,
        });

        return {
            id: id,
            ...doc.data(),
            estado_aprobacion: estado,
        };
    } catch (error) {
        throw new Error(`Error al actualizar la reserva: ${error.message}`);
    }
};

// ELIMINAR UNA RESERVA
export const eliminarReservaService = async (id) => {
    try {
        const referencia = db.collection(COLECCION).doc(id);
        const doc = await referencia.get();

        if (!doc.exists) {
            return false;
        }

        await referencia.delete();

        return true;
    } catch (error) {
        throw new Error(`Error al eliminar la reserva: ${error.message}`);
    }
};