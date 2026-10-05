import { supabase } from '../config/supabase.js';

const TABLA = 'usuario';

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

// 5. REGISTRAR USUARIO (Auth Admin + Perfil en public.usuarios con columna UUID separada)
export const registrarUsuarioService = async (datos) => {
  const { email, contrasena, confirmContrasena, ...datosPerfil } = datos;

  if (!email || !contrasena) {
    throw new Error('El correo y la contraseña son obligatorios.');
  }

  // PASO 1: Crear la cuenta en el motor de Autenticación de Supabase
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.trim(),
    password: contrasena,
    email_confirm: true,
  });

  if (authError) {
    throw new Error(`Error al crear autenticación en Supabase: ${authError.message}`);
  }

  const userId = authData.user.id; // UUID generado por Supabase Auth

  // 💡 Sanitizamos los campos del perfil: transformamos strings vacíos ("") en nulls reales
  // para que PostgreSQL no falle al castear tipos estrictos (como DATE, UUID o INT)
  const datosSanitizados = Object.fromEntries(
    Object.entries(datosPerfil).map(([key, value]) => [
      key, 
      value === '' || value === undefined ? null : value
    ])
  );

  // PASO 2: Insertar en la tabla "public.usuarios" usando tu nueva columna uuid
  const perfilAInsertar = {
    uuid_auth: userId, 
    email: email.trim(),
    ...datosSanitizados, // Usamos los datos ya limpios y seguros
  };

  const { data: usuarioGuardado, error: dbError } = await supabase
    .from(TABLA)
    .insert([perfilAInsertar])
    .select()
    .single();

  if (dbError) {
    // Rollback si falla el guardado
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(`Error al guardar el perfil en la base de datos: ${dbError.message}`);
  }

  const copia = { ...usuarioGuardado };
  delete copia.contrasena;

  return copia;
};