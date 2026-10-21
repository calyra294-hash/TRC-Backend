import { db } from "../config/firebase.js";
import { formatearFecha } from "../utils/dateFormatter.js";

export const exportarUsuariosCSVService = async () => {
  const snapshot = await db.collection( "usuario" ).get();

  const usuarios = snapshot.docs.map( ( doc ) => ( {
    id: doc.id,
    ...doc.data(),
  } ) );

  // Función para escapar correctamente valores CSV
  const escapar = ( valor ) => {
    if ( valor === null || valor === undefined ) return "";
    const str = String( valor );
    if ( str.includes( "," ) || str.includes( '"' ) || str.includes( "\n" ) )
    {
      return `"${ str.replace( /"/g, '""' ) }"`;
    }
    return str;
  };

  // Encabezados normalizados en snake_case para la dimensión de usuarios
  const encabezados = [
    "id_usuario",
    "nombre1",
    "nombre2",
    "apellido1",
    "apellido2",
    "email",
    "telefono",
    "direccion",
    "fecha_nacimiento",
    "rol",
    "numero_cedula",
    "url_cedula",
    "licencia",
    "tipo_licencia",
    "url_licencia",
  ];

  const lineas = [ encabezados.join( "," ) ];

  usuarios.forEach( ( user ) => {
    // Para fecha de nacimiento solo necesitamos la fecha (false), no la hora
    const fechaNacimiento = formatearFecha( user.fecha_nacimiento, false );

    const fila = [
      escapar( user.id_usuario || user.id ),
      escapar( user.nombre1 ),
      escapar( user.nombre2 ),
      escapar( user.apellido1 ),
      escapar( user.apellido2 ),
      escapar( user.email ),
      escapar( user.telefono ),
      escapar( user.direccion ),
      escapar( fechaNacimiento ),
      escapar( user.rol ),
      escapar( user.numero_cedula ),
      escapar( user.url_cedula ),
      escapar( user.licencia ),
      escapar( user.tipo_licencia ),
      escapar( user.url_licencia ),
    ];

    lineas.push( fila.join( "," ) );
  } );

  return {
    filename: `usuarios-${ new Date().toISOString().slice( 0, 10 ) }.csv`,
    csvContent: lineas.join( "\n" ),
  };
};