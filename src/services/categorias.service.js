import { supabase } from '../config/supabase.js';

export const obtenerTodasLasCategorias = async () => {
  const { data, error } = await supabase
    .from('categorias')
    .select('id_categoria, nombre_categoria, descripcion_categoria');

  if (error) {
    throw new Error(`Error al consultar categorías: ${error.message}`);
  }

  return data;
};