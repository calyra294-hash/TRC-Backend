import {
  exportarReservasCSVService
} from "../services/reserva.service.js";

export const exportarReservasCSV = async ( req, res ) => {
  try
  {
    const { filename, csvContent } = await exportarReservasCSVService();

    res.setHeader( "Content-Type", "text/csv; charset=utf-8" );
    res.setHeader( "Content-Disposition", `attachment; filename="${ filename }"` );

    // BOM UTF-8 para Excel
    res.write( "\uFEFF" );
    res.end( csvContent );
  } catch ( error )
  {
    console.error( "Error al exportar reservas a CSV:", error );
    res.status( 500 ).json( {
      mensaje: "Error al generar el archivo CSV de reservas.",
      error: error.message,
    } );
  }
};