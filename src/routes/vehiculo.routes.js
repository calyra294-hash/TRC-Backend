import { Router } from 'express';
import { getVehiculos } from '../controllers/vehiculo.controller.js';

const router = Router();

router.get('/', getVehiculos);

export default router;