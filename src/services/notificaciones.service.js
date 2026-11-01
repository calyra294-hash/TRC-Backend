
import { db } from "../config/firebase.js";

const COLECCION = "notificaciones";

// Crear una notificación sin duplicarla
export const crearNotificacionService = async ({
    id_usuario,
    titulo,
    mensaje,
    tipo,
    id_reserva = null,
    id_alquiler = null,
    clave_unica = null,
}) => {
    if (!id_usuario || !titulo || !mensaje || !tipo) {
        throw new Error("Faltan datos para crear la notificación.");
    }

    const datos = {
        id_usuario,
        titulo,
        mensaje,
        tipo,
        leido: false,
        fecha_creacion: new Date(),
        id_reserva,
        id_alquiler,
    };

    // Si tiene clave única, comprobamos si ya fue creada
    if (clave_unica) {
        const referencia = db
            .collection(COLECCION)
            .doc(String(clave_unica));

        return db.runTransaction(async (transaction) => {
            const existente = await transaction.get(referencia);

            if (existente.exists) {
                return {
                    id: existente.id,
                    ...existente.data(),
                    duplicada: true,
                };
            }

            transaction.create(referencia, datos);

            return {
                id: referencia.id,
                ...datos,
                duplicada: false,
            };
        });
    }

    const referencia = await db
        .collection(COLECCION)
        .add(datos);

    return {
        id: referencia.id,
        ...datos,
        duplicada: false,
    };
};

// Obtener las notificaciones de un usuario
export const obtenerNotificacionesService = async (idUsuario) => {
    const resultado = await db
        .collection(COLECCION)
        .where("id_usuario", "==", idUsuario)
        .get();

    const notificaciones = resultado.docs.map((documento) => ({
        id: documento.id,
        ...documento.data(),
    }));

    notificaciones.sort((a, b) => {
        const fechaA = a.fecha_creacion?.toMillis?.() || 0;
        const fechaB = b.fecha_creacion?.toMillis?.() || 0;

        return fechaB - fechaA;
    });

    return {
        total: notificaciones.length,
        no_leidas: notificaciones.filter(
            (notificacion) => notificacion.leido === false
        ).length,
        notificaciones,
    };
};

// Marcar una notificación como leída
export const marcarNotificacionLeidaService = async (
    idNotificacion,
    idUsuario
) => {
    const referencia = db
        .collection(COLECCION)
        .doc(idNotificacion);

    const documento = await referencia.get();

    if (!documento.exists) {
        throw new Error("La notificación no existe.");
    }

    if (documento.data().id_usuario !== idUsuario) {
        throw new Error(
            "No tienes permiso para modificar esta notificación."
        );
    }

    await referencia.update({
        leido: true,
    });

    return {
        id: idNotificacion,
        leido: true,
    };
};

// Marcar todas las notificaciones como leídas
export const marcarTodasLeidasService = async (idUsuario) => {
    const resultado = await db
        .collection(COLECCION)
        .where("id_usuario", "==", idUsuario)
        .where("leido", "==", false)
        .get();

    if (resultado.empty) {
        return { actualizadas: 0 };
    }

    const lote = db.batch();

    resultado.docs.forEach((documento) => {
        lote.update(documento.ref, { leido: true });
    });

    await lote.commit();

    return {
        actualizadas: resultado.size,
    };
};
