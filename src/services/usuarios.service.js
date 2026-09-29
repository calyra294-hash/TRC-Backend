import db from "../config/firebase.js";

const COLECCION = "usuarios";

// 1. REGISTRAR / CREAR USUARIO
export const crearUsuarioService = async (datos) => {
  try {
    const { _id, nombre_completo, rol, correo, password_hash, direccion } = datos;

    if (_id) {
      await db.collection(COLECCION).doc(_id).set({
        _id,
        nombre_completo,
        rol,
        correo,
        password_hash,
        direccion,
      });
      return _id;
    } else {
      const docRef = await db.collection(COLECCION).add({
        nombre_completo,
        rol,
        correo,
        password_hash,
        direccion,
      });

      await db.collection(COLECCION).doc(docRef.id).update({ _id: docRef.id });
      return docRef.id;
    }
  } catch (error) {
    throw new Error(`Error al crear usuario: ${error.message}`);
  }
};

// 2. OBTENER TODOS LOS USUARIOS
export const obtenerUsuariosService = async () => {
  try {
    const snapshot = await db.collection(COLECCION).get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      delete data.password_hash; // Ocultamos la contraseña por seguridad
      return { id: doc.id, ...data };
    });
  } catch (error) {
    throw new Error(`Error al consultar usuarios: ${error.message}`);
  }
};

// 3. OBTENER USUARIO POR ID
export const obtenerUsuarioPorIdService = async (id) => {
  try {
    const doc = await db.collection(COLECCION).doc(id).get();

    if (!doc.exists) return null;

    const data = doc.data();
    delete data.password_hash;
    return { id: doc.id, ...data };
  } catch (error) {
    throw new Error(`Error al consultar usuario por ID: ${error.message}`);
  }
};

// 4. ACTUALIZAR / EDITAR USUARIO
export const actualizarUsuarioService = async (id, datosActualizados) => {
  try {
    const docRef = db.collection(COLECCION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return null;

    // Filtramos valores 'undefined' para no sobrescribir datos existentes con null
    const camposAActualizar = Object.fromEntries(
      Object.entries(datosActualizados).filter(([_, v]) => v !== undefined)
    );

    await docRef.update(camposAActualizar);

    const actualizado = await docRef.get();
    const data = actualizado.data();
    delete data.password_hash;

    return { id: actualizado.id, ...data };
  } catch (error) {
    throw new Error(`Error al actualizar usuario: ${error.message}`);
  }
};

// 5. ELIMINAR USUARIO
export const eliminarUsuarioService = async (id) => {
  try {
    const docRef = db.collection(COLECCION).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) return false;

    await docRef.delete();
    return true;
  } catch (error) {
    throw new Error(`Error al eliminar usuario: ${error.message}`);
  }
};