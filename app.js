import express from "express";
import cors from "cors";
import categoriaRoutes from "./src/routes/categoria.routes.js";
import usuarioRoutes from "./src/routes/usuario.routes.js";
import vehiculosRoutes from './src/routes/vehiculo.routes.js';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use(categoriaRoutes);
app.use(usuarioRoutes);
app.use('/api', vehiculosRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));

// 404
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no registrada." });
});

export default app;