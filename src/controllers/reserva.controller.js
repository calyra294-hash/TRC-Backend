
import {
  obtenerReservasService,
  exportarReservasCSVService,
} from "../services/reserva.service.js";

export const obtenerReservas = async (req, res) => {
  try {
    const idUsuario = req.query.id_usuario || null;

    const reservas = await obtenerReservasService(idUsuario);

    return res.status(200).json({
      success: true,
      data: reservas,
    });
  } catch (error) {
    console.error("Error al obtener reservas:", error);

    return res.status(500).json({
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

    // BOM UTF-8 para Excel
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
