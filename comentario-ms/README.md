# Microservicio de Comentarios (comentario-ms)

## 📖 Descripción

El **comentario-ms** es un microservicio responsable de la gestión de comentarios vinculados a servicios. Proporciona operaciones para crear, listar y obtener comentarios. Implementa características avanzadas como **idempotencia** para prevenir duplicados y **validación distribuida** de servicios.

## 🎯 Responsabilidades

- ✅ Crear nuevos comentarios con idempotencia
- ✅ Listar todos los comentarios
- ✅ Obtener un comentario por ID
- ✅ Listar comentarios filtrados por servicio
- ✅ Validar existencia de servicios (consulta a servicio-ms)
- ✅ Prevenir creación de comentarios duplicados

## 🏗️ Arquitectura Interna

```
comentario-ms/
├── src/
│   ├── main.ts                    # Punto de entrada
│   ├── app.module.ts             # Módulo principal
│   ├── app.controller.ts         # Controlador HTTP
│   ├── app.service.ts            # Lógica de app
│   └── comentario/
│       ├── comentario.module.ts        # Módulo de comentario
│       ├── comentario.controller.ts    # Manejador de mensajes RabbitMQ
│       ├── comentario.service.ts       # Lógica de negocio
│       ├── comentario.entity.ts        # Entidad TypeORM
│       ├── idempotencia.entity.ts      # Entidad para prevenir duplicados
│       └── comentario.dto.ts           # Data Transfer Objects
├── docker-compose.yml
├── Dockerfile
└── .env
```

## 🔌 API y Patrones de Mensaje

### Mensajes RabbitMQ que Escucha

#### 1️⃣ `comentario.crear`
Crea un nuevo comentario con validaciones y control de duplicados.

**Request:**
```json
{
  "servicio_id": 1,
  "contenido": "Excelente servicio, muy satisfecho",
  "calificacion": 5,
  "idempotency_key": "unique-key-12345"
}
```

**Response:**
```json
{
  "id": 1,
  "servicio_id": 1,
  "contenido": "Excelente servicio, muy satisfecho",
  "calificacion": 5,
  "created_at": "2025-12-08T10:40:00.000Z"
}
```

#### 2️⃣ `comentario.listar`
Lista todos los comentarios registrados.

**Request:**
```json
{}
```

**Response:**
```json
[
  {
    "id": 1,
    "servicio_id": 1,
    "contenido": "Excelente servicio",
    "calificacion": 5,
    "created_at": "2025-12-08T10:40:00.000Z"
  }
]
```

#### 3️⃣ `comentario.obtener`
Obtiene un comentario específico por ID.

**Request:**
```json
{
  "id": 1
}
```

**Response:**
```json
{
  "id": 1,
  "servicio_id": 1,
  "contenido": "Excelente servicio",
  "calificacion": 5,
  "created_at": "2025-12-08T10:40:00.000Z"
}
```

#### 4️⃣ `comentario.listar_por_servicio`
Lista comentarios filtrados por servicio.

**Request:**
```json
{
  "servicio_id": 1
}
```

**Response:**
```json
[
  {
    "id": 1,
    "servicio_id": 1,
    "contenido": "Excelente servicio",
    "calificacion": 5,
    "created_at": "2025-12-08T10:40:00.000Z"
  }
]
```

## 🗄️ Base de Datos

### Tabla `comentario`

```sql
CREATE TABLE comentario (
  id SERIAL PRIMARY KEY,
  servicio_id INTEGER NOT NULL,
  contenido TEXT NOT NULL,
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla `idempotencia`

```sql
CREATE TABLE idempotencia (
  id SERIAL PRIMARY KEY,
  idempotency_key VARCHAR(255) UNIQUE NOT NULL,
  procesado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Flujo de Creación de Comentario

```
1. Gateway recibe POST /comentarios
   ↓
2. Valida idempotencia: ¿La clave ya fue procesada?
   ↓ (Si no)
3. Consulta servicio-ms: ¿Existe el servicio?
   ├─ RabbitMQ → servicio.validar
   └─ Respuesta: { existe: true/false }
   ↓ (Si existe)
4. Guarda comentario en PostgreSQL
   ↓
5. Guarda clave idempotencia
   ↓
6. Emite evento "comentario.creado" (opcional)
   ├─ RabbitMQ → emit('comentario.creado', {...})
   └─ Servicio-MS escucha (posible integración futura)
   ↓
7. Responde al cliente
```

## 🛡️ Idempotencia

La idempotencia previene la creación de comentarios duplicados cuando un cliente reintenta una solicitud:

```typescript
// Ejemplo de uso:
// Intento 1: idempotency_key = "user-123-comment-1"
// → Comentario creado exitosamente

// Intento 2: mismo idempotency_key (error de red, reintentos, etc.)
// → Verificación: ¿Existe la clave en tabla idempotencia?
// → Si existe: Retorna { mensaje: 'Comentario ignorado (duplicado)' }
// → No se crea comentario duplicado
```

## 🔐 Validación Distribuida

El comentario-ms se comunica con servicio-ms para validar que el servicio existe:

```typescript
// Antes de crear un comentario, consulta:
const validacion = await this.validarServicio(data.servicio_id);
// RabbitMQ → servicio.validar → servicio-ms responde

if (!validacion.existe) {
  throw new Error(`Servicio ${data.servicio_id} no existe`);
}
// Solo si existe, procede a crear el comentario
```

## 🛠️ Configuración

```env
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

## 🚀 Inicio

```bash
npm install
npm run start:dev
```

## 🧪 Ejemplo de Uso

### Crear un comentario
```bash
curl -X POST http://localhost:3000/comentarios \
  -H "Content-Type: application/json" \
  -d '{
    "servicio_id": 1,
    "contenido": "Excelente",
    "calificacion": 5,
    "idempotency_key": "unique-123"
  }'
```

### Listar comentarios
```bash
curl -X GET http://localhost:3000/comentarios
```

### Listar comentarios de un servicio
```bash
curl -X GET http://localhost:3000/servicios/1/comentarios
```

## 📊 Entidades TypeORM

### ComentarioEntity
```typescript
@Entity()
export class Comentario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  servicio_id: number;

  @Column()
  contenido: string;

  @Column({ nullable: true })
  calificacion: number;

  @CreateDateColumn()
  created_at: Date;
}
```

### IdempotenciaEntity
```typescript
@Entity()
export class Idempotencia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  idempotency_key: string;

  @CreateDateColumn()
  procesado_en: Date;
}
```

## 📞 Soporte

Ver `../README.md` para más información.
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
