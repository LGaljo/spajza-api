# Špajza Backend API - Agent Guidelines

This directory contains the NestJS REST API codebase. This backend handles database persistence, security, authentication, request tracing, rental logic, S3 image uploads, and email routing.

---

## Technical Stack

- **Framework:** NestJS 11 (TypeScript)
- **Database:** MongoDB via Mongoose (defined through TypeScript schemas)
- **Authentication:** Passport.js, Passport-JWT, Passport-Local, and custom role guards
- **Mailing:** Nodemailer (using Handlebars `.html` templates located in `src/templates`)
- **Storage:** AWS S3 SDK for image and document uploads
- **Testing:** Jest for unit and integration testing; Jest E2E config for API lifecycle tests

---

## Project Structure Map

```
spajza-api/
├── src/
│   ├── main.ts                       # NestJS bootstrap script
│   ├── app.module.ts                 # Main App module imports and middleware wiring
│   ├── context.ts                    # Global execution Context model
│   ├── config/
│   │   └── env.ts                    # Environment variables mapping and type-safety
│   ├── guards/
│   │   ├── jwt-auth.guard.ts         # JWT token passport verification
│   │   ├── roles.decorator.ts        # Role annotation decorator
│   │   └── roles.guard.ts            # RBAC authorization enforcer
│   ├── lib/
│   │   ├── aws_s3.ts                 # AWS S3 upload helper
│   │   ├── smtp.ts                   # Nodemailer wrapper
│   │   └── utils.ts                  # Shared helper functions
│   ├── middlewares/
│   │   ├── context.middleware.ts     # Injects request.context (type IRequest)
│   │   └── request-log.middleware.ts # Access logger middleware
│   └── modules/                      # Business logic modules (Controller-Service-Schema pattern)
│       ├── auth/                     # Authentication & login logic
│       ├── categories/               # Inventory category trees
│       ├── counters/                 # Auto-increment fields
│       ├── inventoryitem/            # Item profiles, images, and status tracking
│       ├── rents/                    # Item borrowing, check-ins, check-outs, and history
│       ├── reservations/             # Reservation queues and slot handling
│       ├── tags/                     # Item metadata tags
│       ├── tracing/                  # Log tracer & activity tracking
│       ├── user/                     # Users list, registration, password resets
│       └── wishlist/                 # Wishlists
```

---

## Key Conventions & Guidelines

### 1. Controllers & Route Security
Always secure new endpoints using guards. Do not expose open endpoints unless absolutely necessary.
- **JWT Protection:** Apply `@UseGuards(JwtAuthGuard)` to endpoints requiring authentication.
- **RBAC Roles:** Apply `@UseGuards(RolesGuard)` and `@Roles(Role.ADMIN, Role.KEEPER, Role.USER)` to control granular permission access.
  - `Role.ADMIN` has superuser permissions.
  - `Role.KEEPER` manages storage, checking items in and out.
  - `Role.USER` is a standard consumer (can view, borrow, reserve).

```typescript
@Get(':id')
@UseGuards(JwtAuthGuard)
@UseGuards(RolesGuard)
@Roles(Role.ADMIN, Role.USER)
public async getOne(@Param('id') id: string): Promise<any> {
  return await this.service.findOneById(new ObjectId(id));
}
```

### 2. Context Ingestion
The backend uses a `ContextMiddleware` that attaches a `context` object containing environmental parameters (`env`) and the current parsed `user` directly to the Express `IRequest`.
- When dealing with requests, use the `IRequest` interface (from `src/middlewares/context.middleware.ts`) to access context.
- Try to design services and controllers to cleanly propagate this contextual state where required.

### 3. Mongoose Schemas & ObjectIds
- Do not pass raw strings directly as MongoDB/Mongoose ObjectIds where schema references or native query filtering is expected. Use `new ObjectId(id)` from `mongodb` or `mongoose.Types.ObjectId` when casting ids in services and controllers.
- Schemas use NestJS Mongoose decorators (`@Schema()`, `@Prop()`, `SchemaFactory.createForClass()`).

### 4. Code Formatting and Standards
- Run `npm run format` to auto-format the codebase with Prettier before saving or submitting changes.
- Avoid bypassing NestJS dependency injection. Register all new controllers, services, and schemas within their respective module files, and import those modules into `AppModule` if needed.
- Follow the established async/await patterns. All controller route handlers should be `async` and return promises.

---

## Docker Compose Support

The backend API includes a configured `docker-compose.yml` file which starts both the NestJS API application and a local MongoDB instance.

- The application service automatically loads other configuration variables from the `.env` file (e.g. mail, AWS, salt parameters) and overrides the database connection to target the containerized mongo database service.
- The MongoDB database service exposes port `27017` to the host and persists its data inside a Docker volume named `mongo-data`.
- A built-in health check ensures that the database is fully responsive (`mongosh` ping) before spawning the NestJS API.

---

## Useful Development Commands

Run these commands inside the `spajza-api/` subdirectory:

- **Start Local Application & Database Services via Docker Compose:**
  ```bash
  docker compose up --build
  ```
- **Stop Docker Compose Services:**
  ```bash
  docker compose down
  ```
- **Start Development Server (with watch):**
  ```bash
  npm run start:dev
  ```
- **Build Production Bundle:**
  ```bash
  npm run build
  ```
- **Lint Codebase:**
  ```bash
  npm run lint
  ```
- **Format Files:**
  ```bash
  npm run format
  ```
- **Run Unit/Integration Tests:**
  ```bash
  npm test
  ```
- **Run End-to-End Tests:**
  ```bash
  npm run test:e2e
  ```
