import { Router } from "express";

import {
    exportarReservasCSV,
} from "../controllers/reserva.controller.js";

const router = Router();

router.get("/export-csv", exportarReservasCSV);

export default router;