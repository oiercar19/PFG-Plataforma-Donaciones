# PFG - Plataforma de Donaciones y Redistribucion de Recursos

Aplicacion web full-stack para conectar donantes con entidades sociales (ONGs) validadas. Permite publicar donaciones, gestionar necesidades, conversar entre partes y coordinar entregas con apoyo de geolocalizacion.

Este repositorio contiene:
- `frontend/`: SPA en React.
- `backend/`: API REST en Node.js + Express + Prisma.
- `docker-compose.yml`: entorno Docker para base de datos + API.

## Despliegue

- URL publica: `https://pfg-plataforma-donaciones.vercel.app/`
- Frontend desplegado en Vercel.
- Backend desplegado en Railway.
- Base de datos PostgreSQL desplegada en Railway.

## Tecnologias usadas

### Frontend
- React 18
- React Router DOM 6
- Context API (autenticacion y sesion)
- Axios
- Bootstrap 5 + React Bootstrap + Bootstrap Icons
- Leaflet + React Leaflet (mapas)
- browser-image-compression (compresion de imagenes en cliente)
- Chatbase Web Embed (chatbot IA en cliente)

### Backend
- Node.js
- Express
- Prisma ORM
- JWT (`jsonwebtoken`) para auth
- OpenAPI 3.0 + Swagger UI (documentacion de API)
- `bcrypt` para hash de contrasenas
- `multer` para subida de documentos de ONG
- `helmet`, `cors`, `express-rate-limit` para capa de seguridad
- `nodemailer` + Mailjet API (emails automaticos)

### Base de datos
- PostgreSQL
- Prisma Migrate (migraciones versionadas)

### Infra y tooling
- Docker + Docker Compose
- GitHub Actions (CI de build backend/frontend)
- npm

### Servicios externos integrados
- Google Identity (login social para donantes)
- Nominatim (OpenStreetMap) + Open-Meteo Geocoding (geocodificacion fallback)
- SMTP y/o Mailjet para notificaciones por email
- Chatbase (asistente IA entrenado para la aplicacion)

## Funcionalidades principales

### Autenticacion y roles
- Registro/login de donantes.
- Registro de ONGs con estado de revision (`PENDING`, `APPROVED`, `REJECTED`).
- Login con Google para rol donante.
- Roles: `DONANTE`, `ONG`, `ADMIN`.

### Panel admin
- Estadisticas globales.
- Revision y validacion de ONGs.
- Descarga de documentos enviados por ONG.
- Aprobacion/rechazo con motivo.

### Donaciones
- Crear, editar, eliminar donaciones.
- Estados: `DISPONIBLE`, `ASIGNADO`, `ENTREGADO`.
- Solicitud de donacion por ONG aprobada.
- Marcado de entrega/rechazo por donante.
- Filtros por categoria, ubicacion y texto.

### Necesidades (ONGs)
- Crear necesidades.
- Listar necesidades abiertas/cerradas.
- Cerrar necesidades.
- Conversaciones asociadas a necesidades.

### Chat y coordinacion
- Conversaciones por donacion y por necesidad.
- Envio de mensajes, conteo de no leidos, cierre automatico segun estado.
- Estimador de coste de envio por peso/bultos con recargos y distancia estimada.

### Asistente IA (Chatbase)
- Widget de chatbot integrado en el frontend.
- Entrenado especificamente para asistir en el uso de esta plataforma.
- Cargado globalmente desde `frontend/public/index.html`.

### Geolocalizacion y mapas
- Geocodificacion de direcciones en backend.
- Mapas interactivos para seleccion de ubicacion y visualizacion de donaciones/ONGs.

### Legal y privacidad
- Paginas publicas de aviso legal, proteccion de datos y terminos de uso.

## Arquitectura (alto nivel)

1. El frontend React consume la API en `REACT_APP_API_URL`.
2. El backend expone endpoints bajo `/api/*`.
3. Prisma gestiona acceso a PostgreSQL.
4. Integraciones externas:
   - Google para validar `idToken`.
   - Geocodificacion para coordenadas.
   - SMTP/Mailjet para emails de onboarding y eventos.
   - Chatbase para asistente IA embebido en la interfaz.

## Requisitos previos

- Node.js 18+ (CI usa Node 20)
- npm 9+
- PostgreSQL 15+ (si ejecutas sin Docker)
- Docker y Docker Compose (opcional)

## Puesta en marcha local

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
```

Configura `backend/.env` (ver seccion de variables mas abajo), luego:

```bash
npx prisma migrate dev
npx prisma generate
node src/scripts/createAdmin.js
npm run dev
```

API por defecto: `http://localhost:5000`

### 2) Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm start
```

App por defecto: `http://localhost:3000`

## Ejecucion con Docker

`docker-compose.yml` levanta:
- `postgres` (PostgreSQL 15)
- `backend` (API Node.js dockerizada, con `prisma migrate deploy` al iniciar)

Comandos:

```bash
# Asegurate de tener Docker Desktop/daemon en ejecucion
docker compose down
docker compose build --no-cache backend
docker compose up -d --build
docker compose ps
docker compose logs -f backend
docker compose down
```

Para crear admin en contenedor:

```bash
docker exec -it donation-platform-backend node src/scripts/createAdmin.js
```

Notas de implementacion Docker del backend:
- El backend se construye con `backend/Dockerfile`.
- El arranque usa `npm run docker:start` (`prisma migrate deploy && npm start`).
- Se eliminaron montajes de volumen del backend en Compose para evitar que se pisen `node_modules` dentro del contenedor.
- El backend espera a PostgreSQL mediante `healthcheck` + `depends_on.condition: service_healthy`.

Nota: el `frontend` no esta en Compose, se ejecuta aparte con `npm start` en `frontend/`.

## Variables de entorno

### Backend (`backend/.env`)

Variables base:

- `DATABASE_URL` (obligatoria)
- `JWT_SECRET` (obligatoria)
- `JWT_EXPIRES_IN` (ej: `7d`)
- `PORT` (default `5000`)
- `NODE_ENV` (`development` o `production`)
- `FRONTEND_URL` (CORS)

Google OAuth (opcional):

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Mailjet (opcional):

- `MAILJET_API_KEY`
- `MAILJET_API_SECRET`
- `MAILJET_FROM_EMAIL`
- `MAILJET_FROM_NAME`
- `MAILJET_REPLY_TO_EMAIL`
- `MAILJET_REPLY_TO_NAME`
- `MAILJET_UNSUBSCRIBE_URL`
- `MAILER_COMPANY_ADDRESS`
- `APP_NAME`

SMTP (opcional, prioridad sobre Mailjet si esta configurado):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_IP_FAMILY`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_EMAIL`
- `SMTP_FROM_NAME`

Geocodificacion (opcional):

- `NOMINATIM_USER_AGENT`
- `NOMINATIM_EMAIL`

En Docker Compose, estas variables se definen en el bloque `services.backend.environment` de `docker-compose.yml`.

### Frontend (`frontend/.env`)

- `REACT_APP_API_URL` (ej: `http://localhost:5000/api`)
- `REACT_APP_GOOGLE_CLIENT_ID` (para mostrar login Google)

Configuracion actual del chatbot IA:
- La integracion de Chatbase esta en `frontend/public/index.html`.
- El identificador del bot se define en el atributo `script.id` del loader.

## Scripts disponibles

### Backend (`backend/package.json`)

- `npm run dev`: servidor con nodemon.
- `npm start`: servidor en modo normal.
- `npm run docker:start`: aplica migraciones y arranca la API (uso en contenedor Docker).
- `npm run build`: genera Prisma Client.
- `npm run prisma:generate`: genera Prisma Client.
- `npm run prisma:migrate`: ejecuta migraciones en modo desarrollo.
- `npm run prisma:studio`: abre Prisma Studio.
- `npm test`: ejecuta Jest.

### Frontend (`frontend/package.json`)

- `npm start`: servidor de desarrollo.
- `npm run build`: build de produccion.
- `npm test`: tests de React Scripts.
- `npm run eject`: expone configuracion CRA.

## Endpoints principales (resumen)

Base URL backend: `http://localhost:5000/api`

## Documentacion OpenAPI (Swagger)

- UI Swagger: `http://localhost:5000/api/docs`
- Spec OpenAPI JSON: `http://localhost:5000/api/openapi.json`
- Incluye todos los endpoints actuales de `auth`, `admin`, `donations`, `needs`, `conversations` y rutas de `health`.

### Auth (`/auth`)
- `POST /register/donor`
- `POST /register/ong` (multipart, hasta 5 documentos)
- `POST /login`
- `POST /login/google`
- `GET /profile`
- `PUT /profile`
- `GET /my-ong`
- `PUT /my-ong`
- `GET /ongs` (listado publico de ONGs)

### Admin (`/admin`) - requiere rol `ADMIN`
- `GET /stats`
- `GET /ongs`
- `GET /ongs/pending`
- `GET /ongs/:id`
- `GET /documents/:documentId`
- `PUT /ongs/:id/approve`
- `PUT /ongs/:id/reject`

### Donaciones (`/donations`)
- `POST /`
- `GET /available`
- `GET /my-donations`
- `GET /assigned`
- `GET /:id`
- `PUT /:id`
- `DELETE /:id`
- `POST /:id/request`
- `POST /:id/reject`
- `POST /:id/delivered`

### Necesidades (`/needs`)
- `GET /`
- `GET /my`
- `GET /:id`
- `POST /`
- `POST /:id/close`

### Conversaciones (`/conversations`)
- `GET /`
- `GET /donation/:donationId`
- `GET /need/:needId`
- `POST /need/:needId`
- `GET /:conversationId`
- `GET /:conversationId/shipping-cost`
- `POST /:conversationId/messages`

## Modelo de datos (Prisma)

Entidades principales:
- `User`
- `Ong`
- `OngDocument`
- `Donation`
- `Need`
- `Conversation`
- `Message`
- `Assignment`

Enums:
- `UserRole`: `DONANTE`, `ONG`, `ADMIN`
- `OngStatus`: `PENDING`, `APPROVED`, `REJECTED`
- `OngType`: `ONG`, `ASOCIACION`, `FUNDACION`, `ENTIDAD_SOCIAL`
- `DonationStatus`: `DISPONIBLE`, `ASIGNADO`, `ENTREGADO`
- `NeedStatus`: `OPEN`, `CLOSED`
- `ConversationStatus`: `OPEN`, `CLOSED`

## Estructura del repositorio

```text
.
|-- backend/
|   |-- prisma/
|   |   |-- schema.prisma
|   |   `-- migrations/
|   |-- src/
|   |   |-- config/
|   |   |-- controllers/
|   |   |-- middlewares/
|   |   |-- routes/
|   |   |-- services/
|   |   |-- utils/
|   |   `-- scripts/
|   |-- Dockerfile
|   `-- package.json
|-- frontend/
|   |-- public/
|   |-- src/
|   |   |-- components/
|   |   |-- context/
|   |   |-- pages/
|   |   |-- services/
|   |   `-- utils/
|   `-- package.json
|-- .github/workflows/node.js.yml
|-- docker-compose.yml
|-- DONATION_MANAGEMENT.md
|-- NUEVAS_FUNCIONALIDADES.md
`-- README.md
```

## CI

Workflow: `.github/workflows/node.js.yml`

En `push`/`pull_request` a `main`:
- Instala dependencias backend y frontend.
- Genera Prisma Client.
- Ejecuta build backend.
- Ejecuta build frontend.

## Estado de testing

- Hay scripts de test (`npm test`) en backend y frontend.
- Actualmente no hay archivos de tests automatizados versionados en el repo.

## Notas importantes

- El chat actual funciona por endpoints REST (no hay integracion activa de `socket.io` en el codigo de servidor).
- Los documentos de ONG se almacenan en base de datos (`OngDocument.data`), no en sistema de archivos.
- Existe endpoint de salud: `GET /health` y `GET /health/db`.

## Documentacion adicional

- `DONATION_MANAGEMENT.md`
- `NUEVAS_FUNCIONALIDADES.md`

## Licencia

ISC
