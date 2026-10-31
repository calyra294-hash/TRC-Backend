
import { auth, db } from "../config/firebase.js";

import {
  obtenerAlquileresService,
  exportarAlquileresCSVService,
} from "../services/alquiler.service.js";

import {
  registrarEntregaService,
  registrarDevolucionService,
} from "../services/alquiler.gestion.service.js";

import {
  generarTokenQRService,
  validarTokenQRService,
} from "../services/qr.service.js";

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

const verificarAdministrador = (usuario) => {
  if (!["admin", "administrador"].includes(usuario.rol)) {
    const error = new Error(
      "Solo el administrador puede realizar esta acción."
    );
    error.status = 403;
    throw error;
  }
};

// OBTENER ALQUILERES
export const obtenerAlquileres = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    const alquileres = await obtenerAlquileresService(usuario);

    return res.status(200).json({
      success: true,
      data: alquileres,
    });
  } catch (error) {
    console.error("Error al obtener alquileres:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message,
    });
  }
};

// EXPORTAR ALQUILERES
export const exportarAlquilerCSV = async (req, res) => {
  try {
    const { filename, csvContent } =
      await exportarAlquileresCSVService();

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    res.write("\uFEFF");
    res.end(csvContent);
  } catch (error) {
    console.error("Error al exportar alquileres:", error);

    return res.status(500).json({
      success: false,
      mensaje: "Error al generar el archivo CSV.",
      error: error.message,
    });
  }
};

// GENERAR QR PARA EL CLIENTE
export const obtenerQRAlquiler = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);

    const resultado = await generarTokenQRService(
      req.params.id,
      usuario
    );

    return res.status(200).json({
      success: true,
      mensaje: "Código QR generado correctamente.",
      data: resultado,
    });
  } catch (error) {
    console.error("Error al generar QR:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message,
    });
  }
};

// VALIDAR QR ESCANEADO POR EL ADMINISTRADOR
export const validarQRAlquiler = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    verificarAdministrador(usuario);

    const resultado = await validarTokenQRService(req.body.token);

    return res.status(200).json({
      success: true,
      mensaje: "Código QR válido.",
      data: resultado,
    });
  } catch (error) {
    console.error("Error al validar QR:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message,
    });
  }
};

// CONFIRMAR ENTREGA O DEVOLUCIÓN MEDIANTE EL MISMO QR
export const confirmarEntregaQR = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);
    verificarAdministrador(usuario);

    const resultado = await validarTokenQRService(req.body.token);

    let alquiler;
    let mensaje;

    if (resultado.estado === "pendiente_entrega") {
      alquiler = await registrarEntregaService(
        resultado.id_alquiler,
        usuario
      );

      mensaje = "Entrega del vehículo confirmada correctamente.";
    } else if (resultado.estado === "activo") {
      alquiler = await registrarDevolucionService(
        resultado.id_alquiler,
        usuario,
        req.body.especificaciones || {}
      );

      mensaje = "Devolución del vehículo registrada correctamente.";
    } else {
      const error = new Error(
        "El estado del alquiler no permite esta operación."
      );
      error.status = 400;
      throw error;
    }

    return res.status(200).json({
      success: true,
      mensaje,
      operacion: alquiler.estado === "activo"
        ? "entrega"
        : "devolucion",
      data: alquiler,
    });
  } catch (error) {
    console.error("Error al procesar QR:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message,
    });
  }
};

// REGISTRAR ENTREGA TRADICIONAL
export const registrarEntrega = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);

    const alquiler = await registrarEntregaService(
      req.params.id,
      usuario
    );

    return res.status(200).json({
      success: true,
      mensaje: "Entrega registrada correctamente.",
      data: alquiler,
    });
  } catch (error) {
    console.error("Error al registrar entrega:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message,
    });
  }
};

// REGISTRAR DEVOLUCIÓN TRADICIONAL
export const registrarDevolucion = async (req, res) => {
  try {
    const usuario = await obtenerUsuarioAutenticado(req);

    const alquiler = await registrarDevolucionService(
      req.params.id,
      usuario,
      req.body || {}
    );

    return res.status(200).json({
      success: true,
      mensaje: "Devolución registrada correctamente.",
      data: alquiler,
    });
  } catch (error) {
    console.error("Error al registrar devolución:", error);

    return res.status(error.status || 500).json({
      success: false,
      mensaje: error.message,
    });
  }
};
