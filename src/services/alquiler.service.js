
import { db } from "../config/firebase.js";
import { supabase } from "../config/supabase.js";

const COLECCION = "alquiler";

const esAdministrador = (rol) =>
  ["admin", "administrador"].includes(
    String(rol || "").trim().toLowerCase()
  );

const calcularDias = (inicio, fin) => {
  if (!inicio || !fin) return 0;

  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);

  if (
    !Number.isFinite(fechaInicio.getTime()) ||
    !Number.isFinite(fechaFin.getTime())
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.ceil(
      (fechaFin.getTime() - fechaInicio.getTime()) /
      (1000 * 60 * 60 * 24)
    )
  );
};

// OBTENER ALQUILERES DESDE FIRESTORE
export const obtenerAlquileresService = async (usuario) => {
  if (!usuario || !usuario.uid) {
    throw new Error("No se pudo identificar al usuario.");
  }

  const snapshot = await db.collection(COLECCION).get();

  let alquileres = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Los clientes solamente pueden consultar sus alquileres.
  if (!esAdministrador(usuario.rol)) {
    alquileres = alquileres.filter(
      (alquiler) => alquiler.uid_usuario === usuario.uid
    );
  }

  if (alquileres.length === 0) {
    return [];
  }

  // Consultar los vehículos en Supabase sin modificar el catálogo.
  const idsCoche = [
    ...new Set(
      alquileres
        .map((alquiler) => Number(alquiler.id_coche))
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ];

  let coches = [];

  if (idsCoche.length > 0) {
    const { data, error } = await supabase
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

    if (error) {
      throw new Error(
        `Error al consultar los vehículos: ${error.message}`
      );
    }

    coches = data || [];
  }

  return alquileres
    .map((alquiler) => {
      const coche = coches.find(
        (item) =>
          String(item.id_coche) === String(alquiler.id_coche)
      );

      const vehiculoGuardado = alquiler.vehiculo || {};

      const fechaInicio = alquiler.fecha_inicio || null;
      const fechaFin = alquiler.fecha_fin || null;

      return {
        id: String(alquiler.id_alquiler || alquiler.id),
        id_alquiler: alquiler.id_alquiler || alquiler.id,
        id_reserva: String(alquiler.id_reserva || ""),
        uid_usuario: alquiler.uid_usuario || "",
        id_usuario: alquiler.id_usuario || null,
        id_coche: alquiler.id_coche || null,

        estado_alquiler: alquiler.estado || "Sin estado",
        estado: alquiler.estado || "Sin estado",

        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        fecha_entrega: alquiler.fecha_entrega || null,
        fecha_devolucion: alquiler.fecha_devolucion || null,

        monto_final: Number(alquiler.monto_final) || 0,
        cantidad_dias:
          Number(alquiler.cantidad_dias) ||
          calcularDias(fechaInicio, fechaFin),

        vehiculo: {
          id_vehiculo:
            coche?.id_coche ||
            vehiculoGuardado.id_vehiculo ||
            alquiler.id_coche ||
            null,
          id_coche:
            coche?.id_coche ||
            alquiler.id_coche ||
            null,
          marca:
            coche?.marca ||
            vehiculoGuardado.marca ||
            "Vehículo",
          modelo:
            coche?.modelo ||
            vehiculoGuardado.modelo ||
            "",
          anio:
            coche?.anio ||
            vehiculoGuardado.anio ||
            "",
          placa:
            coche?.placa ||
            vehiculoGuardado.placa ||
            "",
          valor_dia:
            Number(
              coche?.valor_dia ??
              vehiculoGuardado.valor_dia
            ) || 0,
          foto_principal:
            coche?.url_imagen ||
            vehiculoGuardado.url_imagen ||
            null,
          url_imagen:
            coche?.url_imagen ||
            vehiculoGuardado.url_imagen ||
            null,
        },

        especificaciones: {
          estado_general:
            alquiler.especificaciones?.estado_general ||
            "No especificado",
          kilometraje_devolucion:
            alquiler.especificaciones?.kilometraje_devolucion ??
            "No aplica",
          nivel_combustible:
            alquiler.especificaciones?.nivel_combustible ||
            "No aplica",
        },
      };
    })
    .sort((a, b) => {
      const fechaA = new Date(a.fecha_inicio || 0).getTime();
      const fechaB = new Date(b.fecha_inicio || 0).getTime();
      return fechaB - fechaA;
    });
};

// EXPORTAR ALQUILERES A CSV
export const exportarAlquileresCSVService = async () => {
  const snapshot = await db.collection(COLECCION).get();

  const columnas = [
    "id_alquiler",
    "id_reserva",
    "uid_usuario",
    "email_usuario",
    "id_coche",
    "estado",
    "fecha_inicio",
    "fecha_fin",
    "fecha_entrega",
    "fecha_devolucion",
    "monto_final",
  ];

  const escapar = (valor) => {
    const texto = String(valor ?? "");
    return `"${texto.replace(/"/g, '""')}"`;
  };

  const filas = snapshot.docs.map((doc) => {
    const alquiler = {
      id_alquiler: doc.id,
      ...doc.data(),
    };

    return columnas
      .map((columna) => escapar(alquiler[columna]))
      .join(",");
  });

  return {
    filename:
      `alquileres-${new Date().toISOString().slice(0, 10)}.csv`,
    csvContent: [
      columnas.join(","),
      ...filas,
    ].join("\r\n"),
  };
};
