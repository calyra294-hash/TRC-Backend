import { db } from "../config/firebase.js";
import { formatearFecha } from "../utils/dateFormatter.js";

const COLECCION = "resenas";
const COLECCION_ALQUILER = "alquiler";

// REGISTRAR RESEÑA
export const registrarResenaService = async (datos, usuario) => {
  const idAlquiler = String(datos.id_alquiler || "").trim();
  const calificacion = Number(datos.calificacion);
  const comentario = String(datos.comentario || "").trim();

  if (!idAlquiler) {
    const error = new Error("Debes indicar el alquiler que deseas calificar.");
    error.status = 400;
    throw error;
  }

  if (
    !Number.isInteger(calificacion) ||
    calificacion < 1 ||
    calificacion > 5
  ) {
    const error = new Error("La calificación debe estar entre 1 y 5 estrellas.");
    error.status = 400;
    throw error;
  }

  if (!comentario) {
    const error = new Error("Debes escribir un comentario.");
    error.status = 400;
    throw error;
  }

  if (comentario.length > 1000) {
    const error = new Error("El comentario no puede superar los 1000 caracteres.");
    error.status = 400;
    throw error;
  }

  const alquilerRef = db.collection(COLECCION_ALQUILER).doc(idAlquiler);
  const nuevaResenaRef = db.collection(COLECCION).doc();

  return db.runTransaction(async (transaction) => {
    const alquilerSnapshot = await transaction.get(alquilerRef);

    if (!alquilerSnapshot.exists) {
      const error = new Error("No se encontró el alquiler.");
      error.status = 404;
      throw error;
    }

    const alquiler = alquilerSnapshot.data();

    // Verificar que el alquiler pertenezca al cliente autenticado.
    if (String(alquiler.uid_usuario || "") !== String(usuario.uid)) {
      const error = new Error(
        "No tienes permiso para calificar este alquiler."
      );
      error.status = 403;
      throw error;
    }

    // Solo se pueden calificar alquileres completados.
    if (String(alquiler.estado || "").toLowerCase() !== "completado") {
      const error = new Error(
        "Solo puedes calificar vehículos de alquileres completados."
      );
      error.status = 400;
      throw error;
    }

    const idVehiculo = String(alquiler.id_coche || "").trim();

    if (!idVehiculo) {
      const error = new Error(
        "No se encontró el vehículo relacionado con el alquiler."
      );
      error.status = 400;
      throw error;
    }

    // Evitar que un alquiler tenga más de una reseña.
    const resenasExistentes = db
      .collection(COLECCION)
      .where("id_alquiler", "==", idAlquiler)
      .limit(1);

    const resenasSnapshot = await transaction.get(resenasExistentes);

    if (!resenasSnapshot.empty) {
      const error = new Error(
        "Ya has publicado una reseña para este alquiler."
      );
      error.status = 409;
      throw error;
    }

    const fechaActual = new Date();

    const nuevaResena = {
      id_alquiler: idAlquiler,
      id_usuario: usuario.uid,
      id_vehiculo: idVehiculo,
      calificacion,
      comentario,
      fecha_creacion: fechaActual,
    };

    transaction.set(nuevaResenaRef, nuevaResena);

    return {
      id: nuevaResenaRef.id,
      ...nuevaResena,
    };
  });
};

// OBTENER RESEÑAS DE UN VEHÍCULO
export const obtenerResenasVehiculoService = async (idVehiculo) => {
  const snapshot = await db
    .collection(COLECCION)
    .where("id_vehiculo", "==", String(idVehiculo))
    .get();

  const resenas = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  resenas.sort((a, b) => {
    const fechaA = a.fecha_creacion?.toDate
      ? a.fecha_creacion.toDate().getTime()
      : new Date(a.fecha_creacion || 0).getTime();

    const fechaB = b.fecha_creacion?.toDate
      ? b.fecha_creacion.toDate().getTime()
      : new Date(b.fecha_creacion || 0).getTime();

    return fechaB - fechaA;
  });

  const total = resenas.length;

  const promedio = total > 0
    ? Number(
      (
        resenas.reduce(
          (suma, resena) => suma + Number(resena.calificacion || 0),
          0
        ) / total
      ).toFixed(1)
    )
    : 0;

  return {
    promedio,
    total,
    resenas,
  };
};

// OBTENER RESEÑAS DEL CLIENTE AUTENTICADO
export const obtenerMisResenasService = async (uid) => {
  const snapshot = await db
    .collection(COLECCION)
    .where("id_usuario", "==", uid)
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .sort((a, b) => {
      const fechaA = a.fecha_creacion?.toDate
        ? a.fecha_creacion.toDate().getTime()
        : new Date(a.fecha_creacion || 0).getTime();

      const fechaB = b.fecha_creacion?.toDate
        ? b.fecha_creacion.toDate().getTime()
        : new Date(b.fecha_creacion || 0).getTime();

      return fechaB - fechaA;
    });
};

// EXPORTAR RESEÑAS A CSV
export const exportarResenasCSVService = async () => {
  const snapshot = await db.collection(COLECCION).get();

  const resenas = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

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

  const lineas = [encabezados.join(",")];

  resenas.forEach((res) => {
    const fecha = formatearFecha(res.fecha_creacion);
    const vehiculo = res.vehiculo || {};

    const fila = [
      escapar(res.id),
      escapar(res.id_alquiler),
      escapar(res.id_usuario),
      escapar(res.id_vehiculo || vehiculo.id_vehiculo),
      escapar(vehiculo.marca),
      escapar(vehiculo.modelo),
      escapar(res.calificacion),
      escapar(res.comentario),
      escapar(fecha),
    ];

    lineas.push(fila.join(","));
  });

  return {
    filename: `resenas-${new Date().toISOString().slice(0, 10)}.csv`,
    csvContent: lineas.join("\n"),
  };
};