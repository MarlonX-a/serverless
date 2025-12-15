# Microservicio de Servicios (servicio-ms)

## 📖 Descripción

El **servicio-ms** es un microservicio responsable de la gestión de servicios. Proporciona operaciones CRUD para crear, listar y obtener servicios. También valida la existencia de servicios cuando otros microservicios lo requieren.

## 🎯 Responsabilidades

- ✅ Crear nuevos servicios
- ✅ Listar todos los servicios
- ✅ Obtener un servicio por ID
- ✅ Validar existencia de servicios (para comentario-ms)

## 🏗️ Arquitectura Interna

```
servicio-ms/
├── src/
│   ├── main.ts                 # Punto de entrada
│   ├── app.module.ts          # Módulo principal
│   ├── app.controller.ts      # Controlador HTTP
│   ├── app.service.ts         # Lógica de app
│   └── servicio/
│       ├── servicio.module.ts        # Módulo de servicio
│       ├── servicio.controller.ts    # Manejador de mensajes RabbitMQ
│       ├── servicio.service.ts       # Lógica de negocio
│       ├── servicio.entity.ts        # Entidad TypeORM
│       └── servicio.dto.ts           # Data Transfer Objects
├── docker-compose.yml
├── Dockerfile
└── .env
```

## 🔌 API y Patrones de Mensaje

### Mensajes RabbitMQ que Escucha

#### 1️⃣ `servicio.crear`
Crea un nuevo servicio en la base de datos.

**Request:**
```json
{
  "nombre": "Corte de Cabello",
  "descripcion": "Corte de cabello profesional",
  "precio": 25.50
}
```

**Response:**
```json
{
  "id": 1,
  "nombre": "Corte de Cabello",
  "descripcion": "Corte de cabello profesional",
  "precio": 25.50,
  "created_at": "2025-12-08T10:40:00.000Z"
}
```

#### 2️⃣ `servicio.listar`
Lista todos los servicios registrados.

**Request:**
```json
{}
```

**Response:**
```json
[
  {
    "id": 1,
    "nombre": "Corte de Cabello",
    "descripcion": "Corte de cabello profesional",
    "precio": 25.50,
    "created_at": "2025-12-08T10:40:00.000Z"
  }
]
```

#### 3️⃣ `servicio.obtener`
Obtiene un servicio específico por ID.

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
  "nombre": "Corte de Cabello",
  "descripcion": "Corte de cabello profesional",
  "precio": 25.50,
  "created_at": "2025-12-08T10:40:00.000Z"
}
```

#### 4️⃣ `servicio.validar`
Valida si un servicio existe (usado por comentario-ms).

**Request:**
```json
{
  "servicio_id": 1
}
```

**Response:**
```json
{
  "servicio_id": 1,
  "existe": true
}
```

## 🗄️ Base de Datos

### Tabla `servicio`

```sql
CREATE TABLE servicio (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  descripcion TEXT,
  precio DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🔄 Flujo de Funcionamiento

Gateway → RabbitMQ (patrón: servicio.crear) → Servicio-MS → PostgreSQL → Response

## 🛠️ Configuración

```env
PORT=3001
DB_HOST=postgres
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE_SERVICIO=servicio_queue
```

## 🚀 Inicio

```bash
npm install
npm run start:dev
```

## 🧪 Ejemplo de Uso

### Crear un servicio
```bash
curl -X POST http://localhost:3000/servicios \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Corte", "precio": 25.50}'
```

### Listar servicios
```bash
curl -X GET http://localhost:3000/servicios
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
