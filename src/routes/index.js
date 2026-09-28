import { Router } from 'express';
import vehiculosRoutes from './vehiculo.routes.js';
import categoriasRoutes from './categoria.routes.js';

const router = Router();

// Agrupamos todas las sub-rutas
router.use('/vehiculos', vehiculosRoutes);
router.use('/categorias', categoriasRoutes);


export default router;