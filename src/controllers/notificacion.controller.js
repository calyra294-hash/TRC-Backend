
import { auth, db } from "../config/firebase.js";

import {
    obtenerNotificacionesService,
    marcarNotificacionLeidaService,
    marcarTodasLeidasService,
} from "../services/notificaciones.service.js";

// Verificar sesión y obtener el usuario autenticado
const obtenerUsuarioAutenticado = async (req) => {
    const autorizacion = req.headers.authorization || "";

    if (!autorizacion.startsWith("Bearer ")) {
        const error = new Error("Debes iniciar sesión.");
        error.status = 401;
        throw error;
    }

    const token = autorizacion.slice(7);
    const usuarioToken = await auth.verifyIdToken(token);

    const perfilRef = await db
        .collection("usuario")
        .doc(usuarioToken.uid)
        .get();

    if (!perfilRef.exists) {
        const error = new Error("No se encontró tu perfil.");
        error.status = 403;
        throw error;
    }

    return {
        uid: usuarioToken.uid,
        rol: String(perfilRef.data()?.rol || "")
            .trim()
            .toLowerCase(),
    };
};

// Obtener notificaciones del usuario autenticado
export const obtenerNotificaciones = async (req, res) => {
    try {
        const usuario = await obtenerUsuarioAutenticado(req);

        const resultado = await obtenerNotificacionesService(
            usuario.uid
        );

        return res.status(200).json({
            success: true,
            mensaje: "Notificaciones obtenidas correctamente.",
            data: resultado,
        });
    } catch (error) {
        console.error("Error al obtener notificaciones:", error);

        return res.status(error.status || 500).json({
            success: false,
            mensaje: error.message || "Error al obtener las notificaciones.",
        });
    }
};

// Marcar una notificación como leída
export const marcarNotificacionLeida = async (req, res) => {
    try {
        const usuario = await obtenerUsuarioAutenticado(req);
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                success: false,
                mensaje: "Debes proporcionar el ID de la notificación.",
            });
        }

        const resultado = await marcarNotificacionLeidaService(
            id,
            usuario.uid
        );

        return res.status(200).json({
            success: true,
            mensaje: "Notificación marcada como leída.",
            data: resultado,
        });
    } catch (error) {
        console.error("Error al marcar notificación:", error);

        return res.status(error.status || 500).json({
            success: false,
            mensaje: error.message || "Error al actualizar la notificación.",
        });
    }
};

// Marcar todas las notificaciones como leídas
export const marcarTodasNotificacionesLeidas = async (req, res) => {
    try {
        const usuario = await obtenerUsuarioAutenticado(req);

        const resultado = await marcarTodasLeidasService(
            usuario.uid
        );

        return res.status(200).json({
            success: true,
            mensaje: "Notificaciones actualizadas correctamente.",
            data: resultado,
        });
    } catch (error) {
        console.error("Error al marcar todas las notificaciones:", error);

        return res.status(error.status || 500).json({
            success: false,
            mensaje: error.message || "Error al actualizar las notificaciones.",
        });
    }
};
