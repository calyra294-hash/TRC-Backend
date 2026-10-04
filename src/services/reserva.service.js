import { supabase } from "../config/supabase.js";

// OBTENER TODAS LAS RESERVAS
export const obtenerReservasService = async () => {
    const { data, error } = await supabase
        .from("reserva")
        .select(`
        id_reserva,
        fecha_inicio,
        fecha_fin,
        estado_aprobacion,
        monto_total,
        id_usuario,
        id_coche,
        usuario (
        nombre1,
        apellido1,
        email
      ),
      coche (
        marca,
        modelo,
        placa,
        valor_dia,
        url_imagen
      )
    `)
        .order("id_reserva", { ascending: false });

    if (error) {
        throw new Error(`Error al obtener reservas: ${error.message}`);
    }

    return data;
};

// OBTENER UNA RESERVA POR ID
export const obtenerReservaPorIdService = async (id) => {
    const { data, error } = await supabase
        .from("reserva")
        .select(`
      id_reserva,
      fecha_inicio,
      fecha_fin,
      estado_aprobacion,
      monto_total,
      id_usuario,
      id_coche,
      usuario (
        nombre1,
        apellido1,
        email
      ),
      coche (
        marca,
        modelo,
        placa,
        valor_dia,
        url_imagen
      )
    `)
        .eq("id_reserva", id)
        .single();

    if (error) {
        throw new Error(`Error al obtener la reserva: ${error.message}`);
    }

    return data;
};

// CREAR RESERVA
export const crearReservaService = async (datos) => {
    const { data, error } = await supabase
        .from("reserva")
        .insert([datos])
        .select()
        .single();

    if (error) {
        throw new Error(`Error al crear reserva: ${error.message}`);
    }

    return data;
};

// ACTUALIZAR ESTADO DE RESERVA
export const actualizarEstadoReservaService = async (id, estado) => {
    const { data, error } = await supabase
        .from("reserva")
        .update({ estado_aprobacion: estado })
        .eq("id_reserva", id)
        .select()
        .single();

    if (error) {
        throw new Error(`Error al actualizar reserva: ${error.message}`);
    }

    return data;
};

// ELIMINAR RESERVA
export const eliminarReservaService = async (id) => {
    const { error } = await supabase
        .from("reserva")
        .delete()
        .eq("id_reserva", id);

    if (error) {
        throw new Error(`Error al eliminar reserva: ${error.message}`);
    }

    return true;
};