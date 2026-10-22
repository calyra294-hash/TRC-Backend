
import { Router } from "express";
import {
    obtenerReservas,
    exportarReservasCSV,
} from "../controllers/reserva.controller.js";

const router = Router();

router.get("/", obtenerReservas);
router.get("/export-csv", exportarReservasCSV);

export default router;
