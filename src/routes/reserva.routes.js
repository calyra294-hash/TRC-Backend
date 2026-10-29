
import { Router } from "express";

import {
    obtenerReservas,
    obtenerReservaPorId,
    crearReserva,
    actualizarEstadoReserva,
    eliminarReserva,
    exportarReservasCSV,
} from "../controllers/reserva.controller.js";

const router = Router();

router.get("/", obtenerReservas);
router.get("/export-csv", exportarReservasCSV);
router.get("/:id", obtenerReservaPorId);
router.post("/", crearReserva);
router.put("/:id/estado", actualizarEstadoReserva);
router.delete("/:id", eliminarReserva);

export default router;
