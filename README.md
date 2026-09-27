# 🚗 TRC-APP — API Backend

Servidor REST desarrollado en Node.js y Express para la gestión de flota y reservas de **TRC-APP**. Integra **Supabase** (PostgreSQL) con un patrón de arquitectura **Controller-Service-Mapper** para entregar un DTO optimizado al cliente en React Native.

---

## 🚀 Requisitos Previos

- **Node.js**: v18 o superior.
- **pnpm**: Administrador de paquetes recomendado.
- **VS Code**: Editor sugerido.

---

## 🛠️ Instalación y Configuración

1. **Clonar el repositorio e instalar dependencias:**

   ```bash
   pnpm install
   ```

2. **Variables de Entorno (`.env`):**

   Crea un archivo `.env` en la raíz del proyecto basándote en el ejemplo:

   ```env
   PORT=3000
   SUPABASE_URL=https://tu-proyecto.supabase.co
   SUPABASE_ANON_KEY=tu-clave-anonima-de-supabase
   ```

3. **Ejecutar en modo desarrollo:**

   ```bash
   pnpm run dev
   ```

---

## 🧪 Pruebas de Endpoints (REST Client)

Para probar la API localmente sin salir del editor y evitar limitaciones de entornos remotos (WSL2), utilizamos la extensión de VS Code **[REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)** de *Huachao Mao*.

### Pasos para ejecutar pruebas:

1. Instala la extensión **REST Client** en VS Code.
2. Abre el archivo de pruebas ubicado en la raíz: `peticiones.vehiculos.http`.
3. Haz clic sobre el texto **`Send Request`** que aparece sobre cada endpoint en el editor (o presiona `Ctrl + Alt + R`).
4. Verás la respuesta JSON formateada en una pestaña a la derecha.

> ⚠️ **Nota:** Asegúrate de que el archivo mantenga la extensión `.http` o `.rest` para que VS Code active la extensión correctamente.

---

## 📂 Estructura del Proyecto

El proyecto sigue una arquitectura modular y escalable (Controlador-Servicio), separando claramente las responsabilidades de red, lógica de negocio y persistencia de datos.

```text
src/
├── config/
│   ├── firebase.js                 # Configuración del SDK de Firebase
│   └── supabase.js                 # Cliente de conexión y queries para Supabase
├── controllers/
│   ├── categoria.controller.js     # Controladores para la gestión de categorías
│   ├── usuario.controller.js       # Controladores para la gestión de usuarios
│   └── vehiculo.controller.js      # Manejo de req, res y códigos HTTP para vehículos
├── routes/
│   ├── categoria.routes.js         # Endpoints Express para categorías
│   ├── usuario.routes.js           # Endpoints Express para usuarios
│   └── vehiculo.routes.js          # Definición de rutas y mapeo de endpoints de vehículos
├── services/
│   └── vehiculos.service.js        # Consultas complejas (JOINs), lógica de negocio y Mapper
├── test/
│   └── peticiones.vehiculos.http   # Pruebas de endpoints HTTP locales usando REST Client
├── .env                            # Variables de entorno y credenciales (excluido en producción)
├── app.js                          # Punto de entrada de la aplicación, Middlewares y Express app
├── index.js                        # Inicialización y arranque del servidor HTTP
└── package.json                    # Dependencias, scripts del proyecto y metadatos
```

### 💡 Detalles de la Arquitectura:
* **Routes (`routes/`):** Únicamente definen los endpoints y delegan el flujo de la petición al controlador correspondiente.
* **Controllers (`controllers/`):** Extraen los parámetros de la solicitud (`req`), llaman a los servicios necesarios y devuelven la respuesta HTTP formal (`res`).
* **Services (`services/`):** Contienen la lógica de negocio pura, interactúan con las bases de datos (Supabase/Firebase) y formatean/mapean los datos antes de entregarlos al controlador.


---

## 📌 Convención de Commits

Este proyecto sigue la norma **Conventional Commits** para mantener un historial claro y auditable (`feat:`, `fix:`, `docs:`, `refactor:`, etc.).
