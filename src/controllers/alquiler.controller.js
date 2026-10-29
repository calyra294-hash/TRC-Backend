
import {
  obtenerAlquileresService,
  exportarAlquileresCSVService,
} from "../services/alquiler.service.js";

import { resolverUsuarioSupabase } from "../utils/resolverUsuarioSupabase.js";

export const obtenerAlquileres = async (req, res) => {
  try {
    const { admin, idUsuario } = await resolverUsuarioSupabase(req);

    if (!admin && idUsuario == null) {
      return res.status(200).json([]);
    }

    const alquileres = await obtenerAlquileresService(
      admin ? null : idUsuario
    );

    return res.status(200).json(alquileres);
  } catch (error) {
    console.error("Error al obtener alquileres:", error);

    return res.status(error.status || 500).json({
      mensaje: "Error al obtener la lista de alquileres.",
      error: error.message,
    });
  }
};

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
    console.error("Error al exportar alquileres a CSV:", error);

    return res.status(500).json({
      mensaje: "Error al generar el archivo CSV de alquileres.",
      error: error.message,
    });
  }
};
