
import { db } from "../config/firebase.js";

const COLECCION = "alquiler";

const verificarAdministrador = (usuario) => {
    if (
        !usuario?.uid ||
        !["admin", "administrador"].includes(
            String(usuario.rol || "").trim().toLowerCase()
        )
    ) {
        const error = new Error(
            "Solo el administrador puede gestionar los alquileres."
        );
        error.status = 403;
        throw error;
    }
};

// REGISTRAR ENTREGA DEL VEHÍCULO
export const registrarEntregaService = async (id, usuario) => {
    verificarAdministrador(usuario);

    const referencia = db.collection(COLECCION).doc(String(id));

    return db.runTransaction(async (transaction) => {
        const documento = await transaction.get(referencia);

        if (!documento.exists) {
            const error = new Error("No se encontró el alquiler.");
            error.status = 404;
            throw error;
        }

        const alquiler = documento.data();
        const estado = String(alquiler.estado || "").toLowerCase();

        if (estado !== "pendiente_entrega") {
            const error = new Error(
                "Este alquiler no está pendiente de entrega."
            );
            error.status = 400;
            throw error;
        }

        const fechaActual = new Date().toISOString();

        transaction.update(referencia, {
            estado: "activo",
            fecha_entrega: fechaActual,
            fecha_actualizacion: fechaActual,
        });

        return {
            id: documento.id,
            ...alquiler,
            estado: "activo",
            fecha_entrega: fechaActual,
            fecha_actualizacion: fechaActual,
        };
    });
};

// REGISTRAR DEVOLUCIÓN DEL VEHÍCULO
export const registrarDevolucionService = async (
    id,
    usuario,
    especificaciones = {}
) => {
    verificarAdministrador(usuario);

    const referencia = db.collection(COLECCION).doc(String(id));

    return db.runTransaction(async (transaction) => {
        const documento = await transaction.get(referencia);

        if (!documento.exists) {
            const error = new Error("No se encontró el alquiler.");
            error.status = 404;
            throw error;
        }

        const alquiler = documento.data();
        const estado = String(alquiler.estado || "").toLowerCase();

        if (estado !== "activo") {
            const error = new Error(
                "Solo se pueden registrar devoluciones de alquileres activos."
            );
            error.status = 400;
            throw error;
        }

        const fechaActual = new Date().toISOString();

        const datosEspecificaciones = {
            ...(alquiler.especificaciones || {}),
            estado_general:
                String(especificaciones.estado_general || "").trim() ||
                "No especificado",
            kilometraje_devolucion:
                especificaciones.kilometraje_devolucion ?? "No aplica",
            nivel_combustible:
                String(especificaciones.nivel_combustible || "").trim() ||
                "No especificado",
        };

        transaction.update(referencia, {
            estado: "completado",
            fecha_devolucion: fechaActual,
            fecha_actualizacion: fechaActual,
            especificaciones: datosEspecificaciones,
        });

        return {
            id: documento.id,
            ...alquiler,
            estado: "completado",
            fecha_devolucion: fechaActual,
            fecha_actualizacion: fechaActual,
            especificaciones: datosEspecificaciones,
        };
    });
};
