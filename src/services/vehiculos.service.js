import { supabase } from '../config/supabase.js';

export const obtenerTodosLosVehiculos = async () => {
  const { data, error } = await supabase
    .from('coche')
    .select(`
      id_coche,
      marca,
      modelo,
      valor_dia,
      url_imagen,
      estado,
      detalles_tecnicos,
      categorias (
        id_categoria,
        nombre_categoria
      )
    `);

  if (error) {
    throw new Error(`Error en base de datos: ${error.message}`);
  }

  const vehiculosFormateados = data.map((coche) => {
    // Leemos el JSONB o aseguramos un objeto vacío por defecto
    const specs = coche.detalles_tecnicos || {};

    return {
      id: String(coche.id_coche),
      nombre: `${coche.marca} ${coche.modelo}`.trim(),
      categoria: coche.categorias?.nombre_categoria || 'Sin categoría',
      precio: parseFloat(coche.valor_dia) || 0,
      imagen: coche.url_imagen,
      estado: coche.estado,

      // Extracción segura desde el campo JSONB 'detalles_tecnicos'
      pasajeros: specs.pasajeros ?? 5,
      transmision: specs.transmision || 'Manual',
      combustible: specs.combustible || 'Gasolina',
      equipamiento: Array.isArray(specs.equipamiento) ? specs.equipamiento : []
    };
  });

  return vehiculosFormateados;
};