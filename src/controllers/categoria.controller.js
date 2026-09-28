import * as categoriasService from '../services/categorias.service.js';

export const getCategorias = async (req, res) => {
  try {
    const categorias = await categoriasService.obtenerTodasLasCategorias();
    return res.status(200).json({
      success: true,
      data: categorias,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener categorías',
      error: error.message,
    });
  }
};