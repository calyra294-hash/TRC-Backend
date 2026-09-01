import express from "express";
import { registrarCategoria } from "../controllers/categoria.controller.js";

const router = express.Router();

router.post("/categoria", registrarCategoria);

export default router;