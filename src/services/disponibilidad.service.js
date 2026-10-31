import { db } from "../config/firebase.js";

const COLECCION_RESERVAS = "reservas";
const COLECCION_ALQUILERES = "alquiler";

const obtenerFechaDia = (valor) => {
    if (!valor) return null;

    if (typeof valor === "string") {
        const coincidencia = valor.match(/^\d{4}-\d{2}-\d{2}/);
        return coincidencia ? coincidencia[0] : null;
    }

    if (valor instanceof Date) {
        if (Number.isNaN(valor.getTime())) return null;
        return valor.toISOString().slice(0, 10);
    }

    if (typeof valor.toDate === "function") {
        return obtenerFechaDia(valor.toDate());
    }

    return null;
};

const obtenerIdCoche = (documento) => {
    const id =
        documento.id_coche ??
        documento.vehiculo?.id_coche ??
        documento.id_vehiculo ??
        documento.vehiculo?.id_vehiculo;

    return id === undefined || id === null ? null : String(id);
};

const estadosReservaBloquean = (estado) => {
    const valor = String(estado || "pendiente").trim().toLowerCase();

    return ![
        "rechazada",
        "rechazado",
        "cancelada",
        "cancelado",
    ].includes(valor);
};

const estadosAlquilerBloquean = (estado) => {
    const valor = String(estado || "").trim().toLowerCase();

    return [
        "pendiente_entrega",
        "activo",
        "alquilado",
        "en curso",
        "en_curso",
        "vigente",
    ].includes(valor);
};

const sumarDia = (fecha, cantidad) => {
    const date = new Date(`${fecha}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() + cantidad);
    return date.toISOString().slice(0, 10);
};

const obtenerHoy = () => {
    return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Managua",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());
};

const combinarPeriodos = (periodos) => {
    const ordenados = periodos
        .filter((periodo) => periodo.fecha_inicio && periodo.fecha_fin)
        .sort((a, b) =>
            a.fecha_inicio.localeCompare(b.fecha_inicio)
        );

    const resultado = [];

    for (const periodo of ordenados) {
        const ultimo = resultado[resultado.length - 1];

        // Unir únicamente períodos que se superponen.
        if (ultimo && periodo.fecha_inicio <= ultimo.fecha_fin) {
            if (periodo.fecha_fin > ultimo.fecha_fin) {
                ultimo.fecha_fin = periodo.fecha_fin;
            }
        } else {
            resultado.push({
                fecha_inicio: periodo.fecha_inicio,
                fecha_fin: periodo.fecha_fin,
            });
        }
    }

    return resultado;
};

export const obtenerDisponibilidadVehiculosService = async () => {
    try {
        const [reservasSnapshot, alquileresSnapshot] = await Promise.all([
            db.collection(COLECCION_RESERVAS).get(),
            db.collection(COLECCION_ALQUILERES).get(),
        ]);

        const disponibilidad = new Map();

        const agregarPeriodo = (idCoche, fechaInicio, fechaFin) => {
            if (idCoche === undefined || idCoche === null) return;

            const id = String(idCoche);
            const inicio = obtenerFechaDia(fechaInicio);
            const fin = obtenerFechaDia(fechaFin);

            if (!inicio || !fin || fin < inicio) return;

            if (!disponibilidad.has(id)) {
                disponibilidad.set(id, []);
            }

            disponibilidad.get(id).push({
                fecha_inicio: inicio,
                fecha_fin: fin,
            });
        };

        // Reservas de todos los clientes.
        reservasSnapshot.docs.forEach((documento) => {
            const reserva = documento.data();

            const estado = reserva.estado_aprobacion || reserva.estado;

            if (!estadosReservaBloquean(estado)) return;

            agregarPeriodo(
                obtenerIdCoche(reserva),
                reserva.fecha_inicio,
                reserva.fecha_fin
            );
        });

        // Alquileres de todos los clientes.
        alquileresSnapshot.docs.forEach((documento) => {
            const alquiler = documento.data();

            const estado = alquiler.estado_alquiler || alquiler.estado;

            if (!estadosAlquilerBloquean(estado)) return;

            agregarPeriodo(
                obtenerIdCoche(alquiler),
                alquiler.fecha_inicio,
                alquiler.fecha_fin
            );
        });

        const hoy = obtenerHoy();
        const resultado = [];

        for (const [idCoche, periodos] of disponibilidad.entries()) {
            const periodosCombinados = combinarPeriodos(periodos);

            const periodoActual = periodosCombinados.find(
                (periodo) =>
                    periodo.fecha_inicio <= hoy &&
                    periodo.fecha_fin >= hoy
            );

            const proximoPeriodo = periodosCombinados.find(
                (periodo) => periodo.fecha_inicio > hoy
            );

            resultado.push({
                id_coche: idCoche,

                ocupado_actualmente: Boolean(periodoActual),

                reservado_hasta: periodoActual
                    ? periodoActual.fecha_fin
                    : null,

                disponible_desde: periodoActual
                    ? sumarDia(periodoActual.fecha_fin, 1)
                    : hoy,

                disponible_hasta:
                    !periodoActual && proximoPeriodo
                        ? sumarDia(proximoPeriodo.fecha_inicio, -1)
                        : null,

                proxima_reserva_inicio: proximoPeriodo
                    ? proximoPeriodo.fecha_inicio
                    : null,

                periodos_ocupados: periodosCombinados,
            });
        }

        return resultado;
    } catch (error) {
        console.error("Error al consultar disponibilidad:", error);
        throw error;
    }
};