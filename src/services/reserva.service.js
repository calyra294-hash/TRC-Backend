
import { supabase } from "../config/supabase.js";
import { formatearFecha } from "../utils/dateFormatter.js";

// Obtener reservas desde Supabase
export const obtenerReservasService = async (idUsuario = null) => {
  let consulta = supabase
    .from("reserva")
    .select(`
      id_reserva,
      id_usuario,
      id_coche,
      fecha_inicio,
      fecha_fin,
      estado_aprobacion,
      monto_total,
      coche:coche (
        id_coche,
        marca,
        modelo,
        anio,
        placa,
        url_imagen,
        valor_dia
      )
    `)
    .order("id_reserva", { ascending: false });

  if (idUsuario !== null && idUsuario !== undefined) {
    consulta = consulta.eq("id_usuario", idUsuario);
  }

  const { data, error } = await consulta;

  if (error) {
    throw new Error(`Error al consultar reservas: ${error.message}`);
  }

  return (data || []).map((reserva) => ({
    ...reserva,
    id: String(reserva.id_reserva),
    id_vehiculo: reserva.id_coche,
    vehiculo: reserva.coche
      ? {
        id_vehiculo: reserva.coche.id_coche,
        marca: reserva.coche.marca,
        modelo: reserva.coche.modelo,
        anio: reserva.coche.anio,
        placa: reserva.coche.placa,
        url_imagen: reserva.coche.url_imagen,
        valor_dia: reserva.coche.valor_dia,
      }
      : null,
  }));
};

// Exportar reservas a CSV
export const exportarReservasCSVService = async () => {
  const reservas = await obtenerReservasService();

  const escapar = (valor) => {
    if (valor === null || valor === undefined) return "";

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

  const lineas = [encabezados.join(",")];

  reservas.forEach((reserva) => {
    const vehiculo = reserva.vehiculo || {};

    const fechaInicio = formatearFecha(reserva.fecha_inicio, true);
    const fechaFin = formatearFecha(reserva.fecha_fin, true);

    const fila = [
      escapar(reserva.id_reserva),
      escapar(""),
      escapar(reserva.id_usuario),
      escapar(reserva.estado_aprobacion),
      escapar(fechaInicio),
      escapar(fechaFin),
      escapar(reserva.monto_total),
      escapar(vehiculo.id_vehiculo),
      escapar(vehiculo.marca),
      escapar(vehiculo.modelo),
      escapar(vehiculo.anio),
      escapar(vehiculo.placa),
      escapar(vehiculo.url_imagen),
      escapar(vehiculo.valor_dia),
    ];

    lineas.push(fila.join(","));
  });

  return {
    filename: `reservas-${new Date().toISOString().slice(0, 10)}.csv`,
    csvContent: lineas.join("\n"),
  };
};
