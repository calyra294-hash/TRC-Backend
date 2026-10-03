import { supabase } from '../config/supabase.js';

const TABLA = 'usuarios';

// 1. OBTENER TODOS LOS USUARIOS
export const obtenerUsuariosService = async () => {
  const { data, error } = await supabase
    .from(TABLA)
    .select('*');

  if (error) {
    throw new Error(`Error al consultar usuarios: ${error.message}`);
  }

  return data.map((usuario) => {
    const copia = { ...usuario };
    delete copia.contrasena; // Ocultamos la contraseña por seguridad
    return copia;
  });
};

// 2. OBTENER USUARIO POR ID (o id_usuario / UUID)
export const obtenerUsuarioPorIdService = async (id) => {
  const { data, error } = await supabase
    .from(TABLA)
    .select('*')
    .eq('id_usuario', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // No encontrado
    throw new Error(`Error al consultar usuario por ID: ${error.message}`);
  }

  const copia = { ...data };
  delete copia.contrasena;
  return copia;
};

// 3. ACTUALIZAR / EDITAR USUARIO (Incluyendo URLs del bucket documentos_usuarios y estado)
export const actualizarUsuarioService = async (id, datosActualizados) => {
  // Filtramos valores 'undefined' para no sobrescribir datos con null de forma innecesaria
  const camposAActualizar = Object.fromEntries(
    Object.entries(datosActualizados).filter(([_, v]) => v !== undefined)
  );

  const { data, error } = await supabase
    .from(TABLA)
    .update(camposAActualizar)
    .eq('id_usuario', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error al actualizar usuario: ${error.message}`);
  }

  const copia = { ...data };
  delete copia.contrasena;
  return copia;
};

// 4. ELIMINAR USUARIO
export const eliminarUsuarioService = async (id) => {
  const { error } = await supabase
    .from(TABLA)
    .delete()
    .eq('id_usuario', id);

  if (error) {
    throw new Error(`Error al eliminar usuario: ${error.message}`);
  }

  return true;
};