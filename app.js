import express from "express";
import cors from "cors";
import categoriaRoutes from "./routes/categoria.routes.js";
import usuarioRoutes from "./routes/usuario.routes.js";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use(categoriaRoutes);
app.use(usuarioRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ mensaje: "Ruta no registrada." });
});

export default app;