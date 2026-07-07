# HR Management API

A production-grade **HR Management Backend API** built with **NestJS + TypeScript (strict)**,
**PostgreSQL**, and **TypeORM**. It provides JWT authentication, employee management with
photo uploads, attendance tracking with upsert semantics, and a monthly attendance report.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Database schema](#database-schema)
- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Running the app](#running-the-app)
- [Database migrations](#database-migrations)
- [Seeding sample data](#seeding-sample-data)
- [API documentation (Swagger)](#api-documentation-swagger)
- [Endpoints](#endpoints)
- [Response envelope](#response-envelope)
- [Project structure](#project-structure)
- [Scripts](#scripts)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)

---

## Features

- 🔐 **JWT authentication** via Passport (`POST /auth/login`), global `JwtAuthGuard` protecting
  all routes except explicitly public ones (`@Public()`).
- 👤 **Employees** CRUD with pagination, case-insensitive name search (ILIKE), **soft delete**,
  and **multipart photo upload** (local disk storage).
- 🕒 **Attendance** CRUD with **upsert** on `(employee_id, date)` — inserting or updating the
  check-in time without duplicating rows.
- 📊 **Reports**: monthly attendance report per employee (`days_present`, `times_late` where
  `check_in_time > 09:45:00`).
- ✅ **Strict TypeScript** end to end, **class-validator** DTOs, **zero `any`** (enforced by ESLint).
- 🧱 Consistent JSON response envelope via a global interceptor + centralized exception filter.
- 📚 **OpenAPI / Swagger** at `/api/docs`.
- ⚙️ Env-driven config with **Joi** validation at boot.

## Tech stack

| Concern            | Choice                                              |
| ------------------ | --------------------------------------------------- |
| Runtime            | Node.js ≥ 20, TypeScript 5 (strict)                 |
| Framework          | NestJS 11                                           |
| Database           | PostgreSQL                                          |
| ORM                | TypeORM (`@nestjs/typeorm`)                         |
| Validation         | `class-validator` + `class-transformer`            |
| Auth               | `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`  |
| Docs               | `@nestjs/swagger`                                   |
| Uploads            | Multer via `@nestjs/platform-express`               |
| Config             | `@nestjs/config` + Joi schema validation            |
| Password hashing   | `bcryptjs` (pure JS — no native build step)         |
| Lint / Format      | ESLint + Prettier                                   |

## Architecture

The app is organised into feature modules, each owning its controller, service, DTOs, and (where
relevant) entities/repositories:

- **AuthModule** — login + JWT strategy.
- **EmployeesModule** — employee CRUD, photo uploads (Multer).
- **AttendanceModule** — attendance CRUD + upsert.
- **ReportsModule** — read-only aggregation/reporting.
- **DatabaseModule** — global TypeORM connection (env-driven pooling/SSL).
- **common/** — cross-cutting concerns: config, global guard, response interceptor, exception
  filter, decorators, shared interfaces, and the Express `Request.user` augmentation.

Global providers registered in `AppModule`:

- `ValidationPipe` (whitelist + transform, `forbidNonWhitelisted`)
- `HttpExceptionFilter` (catch-all → standard error envelope)
- `ResponseInterceptor` (wraps every success response in the standard envelope)
- `JwtAuthGuard` (protects everything except `@Public()` routes)

## Database schema

| Table        | Columns                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| `hr_users`   | `id` (uuid, PK), `email` (unique), `password_hash`, `name`, `created_at`, `updated_at`     |
| `employees`  | `id`, `name`, `age`, `designation`, `hiring_date`, `date_of_birth`, `salary` (numeric 12,2), `photo_path` (nullable), `deleted_at` (soft delete), `created_at`, `updated_at` |
| `attendance` | `id`, `employee_id` (FK → `employees.id` ON DELETE CASCADE), `date`, `check_in_time`, `created_at`, `updated_at`, **UNIQUE `(employee_id, date)`** |

All schema changes are applied via **TypeORM migrations** (no `synchronize` in production).

## Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** ≥ 13 (uses the built-in `uuid-ossp` extension for default UUIDs)
- npm

## Getting started

```bash
# 1. Clone
git clone <your-repo-url> hr-management-api
cd hr-management-api

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
#   -> edit .env and set DB creds + a strong JWT_SECRET

# 4. Create the database (one-time)
createdb hr_management      # or: psql -c "CREATE DATABASE hr_management;"

# 5. Run migrations
npm run db:migrate:run

# 6. (optional) Seed sample data
npm run db:seed

# 7. Start the API
npm run start:dev
```

The server boots on `http://localhost:3000` and Swagger UI at `http://localhost:3000/api/docs`.

## Configuration

All runtime configuration is read from environment variables (see `.env.example`). Unknown
variables are ignored. Critical values (`DB_USERNAME`, `DB_NAME`, `JWT_SECRET`) are **required**
and validated at startup via Joi.

| Variable          | Description                                  | Default            |
| ----------------- | -------------------------------------------- | ------------------ |
| `NODE_ENV`        | `development` \| `production` \| `test`      | `development`      |
| `PORT`            | HTTP port                                    | `3000`             |
| `APP_URL`         | Public base URL (used to build photo URLs)   | `http://localhost:3000` |
| `DB_HOST`         | Postgres host                                | `localhost`        |
| `DB_PORT`         | Postgres port                                | `5432`             |
| `DB_USERNAME`     | Postgres user (**required**)                 | —                  |
| `DB_PASSWORD`     | Postgres password                            | `""`               |
| `DB_NAME`         | Postgres database (**required**)             | —                  |
| `DB_SCHEMA`       | Schema                                       | `public`           |
| `DB_SSL`          | Enable SSL (use `true` for managed Postgres) | `false`            |
| `DB_SYNC`         | TypeORM `synchronize` (**never** in prod)    | `false`            |
| `DB_POOL_MIN/MAX` | Connection pool sizing (min/max)             | `2` / `10`         |
| `JWT_SECRET`      | JWT signing secret (**required**, ≥16 chars) | —                  |
| `JWT_EXPIRES_IN`  | Token lifetime                               | `1d`               |
| `UPLOAD_DIR`      | Local upload directory                       | `./uploads`        |
| `UPLOAD_MAX_BYTES`| Max photo upload size                        | `5242880` (5 MB)   |

## Running the app

```bash
npm run start:dev      # watch mode (development)
npm run build          # compile to ./dist
npm run start:prod     # run compiled build (node dist/main)
```

## Database migrations

Migrations live in `src/migrations` and use a standalone `DataSource` (`src/data-source.ts`) so
the CLI shares the exact same env-driven options as the running app.

```bash
npm run db:migrate:run       # apply pending migrations
npm run db:migrate:revert    # roll back the last migration
```

To generate a new migration from entity changes (advanced):

```bash
npm_config_name=AddX npm run db:migrate:generate
```

## Seeding sample data

```bash
npm run db:seed
```

This is **idempotent** and creates:

- An admin HR user → **`admin@example.com`** / **`Admin@12345`**
- Three sample employees
- Attendance rows for the current month (a mix of on-time `09:20:00` and late `10:05:00`
  check-ins) so the `/reports` endpoint has data to aggregate.

## API documentation (Swagger)

Once running, open:

```
http://localhost:3000/api/docs
```

Click **Authorize** and paste your JWT (`Bearer <token>`) to exercise the protected endpoints.
`persistAuthorization` is enabled so the token is kept across page reloads.

## Endpoints

### Auth

| Method | Route          | Auth | Description                                  |
| ------ | -------------- | ---- | -------------------------------------------- |
| POST   | `/auth/login`  | ❌   | Validate email/password, return a JWT.       |

### Employees _(JWT required)_

| Method | Route            | Description                                                         |
| ------ | ---------------- | ------------------------------------------------------------------ |
| GET    | `/employees`     | Paginate (`page`, `limit`) + search by name (`search`, ILIKE). Excludes soft-deleted. |
| GET    | `/employees/:id` | Get one employee.                                                  |
| POST   | `/employees`     | `multipart/form-data` create with optional `photo` part.           |
| PUT    | `/employees/:id` | Update fields; include a `photo` part to replace the photo.        |
| DELETE | `/employees/:id` | Soft delete (sets `deleted_at`).                                   |

**Multipart field names** (camelCase): `name`, `age`, `designation`, `hiringDate`, `dateOfBirth`,
`salary`, and the binary part `photo`.

Example:

```bash
curl -X POST http://localhost:3000/employees \
  -H "Authorization: Bearer <JWT>" \
  -F "name=Dana White" \
  -F "age=29" \
  -F "designation=Data Analyst" \
  -F "hiringDate=2023-02-01" \
  -F "dateOfBirth=1996-09-09" \
  -F "salary=78000" \
  -F "photo=@/path/to/photo.jpg"
```

### Attendance _(JWT required)_

| Method | Route             | Description                                                                |
| ------ | ----------------- | ------------------------------------------------------------------------- |
| GET    | `/attendance`     | Filter by `employeeId`, `from`, `to` (YYYY-MM-DD), plus `page`/`limit`.   |
| GET    | `/attendance/:id` | Get one record.                                                           |
| POST   | `/attendance`     | **Upsert**: if `(employeeId, date)` exists, update `checkInTime`; else insert. |
| PUT    | `/attendance/:id` | Update a record.                                                          |
| DELETE | `/attendance/:id` | Hard delete a record.                                                     |

`checkInTime` accepts `HH:mm` or `HH:mm:ss` (normalized to `HH:mm:ss` on write).

### Reports _(JWT required)_

| Method | Route                  | Description                                                                  |
| ------ | ---------------------- | --------------------------------------------------------------------------- |
| GET    | `/reports/attendance`  | `month=YYYY-MM` (required), optional `employeeId`. Per employee: `daysPresent`, `timesLate` (check-in after `09:45:00`). |

## Response envelope

**Success** (`ResponseInterceptor`):

```json
{
  "success": true,
  "statusCode": 200,
  "timestamp": "2026-07-07T10:00:00.000Z",
  "data": { "..." }
}
```

**Error** (`HttpExceptionFilter`):

```json
{
  "success": false,
  "statusCode": 400,
  "timestamp": "2026-07-07T10:00:00.000Z",
  "path": "/employees",
  "error": {
    "code": "BAD_REQUEST",
    "message": "salary must be a number conforming to the specified constraints; ...",
    "fields": { "salary": "salary must be a number ..." }
  }
}
```

> In Swagger docs, each endpoint's `data` type is shown as the response `schema`; the surrounding
> `success`/`statusCode`/`timestamp` wrapper is added globally at runtime.

## Project structure

```
src/
├── main.ts                      # Bootstrap: pipes, static uploads, Swagger
├── app.module.ts                # Root module + global providers
├── data-source.ts               # Standalone DataSource for CLI (migrations)
├── common/
│   ├── config/                  # configuration() + Joi env schema
│   ├── decorators/              # @Public(), @CurrentUser()
│   ├── filters/                 # HttpExceptionFilter (global)
│   ├── guards/                  # JwtAuthGuard (global)
│   ├── interceptors/            # ResponseInterceptor (global)
│   ├── interfaces/              # ApiResponse, PaginatedResult, JwtPayload
│   ├── dto/                     # PaginationMetaDto
│   └── types/express.d.ts       # augments Express Request with `user`
├── database/
│   ├── database.module.ts       # TypeOrmModule.forRootAsync (env-driven)
│   ├── typeorm-options.ts       # shared options (app + CLI)
│   └── entities/                # hr-user / employee / attendance entities
├── auth/                        # controller, service, jwt strategy, dto
├── employees/                   # controller, service, dto (+ multer)
├── attendance/                  # controller, service, dto (upsert)
├── reports/                     # controller, service, dto
├── migrations/                  # TypeORM migration files
└── seeds/                       # run-seed.ts
```

Files are **kebab-case**, classes **PascalCase**.

## Scripts

| Script                  | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `npm run start:dev`     | Run in watch mode                        |
| `npm run build`         | Compile to `./dist`                      |
| `npm run start:prod`    | Run the compiled build (`node dist/main`)|
| `npm run lint`          | ESLint (with `--fix`)                    |
| `npm run format`        | Prettier write                           |
| `npm run db:migrate:run`| Apply migrations                         |
| `npm run db:migrate:revert` | Revert last migration                |
| `npm run db:seed`       | Seed sample data                         |

## Security notes

- **Always** set a strong `JWT_SECRET` in production (≥ 16 chars).
- Keep `DB_SYNC=false` in production — schema changes go through migrations only.
- Enable `DB_SSL=true` for managed/cloud Postgres.
- Uploaded photos are served at `/uploads/<filename>` (public, filename is a random UUID). For
  fully private media, serve behind a JWT-guarded controller instead.
- `bcryptjs` is used instead of native `bcrypt` to avoid native build tooling (node-gyp) on
  Windows; swap in `bcrypt` if you prefer native performance and have a build toolchain.

## Troubleshooting

- **`JWT_SECRET is not configured`** — set `JWT_SECRET` (≥ 16 chars) in `.env`.
- **Migrations not found by CLI** — run from the project root so `.env` and `src/` resolve.
- **`uuid-ossp` errors** — the initial migration runs `CREATE EXTENSION IF NOT EXISTS
  "uuid-ossp"`; the connecting role may need the extension pre-installed by a superuser on
  restricted managed Postgres.
- **Photos 404** — ensure `UPLOAD_DIR` resolves relative to the process working directory
  (default `./uploads`) and that the server has write access.
