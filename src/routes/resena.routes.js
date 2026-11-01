import { Router } from "express";

import {
    registrarResena,
    obtenerResenasVehiculo,
    obtenerMisResenas,
    exportarResenasCSV,
} from "../controllers/resena.controller.js";

const router = Router();

// REGISTRAR RESEÑA
router.post("/", registrarResena);

// CONSULTAR RESEÑAS DEL CLIENTE
router.get("/mis-resenas", obtenerMisResenas);

// CONSULTAR RESEÑAS DE UN VEHÍCULO
router.get("/vehiculo/:id", obtenerResenasVehiculo);

// EXPORTAR RESEÑAS A CSV
router.get("/export-csv", exportarResenasCSV);

export default router;