
import {
  obtenerReservasService,
  exportarReservasCSVService,
} from "../services/reserva.service.js";

import { resolverUsuarioSupabase } from "../utils/resolverUsuarioSupabase.js";

export const obtenerReservas = async (req, res) => {
  try {
    const { admin, idUsuario } = await resolverUsuarioSupabase(req);

    if (!admin && idUsuario == null) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const reservas = await obtenerReservasService(
      admin ? null : idUsuario
    );

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

export const exportarReservasCSV = async (req, res) => {
  try {
    const { filename, csvContent } =
      await exportarReservasCSVService();

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
      mensaje: "Error al generar el archivo CSV de reservas.",
      error: error.message,
    });
  }
};
