import {
    obtenerReservasService,
    obtenerReservaPorIdService,
    crearReservaService,
    actualizarEstadoReservaService,
    eliminarReservaService,
} from "../services/reserva.service.js";

// OBTENER TODAS LAS RESERVAS
export const obtenerReservas = async (req, res) => {
    try {
        const reservas = await obtenerReservasService();

        res.status(200).json({
            data: reservas,
        });
    } catch (error) {
        res.status(500).json({
            mensaje: error.message,
        });
    }
};

// OBTENER UNA RESERVA
export const obtenerReservaPorId = async (req, res) => {
    try {
        const reserva = await obtenerReservaPorIdService(req.params.id);

        if (!reserva) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada.",
            });
        }

        res.status(200).json({
            data: reserva,
        });
    } catch (error) {
        res.status(500).json({
            mensaje: error.message,
        });
    }
};

// CREAR UNA RESERVA
export const crearReserva = async (req, res) => {
    try {
        const reserva = await crearReservaService(req.body);

        res.status(201).json({
            mensaje: "Reserva creada correctamente.",
            data: reserva,
        });
    } catch (error) {
        res.status(500).json({
            mensaje: error.message,
        });
    }
};

// ACTUALIZAR ESTADO DE UNA RESERVA
export const actualizarEstadoReserva = async (req, res) => {
    try {
        const { estado } = req.body;

        if (!estado) {
            return res.status(400).json({
                mensaje: "El estado es obligatorio.",
            });
        }

        const reserva = await actualizarEstadoReservaService(
            req.params.id,
            estado
        );

        if (!reserva) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada.",
            });
        }

        res.status(200).json({
            mensaje: "Estado de reserva actualizado correctamente.",
            data: reserva,
        });
    } catch (error) {
        res.status(500).json({
            mensaje: error.message,
        });
    }
};

// ELIMINAR UNA RESERVA
export const eliminarReserva = async (req, res) => {
    try {
        const eliminada = await eliminarReservaService(req.params.id);

        if (!eliminada) {
            return res.status(404).json({
                mensaje: "Reserva no encontrada.",
            });
        }

        res.status(200).json({
            mensaje: "Reserva eliminada correctamente.",
        });
    } catch (error) {
        res.status(500).json({
            mensaje: error.message,
        });
    }
};