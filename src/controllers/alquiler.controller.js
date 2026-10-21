import { obtenerAlquileresService, exportarAlquileresCSVService } from "../services/alquiler.service.js";

// OBTENER TODOS LOS ALQUILERES
export const obtenerAlquileres = async ( req, res ) => {
  try
  {
    const { id_usuario } = req.query;

    const alquileres = await obtenerAlquileresService(
      id_usuario || null
    );

    res.status( 200 ).json( alquileres );
  } catch ( error )
  {
    console.error( "Error al obtener los alquileres:", error );

    res.status( 500 ).json( {
      mensaje: "Error al obtener la lista de alquileres.",
      error: error.message,
    } );
  }
};

export const exportarAlquilerCSV = async ( req, res ) => {
  try
  {
    const { filename, csvContent } = await exportarAlquileresCSVService();

    res.setHeader( "Content-Type", "text/csv; charset=utf-8" );
    res.setHeader( "Content-Disposition", `attachment; filename="${ filename }"` );

    // BOM UTF-8 para correcta visualización en Excel
    res.write( "\uFEFF" );
    res.end( csvContent );
  } catch ( error )
  {
    console.error( "Error al exportar alquileres a CSV:", error );
    res.status( 500 ).json( {
      mensaje: "Error al generar el archivo CSV de alquileres.",
      error: error.message,
    } );
  }
};