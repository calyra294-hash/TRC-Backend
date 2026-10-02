import { supabase } from '../config/supabase.js';

export const obtenerTodosLosVehiculos = async () => {
  const { data, error } = await supabase
    .from('coche')
    .select(`
      id_coche,
      marca,
      modelo,
      anio,
      placa,
      color,
      valor_dia,
      url_imagen,
      estado,
      descripcion,
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
    // 1. Manejo seguro del campo JSONB: Si viene como string, lo parseamos; si ya es objeto, lo usamos directo.
    let specs = {};
    if (coche.detalles_tecnicos) {
      if (typeof coche.detalles_tecnicos === 'string') {
        try {
          specs = JSON.parse(coche.detalles_tecnicos);
        } catch (e) {
          console.error(`Error al parsear detalles_tecnicos para el coche ${coche.id_coche}:`, e);
          specs = {};
        }
      } else {
        specs = coche.detalles_tecnicos;
      }
    }

    return {
      id: String(coche.id_coche),
      nombre: `${coche.marca} ${coche.modelo}`.trim(),
      anio: coche.anio,
      placa: coche.placa,
      color: coche.color,
      categoria: coche.categorias?.nombre_categoria || 'Sin categoría',
      precio: parseFloat(coche.valor_dia) || 0,
      imagen: coche.url_imagen,
      estado: coche.estado,
      
      // 2. Mapeamos la descripción que nos mandó la base de datos (con un respaldo por si viniera vacía)
      descripcion: coche.descripcion || `Vehículo ${coche.marca} ${coche.modelo} disponible para alquiler.`,

      // 3. Extracción segura desde el objeto 'specs' ya parseado
      pasajeros: specs.pasajeros ?? 5,
      transmision: specs.transmision || 'Manual',
      combustible: specs.combustible || 'Gasolina',
      equipamiento: Array.isArray(specs.equipamiento) ? specs.equipamiento : []
    };
  });

  return vehiculosFormateados;
};