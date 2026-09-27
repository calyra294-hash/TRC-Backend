import db from "../config/firebase.js";

export const registrarUsuario = async (req, res) => {
  try {
    const { _id, nombre_completo, rol, correo, password_hash, direccion } = req.body || {};

    if (!nombre_completo || !rol || !correo || !password_hash || !direccion) {
      return res.status(400).json({
        mensaje: "Todos los campos son obligatorios: nombre_completo, rol, correo, password_hash y direccion.",
      });
    }

    let idFinal = _id;

    if (_id) {
      await db.collection("usuarios").doc(_id).set({
        _id,
        nombre_completo,
        rol,
        correo,
        password_hash,
        direccion,
      });
    } else {
      const docRef = await db.collection("usuarios").add({
        nombre_completo,
        rol,
        correo,
        password_hash,
        direccion,
      });
      idFinal = docRef.id;

      await db.collection("usuarios").doc(idFinal).update({ _id: idFinal });
    }

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