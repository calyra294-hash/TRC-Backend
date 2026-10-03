// src/controllers/auth.controller.js
import { authService } from '../services/auth.service.js';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'El correo y la contraseña son obligatorios.',
      });
    }

    const resultado = await authService.signIn(email, password);

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: resultado,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Error al iniciar sesión',
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