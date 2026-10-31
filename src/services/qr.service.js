
import crypto from "crypto";
import { db } from "../config/firebase.js";

const COLECCION_ALQUILER = "alquiler";
const DURACION_TOKEN_MS = 15 * 60 * 1000;

const obtenerSecreto = () => {
    const secreto = process.env.QR_SECRET;

    if (!secreto || secreto.length < 32) {
        const error = new Error(
            "QR_SECRET debe estar configurado y tener al menos 32 caracteres."
        );
        error.status = 500;
        throw error;
    }

    return secreto;
};

const firmar = (contenido) => {
    return crypto
        .createHmac("sha256", obtenerSecreto())
        .update(contenido)
        .digest("base64url");
};

// GENERAR TOKEN QR PARA EL CLIENTE
export const generarTokenQRService = async (idAlquiler, usuario) => {
    if (!usuario?.uid) {
        const error = new Error("Debes iniciar sesión.");
        error.status = 401;
        throw error;
    }

    const referencia = db
        .collection(COLECCION_ALQUILER)
        .doc(String(idAlquiler));

    const documento = await referencia.get();

    if (!documento.exists) {
        const error = new Error("No se encontró el alquiler.");
        error.status = 404;
        throw error;
    }

    const alquiler = documento.data();
    const estado = String(alquiler.estado || "").toLowerCase().trim();

    if (alquiler.uid_usuario !== usuario.uid) {
        const error = new Error("No tienes permiso para generar este QR.");
        error.status = 403;
        throw error;
    }

    if (!["pendiente_entrega", "activo"].includes(estado)) {
        const error = new Error(
            "El QR solo está disponible para alquileres pendientes de entrega o activos."
        );
        error.status = 400;
        throw error;
    }

    const ahora = Date.now();

    const payload = {
        rentalId: String(idAlquiler),
        uid: usuario.uid,
        action: "alquiler",
        exp: ahora + DURACION_TOKEN_MS,
        nonce: crypto.randomBytes(16).toString("hex"),
    };

    const contenido = Buffer
        .from(JSON.stringify(payload))
        .toString("base64url");

    const firma = firmar(contenido);

    return {
        token: `${contenido}.${firma}`,
        expira_en: new Date(payload.exp).toISOString(),
    };
};

// VALIDAR TOKEN QR
export const validarTokenQRService = async (token) => {
    if (!token || typeof token !== "string") {
        const error = new Error("El código QR no es válido.");
        error.status = 400;
        throw error;
    }

    const partes = token.split(".");

    if (partes.length !== 2) {
        const error = new Error("El código QR tiene un formato incorrecto.");
        error.status = 400;
        throw error;
    }

    const [contenido, firmaRecibida] = partes;
    const firmaEsperada = firmar(contenido);

    const firmaBuffer = Buffer.from(firmaRecibida);
    const esperadaBuffer = Buffer.from(firmaEsperada);

    if (
        firmaBuffer.length !== esperadaBuffer.length ||
        !crypto.timingSafeEqual(firmaBuffer, esperadaBuffer)
    ) {
        const error = new Error("El código QR no es auténtico.");
        error.status = 401;
        throw error;
    }

    let payload;

    try {
        payload = JSON.parse(
            Buffer.from(contenido, "base64url").toString("utf8")
        );
    } catch {
        const error = new Error("No se pudo leer el código QR.");
        error.status = 400;
        throw error;
    }

    if (
        !["entrega", "alquiler"].includes(payload.action) ||
        !payload.rentalId ||
        !payload.uid ||
        !payload.exp ||
        payload.exp < Date.now()
    ) {
        const error = new Error("El código QR expiró o no es válido.");
        error.status = 401;
        throw error;
    }

    const documento = await db
        .collection(COLECCION_ALQUILER)
        .doc(String(payload.rentalId))
        .get();

    if (!documento.exists) {
        const error = new Error("No se encontró el alquiler asociado al QR.");
        error.status = 404;
        throw error;
    }

    const alquiler = documento.data();

    if (alquiler.uid_usuario !== payload.uid) {
        const error = new Error("El código QR no corresponde al cliente.");
        error.status = 403;
        throw error;
    }

    const estado = String(alquiler.estado || "").toLowerCase().trim();

    if (!["pendiente_entrega", "activo"].includes(estado)) {
        const error = new Error(
            estado === "completado"
                ? "Este alquiler ya fue completado. No se permiten más operaciones."
                : "Este alquiler no está disponible para entrega o devolución."
        );
        error.status = 400;
        throw error;
    }

    return {
        id_alquiler: documento.id,
        id_reserva: alquiler.id_reserva || "",
        uid_usuario: alquiler.uid_usuario,
        email_usuario: alquiler.email_usuario || "",
        fecha_inicio: alquiler.fecha_inicio || "",
        fecha_fin: alquiler.fecha_fin || "",
        monto_final: alquiler.monto_final || 0,
        estado,
        vehiculo: alquiler.vehiculo || {},
    };
};
