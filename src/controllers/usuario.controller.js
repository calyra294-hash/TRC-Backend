import {
  crearUsuarioService,
  obtenerUsuariosService,
  obtenerUsuarioPorIdService,
  actualizarUsuarioService,
  eliminarUsuarioService,
} from "../services/usuarios.service.js";

// 1. REGISTRAR USUARIO
export const registrarUsuario = async (req, res) => {
  try {
    const { _id, nombre_completo, rol, correo, password_hash, direccion } = req.body || {};

    if (!nombre_completo || !rol || !correo || !password_hash || !direccion) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios: nombre_completo, rol, correo, password_hash y direccion.",
      });
    }

    const idFinal = await crearUsuarioService({
      _id,
      nombre_completo,
      rol,
      correo,
      password_hash,
      direccion,
    });

    res.status(201).json({
      mensaje: `¡Usuario registrado con éxito! ID: ${idFinal}`,
      _id: idFinal,
      nombre_completo,
      rol,
      correo,
      direccion,
    });
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).json({
      mensaje: "Error al registrar el usuario.",
      error: error.message,
    });
  }
};

// 2. OBTENER TODOS LOS USUARIOS
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await obtenerUsuariosService();
    res.status(200).json(usuarios);
  } catch (error) {
    console.error("Error al obtener los usuarios:", error);
    res.status(500).json({
      mensaje: "Error al obtener la lista de usuarios.",
      error: error.message,
    });
  }
};

// 3. OBTENER UN USUARIO POR ID
export const obtenerUsuarioPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await obtenerUsuarioPorIdService(id);

    if (!usuario) {
      return res.status(404).json({ mensaje: `No se encontró el usuario con ID: ${id}` });
    }

    res.status(200).json(usuario);
  } catch (error) {
    console.error("Error al obtener el usuario:", error);
    res.status(500).json({
      mensaje: "Error al obtener el usuario.",
      error: error.message,
    });
  }
};

// 4. EDITAR USUARIO
export const editarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_completo, rol, correo, password_hash, direccion } = req.body || {};

    const usuarioActualizado = await actualizarUsuarioService(id, {
      nombre_completo,
      rol,
      correo,
      password_hash,
      direccion,
    });

    if (!usuarioActualizado) {
      return res.status(404).json({ mensaje: `No se encontró el usuario con ID: ${id}` });
    }

    res.status(200).json({
      mensaje: "Usuario actualizado correctamente.",
      usuario: usuarioActualizado,
    });
  } catch (error) {
    console.error("Error al actualizar el usuario:", error);
    res.status(500).json({
      mensaje: "Error al actualizar el usuario.",
      error: error.message,
    });
  }
};

// 5. ELIMINAR USUARIO
export const eliminarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await eliminarUsuarioService(id);

    if (!eliminado) {
      return res.status(404).json({ mensaje: `No se encontró el usuario con ID: ${id}` });
    }

    res.status(200).json({ mensaje: `Usuario con ID ${id} eliminado con éxito.` });
  } catch (error) {
    console.error("Error al eliminar el usuario:", error);
    res.status(500).json({
      mensaje: "Error al eliminar el usuario.",
      error: error.message,
    });
  }
};