import { Router } from "express";
import {
  exportarUsuariosCSV,
} from "../controllers/usuario.controller.js";

const router = Router();

//  GET / - Obtener un archivo csv para el proceso ETL
router.get("/export-csv", exportarUsuariosCSV);

export default router;