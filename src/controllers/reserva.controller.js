
import { auth, db } from "../config/firebase.js";
import {
  obtenerReservasService,
  exportarReservasCSVService,
  crearReservaService,
  obtenerReservaPorIdService,
  actualizarEstadoReservaService,
  eliminarReservaService,
} from "../services/reserva.service.js";

// VALIDAR TOKEN Y OBTENER USUARIO DE FIREBASE
const obtenerUsuarioAutenticado = async (req) => {
  const autorizacion = req.headers.authorization || "";

  if (!autorizacion.startsWith("Bearer ")) {
    const error = new Error("Debes iniciar sesión para continuar.");
    error.status = 401;
    throw error;
  }

  const token = autorizacion.slice(7);
  const usuarioToken = await auth.verifyIdToken(token);
  const perfilRef = await db.collection("usuario").doc(usuarioToken.uid).get();

  if (!perfilRef.exists) {
    const error = new Error("No se encontró tu perfil de usuario.");
    error.status = 403;
    throw error;
  }

  const perfil = perfilRef.data() || {};

  return {
    uid: usuarioToken.uid,
    email: usuarioToken.email || perfil.email || "",
    rol: String(perfil.rol || "").trim().toLowerCase(),
  };
};

// OBTENER RESERVAS
export const obtenerReservas = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    const reservas = await obtenerReservasService(usuario);

    return res.status(200).json({
      success: true,
      data: reservas,
    });
  } catch (error) {
    console.error("Error al obtener reservas:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: "Error al obtener las reservas.",
      error: error.message,
    });
  }
};

// OBTENER UNA RESERVA
export const obtenerReservaPorId = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    const reserva = await obtenerReservaPorIdService(req.params.id, usuario);

    if (!reserva) {
      return res.status(404).json({
        success: false,
        mensaje: "No se encontró la reserva.",
      });
    }

    return res.status(200).json({
      success: true,
      data: reserva,
    });
  } catch (error) {
    console.error("Error al obtener la reserva:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: "Error al obtener la reserva.",
      error: error.message,
    });
  }
};

// CREAR RESERVA EN FIRESTORE
export const crearReserva = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);

    if (["admin", "administrador"].includes(usuario.rol)) {
      return res.status(403).json({
        success: false,
        mensaje: "Las reservas deben ser creadas desde una cuenta de cliente.",
      });
    }

    const { id_coche, fecha_inicio, fecha_fin, monto_total } = req.body;

    if (
      id_coche == null ||
      !fecha_inicio ||
      !fecha_fin ||
      monto_total == null
    ) {
      return res.status(400).json({
        success: false,
        mensaje: "Faltan datos obligatorios para crear la reserva.",
      });
    }

    if (
      !Number.isFinite(Number(id_coche)) ||
      !Number.isFinite(Number(monto_total)) ||
      Number(monto_total) < 0 ||
      !Number.isFinite(new Date(fecha_inicio).getTime()) ||
      !Number.isFinite(new Date(fecha_fin).getTime()) ||
      new Date(fecha_fin) <= new Date(fecha_inicio)
    ) {
      return res.status(400).json({
        success: false,
        mensaje: "Los datos de la reserva no son válidos.",
      });
    }

    const reserva = await crearReservaService(
      {
        id_coche,
        fecha_inicio,
        fecha_fin,
        monto_total,
      },
      usuario
    );

    return res.status(201).json({
      success: true,
      mensaje: "Reserva creada correctamente en Firebase.",
      data: reserva,
    });
  } catch (error) {
    console.error("Error al crear reserva:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: "No se pudo crear la reserva.",
      error: error.message,
    });
  }
};

// ACTUALIZAR ESTADO
export const actualizarEstadoReserva = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    const { estado } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        mensaje: "Debes indicar el estado de la reserva.",
      });
    }

    const reserva = await actualizarEstadoReservaService(
      req.params.id,
      estado,
      usuario
    );

    if (!reserva) {
      return res.status(404).json({
        success: false,
        mensaje: "No se encontró la reserva.",
      });
    }

    return res.status(200).json({
      success: true,
      mensaje: "Estado actualizado correctamente.",
      data: reserva,
    });
  } catch (error) {
    console.error("Error al actualizar reserva:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: "No se pudo actualizar el estado de la reserva.",
      error: error.message,
    });
  }
};

// ELIMINAR RESERVA
export const eliminarReserva = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    const eliminada = await eliminarReservaService(req.params.id, usuario);

    if (!eliminada) {
      return res.status(404).json({
        success: false,
        mensaje: "No se encontró la reserva.",
      });
    }

    return res.status(200).json({
      success: true,
      mensaje: "Reserva eliminada correctamente.",
    });
  } catch (error) {
    console.error("Error al eliminar reserva:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: "No se pudo eliminar la reserva.",
      error: error.message,
    });
  }
};

// EXPORTAR RESERVAS A CSV
export const exportarReservasCSV = async (req, res) => {
  try {
    const { filename, csvContent } = await exportarReservasCSVService();

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    res.write("\uFEFF");
    res.end(csvContent);
  } catch (error) {
    console.error("Error al exportar reservas a CSV:", error);

    return res.status(500).json({
      success: false,
      mensaje: "Error al generar el archivo CSV de reservas.",
      error: error.message,
    });
  }
};
