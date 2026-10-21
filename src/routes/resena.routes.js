import { Router } from "express";
import { exportarResenasCSV } from "../controllers/resena.controller.js";

const router = Router();

router.get("/export-csv", exportarResenasCSV);

export default router;