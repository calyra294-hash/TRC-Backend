import express from "express";
import { registrarUsuario } from "../controllers/usuario.controller.js";

const router = express.Router();

router.post("/usuario", registrarUsuario);

export default router;