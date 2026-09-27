import * as vehiculosService from '../services/vehiculos.service.js';

export const getVehiculos = async (req, res) => {
  try {
    const vehiculos = await vehiculosService.obtenerTodosLosVehiculos();
    
    return res.status(200).json({
      success: true,
      data: vehiculos
    });
  } catch (error) {
    console.error('Error en getVehiculos controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el catálogo de vehículos',
      error: error.message
    });
  }
};