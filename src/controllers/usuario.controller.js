// src/controllers/usuarios.controller.js
import { exportarUsuariosCSVService } from '../services/usuarios.service.js';

export const exportarUsuariosCSV = async (req, res) => {
  try {
    const { filename, csvContent } = await exportarUsuariosCSVService();

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    
    // BOM UTF-8 para Excel
    res.write("\uFEFF");
    res.end(csvContent);
  } catch (error) {
    console.error("Error al exportar usuarios a CSV:", error);
    res.status(500).json({
      mensaje: "Error al generar el archivo CSV de usuarios.",
      error: error.message,
    });
  }
};