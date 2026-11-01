
import { db } from "../config/firebase.js";
import { supabase } from "../config/supabase.js";
import { formatearFecha } from "../utils/dateFormatter.js";

const COLECCION = "resenas";
const COLECCION_ALQUILER = "alquiler";

const obtenerTiempo = (fecha) => {
  if (!fecha) return 0;

  if (fecha.toDate) {
    return fecha.toDate().getTime();
  }

  return new Date(fecha).getTime() || 0;
};

const obtenerFechaISO = (fecha) => {
  if (!fecha) return null;

  const fechaDate = fecha.toDate
    ? fecha.toDate()
    : new Date(fecha);

  return Number.isNaN(fechaDate.getTime())
    ? null
    : fechaDate.toISOString();
};

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

    if (String(alquiler.uid_usuario || "") !== String(usuario.uid)) {
      const error = new Error(
        "No tienes permiso para calificar este alquiler."
      );
      error.status = 403;
      throw error;
    }

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

    const nuevaResena = {
      id_alquiler: idAlquiler,
      id_usuario: usuario.uid,
      id_vehiculo: idVehiculo,
      calificacion,
      comentario,
      fecha_creacion: new Date(),
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

  resenas.sort((a, b) =>
    obtenerTiempo(b.fecha_creacion) - obtenerTiempo(a.fecha_creacion)
  );

  const total = resenas.length;

  const promedio = total > 0
    ? Number((
      resenas.reduce(
        (suma, resena) => suma + Number(resena.calificacion || 0),
        0
      ) / total
    ).toFixed(1))
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
    .sort((a, b) =>
      obtenerTiempo(b.fecha_creacion) - obtenerTiempo(a.fecha_creacion)
    );
};

// OBTENER TODAS LAS RESEÑAS PARA EL ADMINISTRADOR
export const obtenerTodasResenasAdminService = async () => {
  const snapshot = await db.collection(COLECCION).get();

  const resenasOriginales = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  resenasOriginales.sort((a, b) =>
    obtenerTiempo(b.fecha_creacion) - obtenerTiempo(a.fecha_creacion)
  );

  const idsUsuarios = [
    ...new Set(
      resenasOriginales
        .map((resena) => String(resena.id_usuario || "").trim())
        .filter(Boolean)
    ),
  ];

  const idsVehiculos = [
    ...new Set(
      resenasOriginales
        .map((resena) => String(resena.id_vehiculo || "").trim())
        .filter(Boolean)
    ),
  ];

  // Consultar perfiles de clientes en Firestore.
  const referenciasUsuarios = idsUsuarios.map((uid) =>
    db.collection("usuario").doc(uid)
  );

  const snapshotsUsuarios = referenciasUsuarios.length > 0
    ? await db.getAll(...referenciasUsuarios)
    : [];

  const mapaUsuarios = new Map();

  snapshotsUsuarios.forEach((doc) => {
    if (!doc.exists) return;

    const usuario = doc.data() || {};

    const nombre = [
      usuario.nombre1,
      usuario.nombre2,
      usuario.apellido1,
      usuario.apellido2,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

    mapaUsuarios.set(doc.id, {
      nombre: nombre || "Cliente sin nombre",
      email: usuario.email || "",
    });
  });

  // Consultar los vehículos en Supabase.
  const mapaVehiculos = new Map();

  if (idsVehiculos.length > 0) {
    const { data: vehiculos, error } = await supabase
      .from("coche")
      .select("id_coche, marca, modelo")
      .in("id_coche", idsVehiculos);

    if (error) {
      console.error("Error al consultar vehículos de las reseñas:", error);
      throw new Error("No se pudieron consultar los vehículos de las reseñas.");
    }

    (vehiculos || []).forEach((vehiculo) => {
      mapaVehiculos.set(String(vehiculo.id_coche), {
        id_vehiculo: String(vehiculo.id_coche),
        marca: vehiculo.marca || "",
        modelo: vehiculo.modelo || "",
        nombre: `${vehiculo.marca || ""} ${vehiculo.modelo || ""}`.trim(),
      });
    });
  }

  const resenas = resenasOriginales.map((resena) => {
    const uid = String(resena.id_usuario || "");
    const idVehiculo = String(resena.id_vehiculo || "");

    return {
      ...resena,
      fecha_creacion: obtenerFechaISO(resena.fecha_creacion),
      cliente: mapaUsuarios.get(uid) || {
        nombre: "Cliente no encontrado",
        email: "",
      },
      vehiculo: mapaVehiculos.get(idVehiculo) || {
        id_vehiculo: idVehiculo,
        marca: "",
        modelo: "",
        nombre: "Vehículo no encontrado",
      },
    };
  });

  const total = resenas.length;

  const promedio = total > 0
    ? Number((
      resenas.reduce(
        (suma, resena) => suma + Number(resena.calificacion || 0),
        0
      ) / total
    ).toFixed(1))
    : 0;

  const distribucion = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  resenas.forEach((resena) => {
    const estrellas = Number(resena.calificacion);

    if (Number.isInteger(estrellas) && distribucion[estrellas] !== undefined) {
      distribucion[estrellas]++;
    }
  });

  return {
    total,
    promedio,
    distribucion,
    resenas,
  };
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
