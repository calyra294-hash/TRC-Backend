
import { supabase } from "../config/supabase.js";

const COLECCION = "alquiler";

// OBTENER ALQUILERES
// Si se recibe un idUsuario, devuelve solamente sus alquileres.
// Si no se recibe, devuelve todos para los usos administrativos
// y para la exportación general.

export const obtenerAlquileresService = async (idUsuario = null) => {
  try {
    const { data: alquileres, error: errorAlquileres } =
      await supabase
        .from(COLECCION)
        .select(`
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
        .order("id_alquiler", { ascending: false });

    if (errorAlquileres) {
      throw new Error(errorAlquileres.message);
    }

    if (!alquileres || alquileres.length === 0) {
      return [];
    }

    const idsAlquiler = alquileres
      .map((alquiler) => alquiler.id_alquiler)
      .filter((id) => id !== null && id !== undefined);

    if (idsAlquiler.length === 0) {
      return [];
    }

    const { data: detalles, error: errorDetalles } =
      await supabase
        .from("detalle_alquiler")
        .select(`
          id_detalle_alquiler,
          id_alquiler,
          id_usuario,
          id_coche,
          precio_total,
          valor_dia,
          cantidad_dias
        `)
        .in("id_alquiler", idsAlquiler);

    if (errorDetalles) {
      throw new Error(errorDetalles.message);
    }

    // Filtrar los alquileres por el usuario solicitado.
    // Un usuario nuevo sin registros recibe una lista vacía.
    let detallesFiltrados = detalles || [];

    if (
      idUsuario !== null &&
      idUsuario !== undefined &&
      String(idUsuario).trim() !== ""
    ) {
      detallesFiltrados = detallesFiltrados.filter(
        (detalle) =>
          String(detalle.id_usuario) === String(idUsuario)
      );
    }

    if (detallesFiltrados.length === 0) {
      return [];
    }

    const idsCoche = [
      ...new Set(
        detallesFiltrados
          .map((detalle) => detalle.id_coche)
          .filter((id) => id !== null && id !== undefined)
      ),
    ];

    let coches = [];

    if (idsCoche.length > 0) {
      const { data: datosCoches, error: errorCoches } =
        await supabase
          .from("coche")
          .select(`
            id_coche,
            marca,
            modelo,
            anio,
            placa,
            valor_dia,
            url_imagen
          `)
          .in("id_coche", idsCoche);

      if (errorCoches) {
        throw new Error(errorCoches.message);
      }

      coches = datosCoches || [];
    }

    const resultado = detallesFiltrados
      .map((detalle) => {
        const alquiler = alquileres.find(
          (item) =>
            String(item.id_alquiler) ===
            String(detalle.id_alquiler)
        );

        if (!alquiler) {
          return null;
        }

        const coche = coches.find(
          (item) =>
            String(item.id_coche) ===
            String(detalle.id_coche)
        );

        const especificaciones = alquiler.especificaciones || {};

        return {
          id: String(alquiler.id_alquiler),
          id_alquiler: alquiler.id_alquiler,
          id_reserva: alquiler.id_reserva ?? "",
          id_usuario: detalle.id_usuario,

          // Se conserva para compatibilidad con la aplicación móvil.
          id_vehiculo: detalle.id_coche,

          estado_alquiler: alquiler.estado || "Sin estado",
          estado: alquiler.estado || "Sin estado",

          fecha_inicio: alquiler.fecha_inicio || null,
          fecha_fin: alquiler.fecha_fin || null,
          fecha_entrega: alquiler.fecha_entrega || null,
          fecha_devolucion: alquiler.fecha_devolucion || null,

          monto_final:
            Number(alquiler.monto_final) ||
            Number(detalle.precio_total) ||
            0,

          cantidad_dias: Number(detalle.cantidad_dias) || 0,

          vehiculo: {
            id_vehiculo: coche?.id_coche ?? detalle.id_coche,
            id_coche: coche?.id_coche ?? detalle.id_coche,
            marca: coche?.marca || "Vehículo",
            modelo: coche?.modelo || "",
            anio: coche?.anio ?? "",
            placa: coche?.placa || "",
            valor_dia:
              Number(coche?.valor_dia ?? detalle.valor_dia) || 0,
            foto_principal: coche?.url_imagen || null,
            url_imagen: coche?.url_imagen || null,
          },

          especificaciones: {
            estado_general:
              especificaciones.estado_general || "No especificado",
            kilometraje_devolucion:
              especificaciones.kilometraje_devolucion ?? "No aplica",
            nivel_combustible:
              especificaciones.nivel_combustible || "No aplica",
          },
        };
      })
      .filter(Boolean);

    return resultado;
  } catch (error) {
    throw new Error(
      `Error al consultar alquileres: ${error.message}`
    );
  }
};

// EXPORTAR ALQUILERES A CSV
export const exportarAlquileresCSVService = async () => {
  const alquileres = await obtenerAlquileresService();

  const escapar = (valor) => {
    if (valor === null || valor === undefined) {
      return "";
    }

    const str = String(valor);

    if (
      str.includes(",") ||
      str.includes('"') ||
      str.includes("\n") ||
      str.includes("\r")
    ) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  };

  const encabezados = [
    "id_alquiler",
    "id_reserva",
    "id_usuario",
    "estado",
    "fecha_inicio",
    "fecha_fin",
    "fecha_entrega",
    "fecha_devolucion",
    "monto_final",
    "cantidad_dias",
    "id_coche",
    "marca_coche",
    "modelo_coche",
    "anio_coche",
    "placa_coche",
    "valor_dia",
    "url_imagen",
  ];

  const lineas = [encabezados.join(",")];

  alquileres.forEach((alq) => {
    const vehiculo = alq.vehiculo || {};

    const fila = [
      escapar(alq.id_alquiler ?? alq.id),
      escapar(alq.id_reserva),
      escapar(alq.id_usuario),
      escapar(alq.estado),
      escapar(alq.fecha_inicio),
      escapar(alq.fecha_fin),
      escapar(alq.fecha_entrega),
      escapar(alq.fecha_devolucion),
      alq.monto_final ?? 0,
      alq.cantidad_dias ?? 0,
      escapar(vehiculo.id_coche ?? vehiculo.id_vehiculo),
      escapar(vehiculo.marca),
      escapar(vehiculo.modelo),
      escapar(vehiculo.anio),
      escapar(vehiculo.placa),
      vehiculo.valor_dia ?? 0,
      escapar(vehiculo.url_imagen),
    ];

    lineas.push(fila.join(","));
  });

  return {
    filename: `alquileres-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`,
    csvContent: lineas.join("\n"),
  };
};
