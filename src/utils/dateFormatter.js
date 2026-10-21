export const formatearFecha = (valorFecha, incluirHora = false) => {
  if (!valorFecha) return "";

  try {
    let fechaObj;

    // 1. Si es un Timestamp nativo de Firestore con método .toDate()
    if (typeof valorFecha.toDate === "function") {
      fechaObj = valorFecha.toDate();
    } 
    // 2. Si viene como un objeto plano con _seconds (serializado)
    else if (valorFecha._seconds) {
      fechaObj = new Date(valorFecha._seconds * 1000);
    } 
    // 3. Si es un string o número estándar de JS
    else {
      fechaObj = new Date(valorFecha);
    }

    // Validar si la fecha resultante es un timestamp válido
    if (isNaN(fechaObj.getTime())) return "";

    const isoString = fechaObj.toISOString(); // Ej: 2026-05-20T14:30:00.000Z

    if (incluirHora) {
      // Reemplaza la 'T' por un espacio y corta los milisegundos/Z para obtener "YYYY-MM-DD HH:mm:ss"
      return isoString.replace("T", " ").slice(0, 19);
    }

    // Solo fecha por defecto ("YYYY-MM-DD")
    return fechaObj.toISOString().slice(0, 10);

  } catch (error) {
    console.warn("No se pudo parsear la fecha:", valorFecha);
    return ""; // Devuelve vacío en lugar de romper el flujo del ETL
  }
};