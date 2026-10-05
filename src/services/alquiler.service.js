import { supabase } from "../config/supabase.js";

const COLECCION = "alquiler";

// OBTENER TODOS LOS ALQUILERES
export const obtenerAlquileresService = async (idUsuario = null) => {
    try {
        const { data: alquileres, error: errorAlquileres } = await supabase
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
            throw new Error(
                `Error al consultar alquileres: ${errorAlquileres.message}`
            );
        }

        if (!alquileres || alquileres.length === 0) {
            return [];
        }

        const idsAlquiler = alquileres.map(
            (alquiler) => alquiler.id_alquiler
        );

        const { data: detalles, error: errorDetalles } = await supabase
            .from("detalle_alquiler")
            .select(`
                id_detalle_alquiler,
                id_alquiler,
                id_usuario,
                id_coche,
                precio_total,
                cantidad_dias
            `)
            .in("id_alquiler", idsAlquiler);

        if (errorDetalles) {
            throw new Error(
                `Error al consultar detalles de alquiler: ${errorDetalles.message}`
            );
        }

        let detallesFiltrados = detalles || [];

        if (idUsuario) {
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
                    .filter(Boolean)
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
                        placa,
                        valor_dia,
                        url_imagen
                    `)
                    .in("id_coche", idsCoche);

            if (errorCoches) {
                throw new Error(
                    `Error al consultar vehículos: ${errorCoches.message}`
                );
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

                const especificaciones =
                    alquiler.especificaciones || {};

                return {
                    id: String(alquiler.id_alquiler),
                    id_alquiler: alquiler.id_alquiler,

                    id_reserva: alquiler.id_reserva
                        ? String(alquiler.id_reserva)
                        : "",

                    id_usuario: detalle.id_usuario,
                    id_coche: detalle.id_coche,

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
                        Number(alquiler.monto_final) ||
                        Number(detalle.precio_total) ||
                        0,

                    cantidad_dias:
                        Number(detalle.cantidad_dias) || 0,

                    vehiculo: {
                        id_coche:
                            coche?.id_coche ||
                            detalle.id_coche,

                        marca:
                            coche?.marca ||
                            "Vehículo",

                        modelo:
                            coche?.modelo ||
                            "",

                        placa:
                            coche?.placa ||
                            "",

                        valor_dia:
                            Number(coche?.valor_dia) || 0,

                        foto_principal:
                            coche?.url_imagen ||
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
            })
            .filter(Boolean);

        return resultado;
    } catch (error) {
        throw new Error(
            `Error al consultar alquileres: ${error.message}`
        );
    }
};