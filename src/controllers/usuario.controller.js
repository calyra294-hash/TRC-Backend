// src/controllers/usuarios.controller.js
import * as usuariosService from '../services/usuarios.service.js';

// 1. OBTENER TODOS LOS USUARIOS
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await usuariosService.obtenerUsuariosService();
    return res.status(200).json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    console.error('Error en obtenerUsuarios controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener la lista de usuarios.',
      error: error.message,
    });
  }
};

// 2. OBTENER UN USUARIO POR ID
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await usuariosService.obtenerUsuarioPorIdService(id);

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el usuario con ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    console.error('Error en obtenerUsuarioPorId controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el usuario.',
      error: error.message,
    });
  }
};

// 3. EDITAR USUARIO (Soporte para campos extendidos, documentos y estado de aprobación)
export const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre1,
      nombre2,
      apellido1,
      apellido2,
      cedula,
      telefono,
      direccion,
      licencia,
      tipo_licencia,
      estado_aprobacion,
      url_cedula,
      url_licencia,
      url_avatar,
      fecha_nacimiento,
    } = req.body || {};

    const usuarioActualizado = await usuariosService.actualizarUsuarioService(id, {
      nombre1,
      nombre2,
      apellido1,
      apellido2,
      cedula,
      telefono,
      direccion,
      licencia,
      tipo_licencia,
      estado_aprobacion,
      url_cedula,
      url_licencia,
      url_avatar,
      fecha_nacimiento,
    });

    if (!usuarioActualizado) {
      return res.status(404).json({
        success: false,
        message: `No se encontró el usuario con ID: ${id}`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario actualizado correctamente.',
      data: usuarioActualizado,
    });
  } catch (error) {
    console.error('Error en editarUsuario controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el usuario.',
      error: error.message,
    });
  }
};

// 4. ELIMINAR USUARIO
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    await usuariosService.eliminarUsuarioService(id);

    return res.status(200).json({
      success: true,
      message: `Usuario con ID ${id} eliminado con éxito.`,
    });
  } catch (error) {
    console.error('Error en eliminarUsuario controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario.',
      error: error.message,
    });
  }
};