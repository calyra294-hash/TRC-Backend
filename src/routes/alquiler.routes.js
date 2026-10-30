import { Router } from "express";

import {
    obtenerAlquileres,
    exportarAlquilerCSV,
    obtenerQRAlquiler,
    validarQRAlquiler,
    confirmarEntregaQR,
    registrarEntrega,
    registrarDevolucion,
} from "../controllers/alquiler.controller.js";

const router = Router();

// CONSULTAR Y EXPORTAR
router.get("/", obtenerAlquileres);
router.get("/export-csv", exportarAlquilerCSV);

// FUNCIONES QR
router.post("/qr/validar", validarQRAlquiler);
router.post("/qr/confirmar-entrega", confirmarEntregaQR);

// GENERAR QR PARA EL CLIENTE
router.get("/:id/qr", obtenerQRAlquiler);

// ENTREGA Y DEVOLUCIÓN
router.put("/:id/entrega", registrarEntrega);
router.put("/:id/devolucion", registrarDevolucion);

export default router;
