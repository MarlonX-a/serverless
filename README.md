# Sistema de Microservicios - Gestión de Servicios y Comentarios

## 📋 Descripción General

Este es un sistema de microservicios basado en **NestJS** que implementa una arquitectura distribuida con:
- **API Gateway**: Punto de entrada único para todas las solicitudes
- **Servicio de Servicios (servicio-ms)**: Gestión de servicios
- **Servicio de Comentarios (comentario-ms)**: Gestión de comentarios vinculados a servicios
- **RabbitMQ**: Sistema de mensajería asíncrona entre microservicios
- **PostgreSQL**: Base de datos persistente compartida

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────┐
│         API Gateway (Puerto 3000)        │
│  - Ruta /servicios → ServicioMS          │
│  - Ruta /comentarios → ComentarioMS      │
└──────────────────────────────────────────┘
           ↓                  ↓
    ┌─────────────────┐  ┌─────────────────┐
    │  Servicio-MS    │  │ Comentario-MS   │
    │  (Puerto 3001)  │  │  (Puerto 3002)  │
    └─────────────────┘  └─────────────────┘
           ↓                  ↓
┌──────────────────────────────────────────┐
│           PostgreSQL (Puerto 5432)       │
│  - Database: servicio_db                 │
│  - Database: comentario_db               │
└──────────────────────────────────────────┘
           ↕
    ┌─────────────────────┐
    │   RabbitMQ          │
    │   (Puerto 5672)     │
    │   Colas:            │
    │   - servicio_queue  │
    │   - comentario_queue│
    └─────────────────────┘
```

## 🚀 Inicio Rápido

### Prerrequisitos
- Docker y Docker Compose instalados
- Node.js 20+ (para desarrollo local)

### Levantar los Servicios

```bash
# Limpiar volúmenes anteriores
docker-compose down -v

# Construir e iniciar todos los servicios
docker-compose up --build
```

Los servicios estarán disponibles en:
- Gateway: `http://localhost:3000`
- Servicio-MS: `http://localhost:3001`
- Comentario-MS: `http://localhost:3002`
- RabbitMQ Management: `http://localhost:15672` (usuario: guest, contraseña: guest)

---

## 📚 Documentación de Servicios

Ver archivos específicos para cada servicio:
- [`servicio-ms/README.md`](./servicio-ms/README.md) - Microservicio de Servicios
- [`comentario-ms/README.md`](./comentario-ms/README.md) - Microservicio de Comentarios
- [`gateway/README.md`](./gateway/README.md) - API Gateway

---

## 🔧 Configuración

### Variables de Entorno

Cada servicio tiene su propio archivo `.env`:

**servicio-ms/.env**
```
PORT=3001
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=servicio_db
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE_SERVICIO=servicio_queue
```

**comentario-ms/.env**
```
PORT=3002
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=comentario_db
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE_COMENTARIO=comentario_queue
RABBITMQ_QUEUE_SERVICIO=servicio_queue
```

**gateway/.env**
```
PORT=3000
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE_COMENTARIO=comentario_queue
RABBITMQ_QUEUE_SERVICIO=servicio_queue
```

---

## 🐳 Docker Compose

El archivo `docker-compose.yml` orquesta todos los servicios:

- **postgres**: Base de datos PostgreSQL con volumen persistente
- **rabbitmq**: Broker de mensajes con panel de administración
- **servicio-ms**: Microservicio de servicios
- **comentario-ms**: Microservicio de comentarios
- **gateway**: API Gateway

---

## 📡 Comunicación Entre Servicios

### Patrones de Mensaje RabbitMQ

**Servicio-MS escucha:**
- `servicio.crear` - Crear nuevo servicio
- `servicio.listar` - Listar todos los servicios
- `servicio.obtener` - Obtener servicio por ID
- `servicio.validar` - Validar existencia de servicio

**Comentario-MS escucha:**
- `comentario.crear` - Crear nuevo comentario
- `comentario.listar` - Listar todos los comentarios
- `comentario.obtener` - Obtener comentario por ID
- `comentario.listar_por_servicio` - Listar comentarios de un servicio

**Eventos Emitidos:**
- `comentario.creado` - Cuando se crea un comentario (enviado por comentario-ms a servicio-ms)

---

## 🔄 Flujos de Negocio

### 1. Crear un Servicio
```
Client → Gateway (POST /servicios)
    ↓
Gateway → RabbitMQ (patrón: servicio.crear)
    ↓
Servicio-MS → PostgreSQL (guarda en servicio_db)
    ↓
Response ← Servicio-MS ← Gateway ← Client
```

### 2. Crear un Comentario
```
Client → Gateway (POST /comentarios)
    ↓
Gateway → RabbitMQ (patrón: comentario.crear)
    ↓
Comentario-MS:
  1. Valida idempotencia (evita duplicados)
  2. Valida existencia del servicio (RabbitMQ → servicio.validar)
  3. Guarda comentario en PostgreSQL
  4. Emite evento "comentario.creado" (opcional)
    ↓
Response ← Comentario-MS ← Gateway ← Client
```

### 3. Consulta Distribuida (Servicio + Comentarios)
```
Client → Gateway (GET /servicios/:id/comentarios)
    ↓
Gateway:
  1. Obtiene servicio (RabbitMQ → servicio.obtener)
  2. Obtiene comentarios (RabbitMQ → comentario.listar_por_servicio)
    ↓
Servicio-MS y Comentario-MS responden en paralelo
    ↓
Response (servicio + comentarios) ← Gateway ← Client
```

---

## 📊 Base de Datos

### Tablas - servicio_db

**servicio** - Tabla de servicios
```sql
CREATE TABLE servicio (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tablas - comentario_db

**comentario** - Tabla de comentarios
```sql
CREATE TABLE comentario (
  id SERIAL PRIMARY KEY,
  servicio_id INTEGER NOT NULL,
  contenido TEXT NOT NULL,
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**idempotencia** - Tabla para prevenir duplicados
```sql
CREATE TABLE idempotencia (
  id SERIAL PRIMARY KEY,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  procesado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛠️ Desarrollo Local

### Instalar dependencias
```bash
cd servicio-ms && npm install
cd ../comentario-ms && npm install
cd ../gateway && npm install
```

### Ejecutar en desarrollo (sin Docker)
```bash
# Terminal 1 - Servicio-MS
cd servicio-ms
npm run start:dev

# Terminal 2 - Comentario-MS
cd comentario-ms
npm run start:dev

# Terminal 3 - Gateway
cd gateway
npm run start:dev
```

### Compilar a producción
```bash
npm run build
```

---

## 🧪 Testing

### Tests Unitarios
```bash
npm run test
```

### Tests E2E
```bash
npm run test:e2e
```

---

## 📝 Licencia

Este proyecto es parte de la tarea de Aplicaciones para Servidor Web - Parcial 2.

---

## 📧 Soporte

Para problemas o preguntas sobre la arquitectura y funcionamiento de los microservicios, consulta los READMEs individuales de cada servicio.
