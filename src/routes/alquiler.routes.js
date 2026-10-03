import { Router } from "express";
import { obtenerAlquileres } from "../controllers/alquiler.controller.js";

const router = Router();

// GET / - Obtener todos los alquileres
router.get("/", obtenerAlquileres);

export default router;