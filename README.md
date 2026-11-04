# Canchas Jireh

Plataforma web para la gestión y reserva de canchas deportivas (fútbol, básquetbol y voleibol) en una o varias sedes.
Proyecto final de Programación Web — Universidad Rafael Landívar.

## Arquitectura: monolito en capas

Un solo proceso Node.js (Express + TypeScript) atiende la API bajo `/api` y, en producción, también sirve el frontend
compilado (React + TypeScript). Todos los datos viven en una sola base de SQL Server (`CanchasJirehDB`) con llaves
foráneas reales.

```text
Navegador ──► Express (puerto 3000)
                ├─ /api/* ─► routes ─► middlewares ─► controllers ─► services ─► repositories ─► Prisma ─► SQL Server
                └─ /*     ─► frontend/dist (React)
              Programador de tareas (expiración, recordatorios, envío de correos) ─► services
```

| Capa          | Carpeta                       | Responsabilidad                                                   | No debe                    |
| ------------- | ----------------------------- | ----------------------------------------------------------------- | -------------------------- |
| Rutas         | `backend/src/routes`          | URL, método y middlewares de acceso (`autenticar`, `requerirRol`) | Contener lógica            |
| Middlewares   | `backend/src/middlewares`     | JWT, roles, límite de peticiones, subida de archivos, errores     | Acceder a la base de datos |
| Controladores | `backend/src/controllers`     | Leer `req`, validar con zod (`validators/`), llamar al servicio   | Usar Prisma                |
| Servicios     | `backend/src/services`        | Reglas de negocio (RN-01…RN-08), transacciones, permisos por sede | Conocer `req`/`res`        |
| Reglas puras  | `backend/src/services/reglas` | Precio, horario, reembolso, tarjeta simulada (sin base de datos)  | Acceder a la base de datos |
| Repositorios  | `backend/src/repositories`    | Consultas Prisma (DAO)                                            | Decidir reglas de negocio  |
| Modelos       | `backend/src/models`          | Tipos, enums y conversión a JSON de cada entidad                  | —                          |

### Garantías de consistencia

- **Sin reservas traslapadas (RN-01 / RNF-02):** transacción `SERIALIZABLE` con `UPDLOCK, HOLDLOCK` y, además, el
  trigger `Reserva_sin_traslapes` en la base de datos.
- **Pago atómico (Tabla 8):** el pago, la confirmación de la reserva y el correo pendiente se guardan en una sola
  transacción. Lo mismo al cancelar: cancelación, reembolso y aviso, o nada.
- **Correos confiables:** la tabla `Notificacion` funciona como cola; el programador envía los pendientes y reintenta
  los fallidos hasta 3 veces.

## Estructura

```text
canchas-jireh/
├── backend/            API Express + Prisma (ver tabla de capas)
│   ├── prisma/         schema.prisma, migraciones y seed.ts
│   ├── src/            config · models · repositories · services · controllers · routes · validators · middlewares · jobs · utils
│   └── tests/          unit/ (reglas y utilidades) · integration/ (seguridad de la API y pruebas con SQL Server)
├── frontend/           React + TypeScript (Vite)
│   └── src/            api · components · context · hooks · pages/{publico,cliente,admin,propietario} · routes · types · utils
├── e2e/                Playwright + axe: búsqueda, reserva, pago y gestión
├── db/init/            crea la base de datos en el contenedor de SQL Server
├── Dockerfile          una sola imagen: compila frontend y backend
└── docker-compose.yml  app + sqlserver + mailpit
```

## Inicio rápido (desarrollo)

Requisitos: Node.js 24 y Docker Desktop.

```bash
cp .env.example .env
cp backend/.env.example backend/.env
npm install
npm run dev:infra        # SQL Server + Mailpit en Docker
npm run db:migrate       # crea las tablas, restricciones y el trigger
npm run db:seed          # sedes, canchas, tarifas y cuentas de demostración
npm run dev              # API en :3000 y frontend en http://localhost:5173
```

Correos de prueba: <http://localhost:8025> (Mailpit).

| Cuenta        | Correo                         | Contraseña        |
| ------------- | ------------------------------ | ----------------- |
| Propietario   | `propietario@canchasjireh.gt`  | `Propietario2026` |
| Admin Zona 10 | `admin.zona10@canchasjireh.gt` | `Demo2026!`       |
| Admin Mixco   | `admin.mixco@canchasjireh.gt`  | `Demo2026!`       |
| Cliente       | `cliente@demo.gt`              | `Demo2026!`       |

Tarjetas de prueba: `4242 4242 4242 4242` (aprobada), `4000 0000 0000 0002` (rechazada),
`4000 0000 0000 9995` (fondos insuficientes).

## Sistema completo en Docker

```bash
cp .env.example .env
npm run docker:up                                    # http://localhost:8080
docker compose exec app node dist/prisma/seed.js     # datos de demostración
```

## Calidad

```bash
npm run format:check && npm run lint && npm run typecheck && npm test
npm run test:integracion   # requiere SQL Server (npm run dev:infra)
npm run test:e2e           # requiere el sistema corriendo y los datos de demostración
```

El CI (`.github/workflows/ci.yml`) ejecuta lo anterior en cada PR hacia `main`, además de `npm audit` y la
construcción de la imagen Docker.

## Stack

React 19 · TypeScript · Vite · Express 5 · Prisma 7 · SQL Server 2022 · zod · JWT + refresh token rotativo · bcrypt ·
helmet · express-rate-limit · nodemailer · Vitest · Supertest · Testing Library · Playwright · axe · Docker · GitHub
Actions.
