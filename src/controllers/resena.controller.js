import { exportarResenasCSVService } from "../services/resenas.service.js";

export const exportarResenasCSV = async (req, res) => {
  try {
    const { filename, csvContent } = await exportarResenasCSVService();

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    
    // BOM UTF-8 para Excel
    res.write("\uFEFF");
    res.end(csvContent);
  } catch (error) {
    console.error("Error al exportar reseñas a CSV:", error);
    res.status(500).json({
      mensaje: "Error al generar el archivo CSV de reseñas.",
      error: error.message,
    });
  }
};