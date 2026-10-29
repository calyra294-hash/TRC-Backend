
import express from "express";
import cors from "cors";
import apiRouter from "./src/routes/index.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Rutas de la API
app.use("/api", apiRouter);

// Ruta para comprobar que el backend está activo
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    mensaje: "TRC Backend funcionando correctamente.",
  });
});

// Manejo de rutas inexistentes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    mensaje: "Ruta no registrada.",
    ruta: req.originalUrl,
  });
});

export default app;
