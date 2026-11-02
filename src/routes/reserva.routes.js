import { Router } from "express";

import {
    obtenerReservas,
    obtenerReservaPorId,
    crearReserva,
    editarReserva,
    actualizarEstadoReserva,
    eliminarReserva,
    exportarReservasCSV,
    obtenerDisponibilidadVehiculos,
} from "../controllers/reserva.controller.js";

const router = Router();

router.get("/", obtenerReservas);
router.get("/export-csv", exportarReservasCSV);

// Esta ruta debe ir antes de /:id
router.get("/disponibilidad", obtenerDisponibilidadVehiculos);

router.get("/:id", obtenerReservaPorId);
router.post("/", crearReserva);

// Editar una reserva pendiente
router.put("/:id", editarReserva);

// Actualizar el estado de una reserva
router.put("/:id/estado", actualizarEstadoReserva);

router.delete("/:id", eliminarReserva);

export default router;