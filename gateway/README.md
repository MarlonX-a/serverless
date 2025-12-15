# API Gateway

## 📖 Descripción

El **API Gateway** es el punto de entrada único para todas las solicitudes HTTP del cliente. Actúa como intermediario entre los clientes y los microservicios internos, orquestando la comunicación a través de **RabbitMQ**.

El gateway NO almacena datos directamente, sino que actúa como enrutador y coordinador de solicitudes entre múltiples microservicios.

## 🎯 Responsabilidades

- ✅ Recibir solicitudes HTTP de clientes
- ✅ Enrutar solicitudes a los microservicios correspondientes
- ✅ Comunicarse con microservicios vía RabbitMQ
- ✅ Esperar y retornar respuestas de microservicios
- ✅ Orquestar consultas distribuidas
- ✅ Manejo de errores y timeouts

## 🏗️ Arquitectura Interna

```
gateway/
├── src/
│   ├── main.ts                    # Punto de entrada
│   ├── app.module.ts             # Módulo principal
│   ├── app.controller.ts         # Controlador raíz
│   ├── app.service.ts            # Lógica de app
│   └── (módulos de orquestación)
│       ├── servicio/
│       │   ├── servicio.module.ts         # Módulo de servicios
│       │   ├── servicio.controller.ts     # Controlador /servicios
│       │   └── servicio.service.ts        # Lógica de orquestación
│       └── comentario/
│           ├── comentario.module.ts       # Módulo de comentarios
│           ├── comentario.controller.ts   # Controlador /comentarios
│           └── comentario.service.ts      # Lógica de orquestación
├── docker-compose.yml
├── Dockerfile
└── .env
```

## 🌐 Rutas HTTP

### 📌 Servicios

#### `POST /servicios` - Crear servicio
Crea un nuevo servicio.

**Request:**
```bash
curl -X POST http://localhost:3000/servicios \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Corte de Cabello",
    "descripcion": "Corte profesional",
    "precio": 25.50
  }'
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "nombre": "Corte de Cabello",
  "descripcion": "Corte profesional",
  "precio": 25.50,
  "created_at": "2025-12-08T10:40:00.000Z"
}
```

---

#### `GET /servicios` - Listar servicios
Lista todos los servicios registrados.

**Request:**
```bash
curl -X GET http://localhost:3000/servicios
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "nombre": "Corte de Cabello",
    "descripcion": "Corte profesional",
    "precio": 25.50,
    "created_at": "2025-12-08T10:40:00.000Z"
  },
  {
    "id": 2,
    "nombre": "Tinte de Cabello",
    "descripcion": "Tinte de alta calidad",
    "precio": 45.00,
    "created_at": "2025-12-08T10:45:30.000Z"
  }
]
```

---

#### `GET /servicios/:id` - Obtener servicio
Obtiene un servicio específico por ID.

**Request:**
```bash
curl -X GET http://localhost:3000/servicios/1
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "nombre": "Corte de Cabello",
  "descripcion": "Corte profesional",
  "precio": 25.50,
  "created_at": "2025-12-08T10:40:00.000Z"
}
```

---

#### `GET /servicios/:id/comentarios` - Consulta Distribuida
Obtiene un servicio con todos sus comentarios (requiere consultar dos microservicios).

**Request:**
```bash
curl -X GET http://localhost:3000/servicios/1/comentarios
```

**Response:** `200 OK`
```json
{
  "servicio": {
    "id": 1,
    "nombre": "Corte de Cabello",
    "descripcion": "Corte profesional",
    "precio": 25.50,
    "created_at": "2025-12-08T10:40:00.000Z"
  },
  "comentarios": [
    {
      "id": 1,
      "servicio_id": 1,
      "contenido": "Excelente servicio",
      "calificacion": 5,
      "created_at": "2025-12-08T10:50:00.000Z"
    }
  ]
}
```

---

### 💬 Comentarios

#### `POST /comentarios` - Crear comentario
Crea un nuevo comentario para un servicio.

**Request:**
```bash
curl -X POST http://localhost:3000/comentarios \
  -H "Content-Type: application/json" \
  -d '{
    "servicio_id": 1,
    "contenido": "Excelente servicio, muy satisfecho",
    "calificacion": 5,
    "idempotency_key": "unique-key-12345"
  }'
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "servicio_id": 1,
  "contenido": "Excelente servicio, muy satisfecho",
  "calificacion": 5,
  "created_at": "2025-12-08T10:50:00.000Z"
}
```

---

#### `GET /comentarios` - Listar comentarios
Lista todos los comentarios registrados.

**Request:**
```bash
curl -X GET http://localhost:3000/comentarios
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "servicio_id": 1,
    "contenido": "Excelente servicio",
    "calificacion": 5,
    "created_at": "2025-12-08T10:50:00.000Z"
  }
]
```

---

#### `GET /comentarios/:id` - Obtener comentario
Obtiene un comentario específico por ID.

**Request:**
```bash
curl -X GET http://localhost:3000/comentarios/1
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "servicio_id": 1,
  "contenido": "Excelente servicio",
  "calificacion": 5,
  "created_at": "2025-12-08T10:50:00.000Z"
}
```

---

## 🔄 Flujo de Solicitud

### 1. Solicitud Simple (GET /servicios)

```
┌──────────────────┐
│ Cliente HTTP     │
│ GET /servicios   │
└────────┬─────────┘
         │
         ↓
┌────────────────────┐
│ API Gateway        │
│ (Puerto 3000)      │
└────────┬───────────┘
         │
         ├─→ RabbitMQ: send('servicio.listar', {})
         │      ↓
         ├─→ Servicio-MS escucha y responde
         │      ↓
         └─← Response recibida
         │
         ↓
┌──────────────────┐
│ Response JSON    │
│ 200 OK           │
└──────────────────┘
```

### 2. Consulta Distribuida (GET /servicios/1/comentarios)

```
┌──────────────────────────────────────┐
│ Cliente HTTP                         │
│ GET /servicios/1/comentarios         │
└────────┬─────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────┐
│ API Gateway                            │
│ (Puerto 3000)                          │
└────┬──────────────────────────┬────────┘
     │                          │
     ↓ PARALELO                 ↓
┌──────────────────────┐  ┌─────────────────────┐
│ RabbitMQ Request 1   │  │ RabbitMQ Request 2  │
│ servicio.obtener     │  │ comentario.listar   │
│ {id: 1}              │  │ {servicio_id: 1}    │
└──────────┬───────────┘  └──────────┬──────────┘
           │                         │
           ↓                         ↓
      Servicio-MS             Comentario-MS
           │                         │
           └──────────┬──────────────┘
                      │
                      ↓
           Respuestas recibidas
                      │
                      ↓
┌─────────────────────────────────────┐
│ Response JSON (Objeto combinado)    │
│ {servicio: {...}, comentarios: [...]}
│ 200 OK                              │
└─────────────────────────────────────┘
```

## 🛠️ Configuración

```env
PORT=3000
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
RABBITMQ_QUEUE_COMENTARIO=comentario_queue
RABBITMQ_QUEUE_SERVICIO=servicio_queue
```

## 🚀 Inicio

```bash
npm install
npm run start:dev
```

El gateway estará disponible en `http://localhost:3000`

## 🔌 Integración con Microservicios

### ClientProxy Pattern

El gateway utiliza NestJS `ClientProxy` para comunicarse con microservicios:

```typescript
@Injectable()
export class ServicioGatewayService {
  private servicioClient: ClientProxy;

  constructor(private config: ConfigService) {
    this.servicioClient = ClientProxyFactory.create({
      transport: Transport.RMQ,
      options: {
        urls: [this.config.get('RABBITMQ_URL')],
        queue: this.config.get('RABBITMQ_QUEUE_SERVICIO'),
        queueOptions: { durable: true }
      },
    });
  }

  listar() {
    return this.servicioClient.send('servicio.listar', {});
  }
}
```

## ⏱️ Timeouts

El gateway tiene un timeout predeterminado para respuestas de microservicios. Si un microservicio no responde en tiempo, la solicitud falla con `504 Gateway Timeout`.

## 🔒 Seguridad

- ✅ Comunicación cifrada con RabbitMQ
- ✅ Validación de entrada en controladores
- ✅ Aislamiento en contenedor Docker
- ✅ Credenciales de RabbitMQ en variables de entorno

## 📊 Monitoreo

### Health Check
```bash
GET http://localhost:3000/
```

Response:
```
Hello World!
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
