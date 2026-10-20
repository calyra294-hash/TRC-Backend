import { authService } from '../services/auth.service.js';

export const login = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'El token de autenticación es obligatorio.',
      });
    }

    const resultado = await authService.verificarTokenYObtenerPerfil(idToken);

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión verificado con éxito',
      data: resultado,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Error al verificar las credenciales',
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    await authService.signOut();
    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error.message,
    });
  }
};