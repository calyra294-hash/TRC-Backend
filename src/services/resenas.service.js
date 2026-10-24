import { db } from "../config/firebase.js";
import { formatearFecha } from "../utils/dateFormatter.js"

export const exportarResenasCSVService = async () => {
  const snapshot = await db.collection( "resenas" ).get();

  const resenas = snapshot.docs.map( ( doc ) => ( {
    id: doc.id,
    ...doc.data(),
  } ) );

  // Función para escapar correctamente valores CSV (maneja saltos de línea y comas en comentarios)
  const escapar = ( valor ) => {
    if ( valor === null || valor === undefined ) return "";
    const str = String( valor );
    if ( str.includes( "," ) || str.includes( '"' ) || str.includes( "\n" ) )
    {
      return `"${ str.replace( /"/g, '""' ) }"`;
    }
    return str;
  };

  const encabezados = [
    "id_resena",
    "id_alquiler",
    "id_usuario",
    "id_vehiculo",
    "marca_vehiculo",
    "modelo_vehiculo",
    "calificacion",
    "comentario",
    "fecha_creacion",
  ];

  const lineas = [ encabezados.join( "," ) ];

  resenas.forEach( ( res ) => {
    const fecha = formatearFecha( res.fecha_creacion );

    const vehiculoObj = res.vehiculo || {};

    const fila = [
      escapar( res.id ), 
      escapar( res.id_alquiler ),
      escapar( res.id_usuario ),
      escapar( vehiculoObj.id_vehiculo ),
      escapar( vehiculoObj.marca ),
      escapar( vehiculoObj.modelo ),
      res.calificacion ?? "",
      escapar( res.comentario ),
      escapar( fecha ),
    ];

    lineas.push( fila.join( "," ) );
  } );

  return {
    filename: `resenas-${ new Date().toISOString().slice( 0, 10 ) }.csv`,
    csvContent: lineas.join( "\n" ),
  };
};