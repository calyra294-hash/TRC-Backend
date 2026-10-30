
import { db } from "../config/firebase.js";
import { supabase } from "../config/supabase.js";

const COLECCION = "reservas";
const COLECCION_ALQUILER = "alquiler";

// Obtener perfil del usuario desde Firebase
const obtenerPerfil = async (uid) => {
  const documento = await db.collection("usuario").doc(uid).get();
  return documento.exists ? documento.data() : {};
};

// Verificar rol de administrador
const esAdministrador = (rol) => {
  return ["admin", "administrador"].includes(
    String(rol || "").trim().toLowerCase()
  );
};

// Obtener información del vehículo desde Supabase
const obtenerVehiculo = async (idCoche) => {
  if (idCoche === undefined || idCoche === null || idCoche === "") {
    return null;
  }

  const id = Number(idCoche);

  if (!Number.isFinite(id)) {
    return null;
  }

  const { data, error } = await supabase
    .from("coche")
    .select(`
      id_coche,
      marca,
      modelo,
      anio,
      color,
      placa,
      valor_dia,
      url_imagen,
      estado,
      descripcion
    `)
    .eq("id_coche", id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Error al consultar el vehículo ${id}: ${error.message}`
    );
  }

  if (!data) {
    return null;
  }

  return {
    id: String(data.id_coche),
    id_coche: data.id_coche,
    marca: data.marca || "",
    modelo: data.modelo || "",
    nombre: `${data.marca || ""} ${data.modelo || ""}`.trim(),
    anio: data.anio ?? null,
    color: data.color || "",
    placa: data.placa || "",
    precio: Number(data.valor_dia) || 0,
    valor_dia: Number(data.valor_dia) || 0,
    imagen: data.url_imagen || null,
    url_imagen: data.url_imagen || null,
    estado: data.estado || "",
    descripcion: data.descripcion || "",
  };
};

// Agregar información del vehículo sin modificar Firebase
const completarReservaConVehiculo = async (reserva) => {
  const coche = await obtenerVehiculo(reserva.id_coche);

  return {
    ...reserva,
    coche,
  };
};

// CREAR RESERVA EN FIRESTORE
export const crearReservaService = async (datos, usuario) => {
  if (!usuario || !usuario.uid) {
    throw new Error("No se pudo identificar al usuario autenticado.");
  }

  const idCoche = Number(datos.id_coche);
  const montoTotal = Number(datos.monto_total);

  if (!Number.isFinite(idCoche) || idCoche <= 0) {
    throw new Error("El vehículo seleccionado no es válido.");
  }

  if (
    !datos.fecha_inicio ||
    !datos.fecha_fin ||
    !Number.isFinite(montoTotal) ||
    montoTotal < 0
  ) {
    throw new Error("Los datos de la reserva no son válidos.");
  }

  const reserva = {
    uid_usuario: usuario.uid,
    email_usuario: usuario.email || "",
    id_coche: idCoche,
    fecha_inicio: datos.fecha_inicio,
    fecha_fin: datos.fecha_fin,
    estado_aprobacion: "pendiente",
    monto_total: montoTotal,
    fecha_creacion: new Date().toISOString(),
  };

  const referencia = await db
    .collection(COLECCION)
    .add(reserva);

  return completarReservaConVehiculo({
    id: referencia.id,
    ...reserva,
  });
};

// OBTENER RESERVAS
export const obtenerReservasService = async (usuario) => {
  if (!usuario || !usuario.uid) {
    throw new Error("No se pudo identificar al usuario.");
  }

  const perfil = await obtenerPerfil(usuario.uid);
  let consulta = db.collection(COLECCION);

  if (!esAdministrador(perfil.rol)) {
    consulta = consulta.where("uid_usuario", "==", usuario.uid);
  }

  const snapshot = await consulta.get();

  const reservas = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return Promise.all(
    reservas.map(completarReservaConVehiculo)
  );
};

// OBTENER UNA RESERVA POR ID
export const obtenerReservaPorIdService = async (id, usuario) => {
  if (!usuario || !usuario.uid) {
    throw new Error("No se pudo identificar al usuario.");
  }

  const referencia = await db
    .collection(COLECCION)
    .doc(String(id))
    .get();

  if (!referencia.exists) {
    return null;
  }

  const reserva = {
    id: referencia.id,
    ...referencia.data(),
  };

  const perfil = await obtenerPerfil(usuario.uid);

  if (
    !esAdministrador(perfil.rol) &&
    reserva.uid_usuario !== usuario.uid
  ) {
    const error = new Error(
      "No tenés permiso para consultar esta reserva."
    );
    error.status = 403;
    throw error;
  }

  return completarReservaConVehiculo(reserva);
};

// ACTUALIZAR ESTADO Y CREAR ALQUILER AL APROBAR
export const actualizarEstadoReservaService = async (
  id,
  estado,
  usuario
) => {
  const estadosPermitidos = [
    "pendiente",
    "aprobada",
    "rechazada",
    "cancelada",
  ];

  const estadoNuevo = String(estado || "").trim().toLowerCase();

  if (!estadosPermitidos.includes(estadoNuevo)) {
    throw new Error("El estado de la reserva no es válido.");
  }

  if (!usuario || !usuario.uid) {
    throw new Error("No se pudo identificar al usuario.");
  }

  const perfil = await obtenerPerfil(usuario.uid);

  if (!esAdministrador(perfil.rol)) {
    const error = new Error(
      "Solo el administrador puede cambiar el estado."
    );
    error.status = 403;
    throw error;
  }

  const reservaRef = db
    .collection(COLECCION)
    .doc(String(id));

  const documento = await reservaRef.get();

  if (!documento.exists) {
    return null;
  }

  const datosReserva = documento.data();

  // Si se aprueba, primero verificamos el vehículo.
  let coche = null;

  if (estadoNuevo === "aprobada") {
    coche = await obtenerVehiculo(datosReserva.id_coche);

    if (!coche) {
      throw new Error(
        "No se puede aprobar la reserva porque no se encontró el vehículo."
      );
    }
  }

  let idAlquilerCreado = null;

  await db.runTransaction(async (transaction) => {
    const reservaActual = await transaction.get(reservaRef);

    if (!reservaActual.exists) {
      const error = new Error("No se encontró la reserva.");
      error.status = 404;
      throw error;
    }

    const datosActuales = reservaActual.data();

    // Evitar crear más de un alquiler para la misma reserva.
    if (
      estadoNuevo === "aprobada" &&
      datosActuales.id_alquiler
    ) {
      const alquilerExistente = db
        .collection(COLECCION_ALQUILER)
        .doc(String(datosActuales.id_alquiler));

      const alquilerSnapshot = await transaction.get(
        alquilerExistente
      );

      if (alquilerSnapshot.exists) {
        idAlquilerCreado = datosActuales.id_alquiler;

        transaction.update(reservaRef, {
          estado_aprobacion: "aprobada",
          fecha_actualizacion: new Date().toISOString(),
        });

        return;
      }
    }

    const fechaActual = new Date().toISOString();

    if (estadoNuevo === "aprobada") {
      // Un documento determinístico evita duplicados.
      const alquilerRef = db
        .collection(COLECCION_ALQUILER)
        .doc(`alquiler_${reservaRef.id}`);

      const alquilerSnapshot = await transaction.get(alquilerRef);

      if (alquilerSnapshot.exists) {
        idAlquilerCreado = alquilerRef.id;
      } else {
        const nuevoAlquiler = {
          id_alquiler: alquilerRef.id,
          id_reserva: reservaRef.id,
          uid_usuario: datosActuales.uid_usuario || "",
          id_usuario: datosActuales.id_usuario
            ? String(datosActuales.id_usuario)
            : "",
          email_usuario: datosActuales.email_usuario || "",
          id_coche: Number(datosActuales.id_coche),
          fecha_inicio: datosActuales.fecha_inicio,
          fecha_fin: datosActuales.fecha_fin,
          estado: "pendiente_entrega",
          fecha_entrega: null,
          fecha_devolucion: null,
          monto_final: Number(datosActuales.monto_total) || 0,
          vehiculo: {
            id_vehiculo: String(coche.id_coche),
            marca: coche.marca,
            modelo: coche.modelo,
            anio: coche.anio,
            placa: coche.placa,
            url_imagen: coche.url_imagen,
            valor_dia: coche.valor_dia,
          },
          fecha_creacion: fechaActual,
        };

        transaction.set(alquilerRef, nuevoAlquiler);
        idAlquilerCreado = alquilerRef.id;
      }

      transaction.update(reservaRef, {
        estado_aprobacion: "aprobada",
        id_alquiler: idAlquilerCreado,
        fecha_actualizacion: fechaActual,
      });
    } else {
      // No permitir cancelar o rechazar una reserva que ya generó alquiler.
      if (datosActuales.id_alquiler) {
        const error = new Error(
          "Esta reserva ya tiene un alquiler generado. No se puede cambiar su estado desde aquí."
        );
        error.status = 400;
        throw error;
      }

      transaction.update(reservaRef, {
        estado_aprobacion: estadoNuevo,
        fecha_actualizacion: fechaActual,
      });
    }
  });

  const actualizado = await reservaRef.get();

  return completarReservaConVehiculo({
    id: actualizado.id,
    ...actualizado.data(),
  });
};

// ELIMINAR RESERVA
export const eliminarReservaService = async (id, usuario) => {
  if (!usuario || !usuario.uid) {
    throw new Error("No se pudo identificar al usuario.");
  }

  const perfil = await obtenerPerfil(usuario.uid);

  if (!esAdministrador(perfil.rol)) {
    const error = new Error(
      "Solo el administrador puede eliminar reservas."
    );
    error.status = 403;
    throw error;
  }

  const referencia = db
    .collection(COLECCION)
    .doc(String(id));

  const documento = await referencia.get();

  if (!documento.exists) {
    return false;
  }

  if (documento.data().id_alquiler) {
    const error = new Error(
      "No se puede eliminar una reserva que ya tiene un alquiler asociado."
    );
    error.status = 400;
    throw error;
  }

  await referencia.delete();

  return true;
};

// EXPORTAR RESERVAS A CSV
export const exportarReservasCSVService = async () => {
  const snapshot = await db.collection(COLECCION).get();

  const columnas = [
    "id",
    "uid_usuario",
    "email_usuario",
    "id_coche",
    "fecha_inicio",
    "fecha_fin",
    "estado_aprobacion",
    "monto_total",
    "fecha_creacion",
    "id_alquiler",
  ];

  const escapar = (valor) => {
    const texto = String(valor ?? "");
    return '"' + texto.replace(/"/g, '""') + '"';
  };

  const filas = snapshot.docs.map((doc) => {
    const reserva = {
      id: doc.id,
      ...doc.data(),
    };

    return columnas
      .map((columna) => escapar(reserva[columna]))
      .join(",");
  });

  return {
    filename:
      "reservas-" +
      new Date().toISOString().slice(0, 10) +
      ".csv",
    csvContent: [
      columnas.join(","),
      ...filas,
    ].join("\r\n"),
  };
};
