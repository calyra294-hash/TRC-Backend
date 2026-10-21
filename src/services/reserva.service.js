import { formatearFecha } from "../utils/dateFormatter.js";
import { db } from "../config/firebase.js"

export const exportarReservasCSVService = async () => {
  const snapshot = await db.collection( "reservas" ).get();

  const reservas = snapshot.docs.map( ( doc ) => ( {
    id: doc.id,
    ...doc.data(),
  } ) );

  // Función para escapar correctamente valores CSV (evita saltos de línea o comas rotas)
  const escapar = ( valor ) => {
    if ( valor === null || valor === undefined ) return "";
    const str = String( valor );
    if ( str.includes( "," ) || str.includes( '"' ) || str.includes( "\n" ) )
    {
      return `"${ str.replace( /"/g, '""' ) }"`;
    }
    return str;
  };

  // Encabezados normalizados en snake_case para el ETL (incluyendo id_alquiler)
  const encabezados = [
    "id_reserva",
    "id_alquiler",
    "id_usuario",
    "estado_aprobacion",
    "fecha_inicio",
    "fecha_fin",
    "monto_total",
    "id_vehiculo",
    "marca_vehiculo",
    "modelo_vehiculo",
    "anio_vehiculo",
    "placa_vehiculo",
    "url_imagen_vehiculo",
    "valor_dia_vehiculo",
  ];

  const lineas = [ encabezados.join( "," ) ];

  reservas.forEach( ( res ) => {
    // Manejo seguro del mapa anidado 'vehiculo'
    const vehiculo = res.vehiculo || {};

    // Formatear fechas incluyendo la hora (true)
    const fechaInicio = formatearFecha( res.fecha_inicio, true );
    const fechaFin = formatearFecha( res.fecha_fin, true );

    const fila = [
      escapar( res.id_reserva || res.id ),
      escapar( res.id_alquiler ), 
      escapar( res.id_usuario ),
      escapar( res.estado_aprobacion ),
      escapar( fechaInicio ),
      escapar( fechaFin ),
      res.monto_total ?? "",
      escapar( vehiculo.id_vehiculo ),
      escapar( vehiculo.marca ),
      escapar( vehiculo.modelo ),
      vehiculo.anio ?? "",
      escapar( vehiculo.placa ),
      escapar( vehiculo.url_imagen ),
      vehiculo.valor_dia ?? "",
    ];

    lineas.push( fila.join( "," ) );
  } );

  return {
    filename: `reservas-${ new Date().toISOString().slice( 0, 10 ) }.csv`,
    csvContent: lineas.join( "\n" ),
  };
};