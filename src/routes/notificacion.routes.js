
import { Router } from "express";

import {
    obtenerNotificaciones,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
} from "../controllers/notificacion.controller.js";

const router = Router();

// Obtener notificaciones del usuario
router.get("/", obtenerNotificaciones);

// Marcar todas como leídas
router.patch("/leer-todas", marcarTodasNotificacionesLeidas);

// Marcar una notificación como leída
router.patch("/:id/leer", marcarNotificacionLeida);

export default router;
