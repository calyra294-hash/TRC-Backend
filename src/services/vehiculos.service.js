import { supabase } from '../config/supabase.js';

export const obtenerTodosLosVehiculos = async () => {
  // 1. Consulta con JOIN relacional a la tabla 'categorias'
  const { data, error } = await supabase
    .from('coche')
    .select(`
      id_coche,
      marca,
      modelo,
      valor_dia,
      url_imagen,
      estado,
      categorias (
        id_categoria,
        nombre_categoria
      )
    `);

  if (error) {
    throw new Error(`Error en base de datos: ${error.message}`);
  }

  // 2. Mapeo transformando el JOIN en el campo 'categoria' que espera React Native
  const vehiculosFormateados = data.map((coche) => ({
    id: String(coche.id_coche),
    nombre: `${coche.marca} ${coche.modelo}`.trim(),
    // Supabase devuelve el objeto anidado 'categorias' gracias al JOIN
    categoria: coche.categorias?.nombre_categoria || 'Sin categoría',
    rating: 5.0, // Campo por defecto hasta incluir tabla de reseñas
    resenas: 0,
    precio: parseFloat(coche.valor_dia) || 0,
    pasajeros: 5,
    transmision: 'Manual',
    combustible: 'Gasolina',
    imagen: coche.url_imagen,
    estado: coche.estado
  }));

  return vehiculosFormateados;
};