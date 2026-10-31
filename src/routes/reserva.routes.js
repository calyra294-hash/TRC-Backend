import { Router } from "express";

import {
    obtenerReservas,
    obtenerReservaPorId,
    crearReserva,
    actualizarEstadoReserva,
    eliminarReserva,
    exportarReservasCSV,
    obtenerDisponibilidadVehiculos,
} from "../controllers/reserva.controller.js";

const router = Router();

router.get("/", obtenerReservas);
router.get("/export-csv", exportarReservasCSV);

// IMPORTANTE: esta ruta debe ir antes de /:id
router.get("/disponibilidad", obtenerDisponibilidadVehiculos);

router.get("/:id", obtenerReservaPorId);
router.post("/", crearReserva);
router.put("/:id/estado", actualizarEstadoReserva);
router.delete("/:id", eliminarReserva);

export default router;