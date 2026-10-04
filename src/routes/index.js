import { Router } from "express";
import vehiculosRoutes from "./vehiculo.routes.js";
import categoriasRoutes from "./categoria.routes.js";
import usuariosRoutes from "./usuario.routes.js";
import alquilerRoutes from "./alquiler.routes.js";
import authRoutes from "./auth.routes.js";
import reservaRoutes from "./reserva.routes.js";

const router = Router();

// Agrupamos todas las sub-rutas
router.use("/vehiculos", vehiculosRoutes);
router.use("/categorias", categoriasRoutes);
router.use("/usuarios", usuariosRoutes);
router.use("/alquiler", alquilerRoutes);
router.use("/auth", authRoutes);
router.use("/reserva", reservaRoutes);

export default router;