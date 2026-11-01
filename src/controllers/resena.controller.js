
import { auth, db } from "../config/firebase.js";

import {
  registrarResenaService,
  obtenerResenasVehiculoService,
  obtenerMisResenasService,
  obtenerTodasResenasAdminService,
  exportarResenasCSVService,
} from "../services/resenas.service.js";

// VALIDAR TOKEN Y OBTENER PERFIL
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

  const perfil = perfilRef.data() || {};

  return {
    uid: usuarioToken.uid,
    email: usuarioToken.email || perfil.email || "",
    rol: String(perfil.rol || "").trim().toLowerCase(),
  };
};

// VALIDAR ADMINISTRADOR
const verificarAdministrador = (usuario) => {
  if (!["admin", "administrador"].includes(usuario.rol)) {
    const error = new Error(
      "No tienes permisos para consultar todas las reseñas."
    );
    error.status = 403;
    throw error;
  }
};

// REGISTRAR RESEÑA
export const registrarResena = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);

    if (["admin", "administrador"].includes(usuario.rol)) {
      return res.status(403).json({
        success: false,
        mensaje: "Solo los clientes pueden publicar reseñas.",
      });
    }

    const resena = await registrarResenaService(
      req.body || {},
      usuario
    );

    return res.status(201).json({
      success: true,
      mensaje: "Reseña publicada correctamente.",
      data: resena,
    });
  } catch (error) {
    console.error("Error al registrar reseña:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message || "No se pudo registrar la reseña.",
    });
  }
};

// OBTENER RESEÑAS DE UN VEHÍCULO
export const obtenerResenasVehiculo = async (req, res) => {
  try {
    await obtenerUsuarioAutenticado(req);

    const idVehiculo = String(req.params.id || "").trim();

    if (!idVehiculo) {
      return res.status(400).json({
        success: false,
        mensaje: "Debes indicar el vehículo.",
      });
    }

    const resultado = await obtenerResenasVehiculoService(idVehiculo);

    return res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error("Error al obtener reseñas del vehículo:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message || "No se pudieron obtener las reseñas.",
    });
  }
};

// OBTENER MIS RESEÑAS
export const obtenerMisResenas = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);

    const resenas = await obtenerMisResenasService(usuario.uid);

    return res.status(200).json({
      success: true,
      data: resenas,
    });
  } catch (error) {
    console.error("Error al obtener mis reseñas:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message || "No se pudieron obtener tus reseñas.",
    });
  }
};

// OBTENER TODAS LAS RESEÑAS PARA EL ADMINISTRADOR
export const obtenerTodasResenasAdmin = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);

    verificarAdministrador(usuario);

    const resultado = await obtenerTodasResenasAdminService();

    return res.status(200).json({
      success: true,
      mensaje: "Reseñas obtenidas correctamente.",
      data: resultado,
    });
  } catch (error) {
    console.error("Error al obtener todas las reseñas:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message || "No se pudieron obtener las reseñas.",
    });
  }
};

// EXPORTAR RESEÑAS A CSV
export const exportarResenasCSV = async (req, res) => {
  try {
    const { filename, csvContent } = await exportarResenasCSVService();

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    res.write("\uFEFF");
    res.end(csvContent);
  } catch (error) {
    console.error("Error al exportar reseñas a CSV:", error);

    return res.status(500).json({
      success: false,
      mensaje: "Error al generar el archivo CSV de reseñas.",
      error: error.message,
    });
  }
};
