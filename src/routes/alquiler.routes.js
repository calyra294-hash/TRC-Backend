import { Router } from "express";

import { obtenerAlquileres, exportarAlquilerCSV } from "../controllers/alquiler.controller.js";

const router = Router();

// GET / - Obtener todos los alquileres
router.get("/", obtenerAlquileres);

// GET / - Obtener listado de CSVs
router.get("/export-csv", exportarAlquilerCSV);

export default router;