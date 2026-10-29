import { auth, db } from "../config/firebase.js";
import { supabase } from "../config/supabase.js";

export async function resolverUsuarioSupabase(req) {
    const autorizacion = req.headers.authorization || "";

    if (!autorizacion.startsWith("Bearer ")) {
        const error = new Error("Debes iniciar sesión para consultar tus datos.");
        error.status = 401;
        throw error;
    }

    const token = autorizacion.slice(7);
    const usuarioFirebase = await auth.verifyIdToken(token);

    const documento = await db
        .collection("usuario")
        .doc(usuarioFirebase.uid)
        .get();

    if (!documento.exists) {
        const error = new Error("No se encontró tu perfil.");
        error.status = 403;
        throw error;
    }

    const perfil = documento.data() || {};
    const rol = String(perfil.rol || "").trim().toLowerCase();

    if (["admin", "administrador"].includes(rol)) {
        return { admin: true, idUsuario: null };
    }

    const correo = String(
        usuarioFirebase.email || perfil.email || ""
    ).trim();

    if (!correo) {
        return { admin: false, idUsuario: null };
    }

    const { data, error } = await supabase
        .from("usuario")
        .select("id_usuario")
        .eq("email", correo)
        .maybeSingle();

    if (error) {
        throw new Error(
            `Error al buscar el usuario en Supabase: ${error.message}`
        );
    }

    return {
        admin: false,
        idUsuario: data?.id_usuario ?? null,
    };
}
