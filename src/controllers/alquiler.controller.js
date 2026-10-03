import { obtenerAlquileresService } from "../services/alquiler.service.js";

// OBTENER TODOS LOS ALQUILERES
export const obtenerAlquileres = async (req, res) => {
    try {
        const alquileres = await obtenerAlquileresService();

        res.status(200).json(alquileres);
    } catch (error) {
        console.error("Error al obtener los alquileres:", error);

        res.status(500).json({
            mensaje: "Error al obtener la lista de alquileres.",
            error: error.message,
        });
    }
};