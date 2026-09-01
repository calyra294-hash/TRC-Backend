import db from "../firebase.js";

export const registrarCategoria = async (req, res) => {
  try {
    const { _id, nombre, descripcion } = req.body || {};

    if (!nombre || !descripcion) {
      return res.status(400).json({
        mensaje: "Los campos 'nombre' y 'descripcion' son obligatorios.",
      });
    }

    let idFinal = _id;

    if (_id) {
      await db.collection("categorias").doc(_id).set({
        _id,
        nombre,
        descripcion,
      });
    } else {
      const docRef = await db.collection("categorias").add({
        nombre,
        descripcion,
      });
      idFinal = docRef.id;

      await db.collection("categorias").doc(idFinal).update({ _id: idFinal });
    }

    res.status(201).json({
      mensaje: `¡Categoría registrada con éxito! ID: ${idFinal}`,
      _id: idFinal,
      nombre,
      descripcion,
    });
  } catch (error) {
    console.error("Error al registrar la categoría:", error);

    res.status(500).json({
      mensaje: "Error al registrar la categoría.",
      error: error.message,
    });
  }
};
