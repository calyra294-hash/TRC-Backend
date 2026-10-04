import { Router } from "express";

import {
    obtenerReservas,
    obtenerReservaPorId,
    crearReserva,
    actualizarEstadoReserva,
    eliminarReserva,
} from "../controllers/reserva.controller.js";

const router = Router();

router.get("/", obtenerReservas);
router.get("/:id", obtenerReservaPorId);
router.post("/", crearReserva);
router.put("/:id/estado", actualizarEstadoReserva);
router.delete("/:id", eliminarReserva);

export default router;