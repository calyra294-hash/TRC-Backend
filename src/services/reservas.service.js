const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

// OBTENER TODAS LAS RESERVAS
export const getReservas = async () => {
    try {
        const response = await fetch(`${API_URL}/reserva`);

        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status}`);
        }

        const json = await response.json();

        return json.data || [];
    } catch (error) {
        console.error('Error al consumir /reserva:', error);
        throw error;
    }
};

// OBTENER UNA RESERVA
export const getReservaPorId = async (id) => {
    try {
        const response = await fetch(`${API_URL}/reserva/${id}`);

        if (!response.ok) {
            throw new Error(`Error en la petición: ${response.status}`);
        }

        const json = await response.json();

        return json.data;
    } catch (error) {
        console.error('Error al obtener reserva:', error);
        throw error;
    }
};

// CREAR RESERVA
export const crearReserva = async (datos) => {
    try {
        const response = await fetch(`${API_URL}/reserva`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datos),
        });

        if (!response.ok) {
            throw new Error(`Error al crear reserva: ${response.status}`);
        }

        const json = await response.json();

        return json.data;
    } catch (error) {
        console.error('Error al crear reserva:', error);
        throw error;
    }
};

// ACTUALIZAR ESTADO
export const actualizarEstadoReserva = async (id, estado) => {
    try {
        const response = await fetch(`${API_URL}/reserva/${id}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                estado,
            }),
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar reserva: ${response.status}`);
        }

        const json = await response.json();

        return json.data;
    } catch (error) {
        console.error('Error al actualizar estado:', error);
        throw error;
    }
};

// ELIMINAR RESERVA
export const eliminarReserva = async (id) => {
    try {
        const response = await fetch(`${API_URL}/reserva/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Error al eliminar reserva: ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('Error al eliminar reserva:', error);
        throw error;
    }
};