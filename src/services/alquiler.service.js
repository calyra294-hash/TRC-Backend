import { supabase } from "../config/supabase.js";
import { db } from "../config/firebase.js"
import { formatearFecha } from "../utils/dateFormatter.js"

const COLECCION = "alquiler";

// OBTENER TODOS LOS ALQUILERES
export const obtenerAlquileresService = async ( idUsuario = null ) => {
  try
  {
    const { data: alquileres, error: errorAlquileres } = await supabase
      .from( COLECCION )
      .select( `
                id_alquiler,
                id_reserva,
                fecha_inicio,
                fecha_fin,
                estado,
                fecha_entrega,
                fecha_devolucion,
                monto_final,
                especificaciones
            `)
      .order( "id_alquiler", { ascending: false } );

    if ( errorAlquileres )
    {
      throw new Error(
        `Error al consultar alquileres: ${ errorAlquileres.message }`
      );
    }

    if ( !alquileres || alquileres.length === 0 )
    {
      return [];
    }

    const idsAlquiler = alquileres.map(
      ( alquiler ) => alquiler.id_alquiler
    );

    const { data: detalles, error: errorDetalles } = await supabase
      .from( "detalle_alquiler" )
      .select( `
                id_detalle_alquiler,
                id_alquiler,
                id_usuario,
                id_vehiculo,
                precio_total,
                cantidad_dias
            `)
      .in( "id_alquiler", idsAlquiler );

    if ( errorDetalles )
    {
      throw new Error(
        `Error al consultar detalles de alquiler: ${ errorDetalles.message }`
      );
    }

    let detallesFiltrados = detalles || [];

    if ( idUsuario )
    {
      detallesFiltrados = detallesFiltrados.filter(
        ( detalle ) =>
          String( detalle.id_usuario ) === String( idUsuario )
      );
    }

    if ( detallesFiltrados.length === 0 )
    {
      return [];
    }

    const idsVehiculo = [
      ...new Set(
        detallesFiltrados
          .map( ( detalle ) => detalle.id_vehiculo )
          .filter( Boolean )
      ),
    ];

    let vehiculos = [];

    if ( idsVehiculo.length > 0 )
    {
      const { data: datosVehiculos, error: errorVehiculos } =
        await supabase
          .from( "vehiculo" )
          .select( `
                        id_vehiculo,
                        marca,
                        modelo,
                        placa,
                        valor_dia,
                        url_imagen
                    `)
          .in( "id_vehiculo", idsVehiculo );

      if ( errorVehiculos )
      {
        throw new Error(
          `Error al consultar vehículos: ${ errorVehiculos.message }`
        );
      }

      vehiculos = datosVehiculos || [];
    }

    const resultado = detallesFiltrados
      .map( ( detalle ) => {
        const alquiler = alquileres.find(
          ( item ) =>
            String( item.id_alquiler ) ===
            String( detalle.id_alquiler )
        );

        if ( !alquiler )
        {
          return null;
        }

        const vehiculo = vehiculos.find(
          ( item ) =>
            String( item.id_vehiculo ) ===
            String( detalle.id_vehiculo )
        );

        const especificaciones =
          alquiler.especificaciones || {};

        return {
          id: String( alquiler.id_alquiler ),
          id_alquiler: alquiler.id_alquiler,

          id_reserva: alquiler.id_reserva
            ? String( alquiler.id_reserva )
            : "",

          id_usuario: detalle.id_usuario,
          id_vehiculo: detalle.id_vehiculo,

          estado_alquiler:
            alquiler.estado || "Sin estado",

          fecha_inicio:
            alquiler.fecha_inicio || null,

          fecha_fin:
            alquiler.fecha_fin || null,

          fecha_entrega:
            alquiler.fecha_entrega || null,

          fecha_devolucion:
            alquiler.fecha_devolucion || null,

          monto_final:
            Number( alquiler.monto_final ) ||
            Number( detalle.precio_total ) ||
            0,

          cantidad_dias:
            Number( detalle.cantidad_dias ) || 0,

          vehiculo: {
            id_vehiculo:
              vehiculo?.id_vehiculo ||
              detalle.id_vehiculo,

            marca:
              vehiculo?.marca ||
              "Vehículo",

            modelo:
              vehiculo?.modelo ||
              "",

            placa:
              vehiculo?.placa ||
              "",

            valor_dia:
              Number( vehiculo?.valor_dia ) || 0,

            foto_principal:
              vehiculo?.url_imagen ||
              null,
          },

          especificaciones: {
            estado_general:
              especificaciones.estado_general ||
              "No especificado",

            kilometraje_devolucion:
              especificaciones.kilometraje_devolucion ??
              "No aplica",

            nivel_combustible:
              especificaciones.nivel_combustible ||
              "No aplica",
          },
        };
      } )
      .filter( Boolean );

    return resultado;
  } catch ( error )
  {
    throw new Error(
      `Error al consultar alquileres: ${ error.message }`
    );
  }
};

export const exportarAlquileresCSVService = async () => {
  const snapshot = await db.collection( "alquiler" ).get();

  const alquileres = snapshot.docs.map( ( doc ) => ( {
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

  // Encabezados combinados (Campos base + Propiedades aplanadas del vehiculo)
  const encabezados = [
    "id_alquiler",
    "id_reserva",
    "estado",
    "fecha_inicio",
    "fecha_fin",
    "fecha_entrega",
    "fecha_devolucion",
    "monto_final",
    "id_vehiculo",
    "marca_vehiculo",
    "modelo_vehiculo",
    "anio_vehiculo",
    "placa_vehiculo",
    "valor_dia_vehiculo",
  ];

  const lineas = [ encabezados.join( "," ) ];

  alquileres.forEach( ( alq ) => {
    // Manejo seguro del mapa anidado 'vehiculo'
    const vehiculo = alq.vehiculo || {};

    // Formatear cada campo de fecha de forma independiente y robusta
    const fechaInicio = formatearFecha(alq.fecha_inicio, true);
    const fechaFin = formatearFecha(alq.fecha_fin, true);
    const fechaEntrega = formatearFecha(alq.fecha_entrega, true);
    const fechaDevolucion = formatearFecha(alq.fecha_devolucion, true);

    const fila = [
      escapar( alq.id_alquiler || alq.id ),
      escapar( alq.id_reserva ),
      escapar( alq.estado ),
      escapar( fechaInicio ),
      escapar( fechaFin ),
      escapar( fechaEntrega ),
      escapar( fechaDevolucion ),
      alq.monto_final ?? "",
      escapar( vehiculo.id_vehiculo ),
      escapar( vehiculo.marca ),
      escapar( vehiculo.modelo ),
      vehiculo.anio ?? "",
      escapar( vehiculo.placa ),
      vehiculo.valor_dia ?? "",
    ];

    lineas.push( fila.join( "," ) );
  } );

  return {
    filename: `alquileres-${ new Date().toISOString().slice( 0, 10 ) }.csv`,
    csvContent: lineas.join( "\n" ),
  };
};