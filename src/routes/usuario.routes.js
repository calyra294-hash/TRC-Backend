import { Router } from "express";
import {
  registrarUsuario,
  obtenerUsuarios,
  obtenerUsuarioPorId,
  editarUsuario,
  eliminarUsuario,
} from "../controllers/usuario.controller.js";

const router = Router();

// GET / - Obtener todos los usuarios
router.get("/", obtenerUsuarios);

// GET /:id - Obtener un usuario por su ID
router.get("/:id", obtenerUsuarioPorId);

// POST / - Crear/Registrar un usuario
router.post("/", registrarUsuario);

// PUT /:id - Actualizar un usuario existente
router.put("/:id", editarUsuario);

// DELETE /:id - Eliminar un usuario por ID
router.delete("/:id", eliminarUsuario);

export default router;