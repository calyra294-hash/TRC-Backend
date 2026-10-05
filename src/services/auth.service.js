// src/services/auth.service.js
import { supabase } from '../config/supabase.js';

export const authService = {
  async signIn(email, password) {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    
    if (authError) throw new Error(`Error de autenticación: ${authError.message}`);

    // Consultamos tu tabla relacional "usuarios" usando el UUID de Supabase Auth
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('uuid_auth', authData.user.id)
      .single();

    if (userError) {
      console.warn('Perfil extendido no encontrado en la tabla usuarios:', userError.message);
    }

    return {
      session: authData.session,
      user: {
        ...authData.user,
        ...(userData || {}),
      },
    };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(`Error al cerrar sesión: ${error.message}`);
    return true;
  }
};