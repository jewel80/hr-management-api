# HR Management API

A production-grade **HR Management REST API** built with **Express + TypeScript (strict, OOP)**,
**Knex** (query builder), and **PostgreSQL**. It provides JWT authentication, employee CRUD with
photo uploads, attendance tracking with upsert semantics, and a monthly attendance report.

---

## Features

- 🔐 **JWT authentication** — `POST /auth/login` issues a Bearer token; all `/employees`,
  `/attendance`, `/reports` routes are protected by JWT middleware.
- 👤 **Employees** CRUD with pagination, case-insensitive name search (ILIKE), **soft delete**
  (`deleted_at`, excluded from lists), and **multipart photo upload** (local disk storage).
- 🕒 **Attendance** CRUD with **upsert** on `(employee_id, date)` — inserts or updates the
  `check_in_time` without duplicating rows (Postgres `ON CONFLICT`).
- 📊 **Reports**: monthly per-employee summary — `days_present` and `times_late`
  (`check_in_time > 09:45:00`).
- ✅ **Strict TypeScript** end to end, **Joi** validation, **no `any`** (enforced by ESLint).
- 🧱 Consistent JSON envelope (`sendSuccess`) + centralized Express error handler.
- 🗄️ **Knex** migrations + seeds; connection pool sized from env.

## Tech stack

| Concern          | Choice                                  |
| ---------------- | --------------------------------------- |
| Runtime          | Node.js ≥ 20, TypeScript 5 (strict, OOP)|
| Web framework    | Express 4                               |
| Query builder    | Knex 3                                  |
| Database         | PostgreSQL (via `pg`)                   |
| Validation       | Joi                                     |
| Auth             | `jsonwebtoken` + `bcryptjs`            |
| Uploads          | Multer (local disk storage)             |
| Config           | `.env` (`dotenv`) + Joi validation      |
| Lint / Format    | ESLint + Prettier                       |
| Tests            | Jest + ts-jest (unit), Node smoke test  |

## Architecture

Plain Express, organised by responsibility with manual OOP dependency wiring in `src/app.ts`
(services → controllers → routes):

```
src/
├── server.ts              # bootstrap + graceful shutdown
├── app.ts                 # Express app + middleware + DI wiring
├── config/
│   ├── env.ts             # dotenv + Joi env validation -> typed `env`
│   └── knex-config.ts     # shared Knex config (app + CLI)
├── db/knex.ts             # Knex instance + pg type parsers (dates as strings)
├── types/                 # row + response interfaces, Express Request.user augmentation
├── errors/AppError.ts     # typed app errors + helpers (badRequest/notFound/unauthorized)
├── utils/                 # logger, response envelope, asyncHandler, time/date helpers
├── schemas/               # Joi schemas (auth, employee, attendance, report, common)
├── middlewares/           # authenticate, validate, errorHandler, notFound
├── upload/multer.ts       # configured Multer instance
├── services/              # auth, employees, attendance, reports (business logic + Knex)
├── controllers/           # request handlers (typed)
└── routes/                # per-resource routers + index
```

Cross-cutting behaviour:

- Global `errorHandler` renders every error into the standard envelope and never leaks internal
  details for unexpected errors.
- `sendSuccess` wraps every success response.
- pg type parsers keep `date`/`time`/`timestamp` columns as strings (no JS-Date timezone surprises).

## Database schema

| Table        | Columns                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------- |
| `hr_users`   | `id` (serial PK), `email` (unique), `password_hash`, `name`, `created_at`, `updated_at`          |
| `employees`  | `id`, `name`, `age`, `designation`, `hiring_date`, `date_of_birth`, `salary` (numeric 12,2), `photo_path` (nullable), `deleted_at` (soft delete), `created_at`, `updated_at` |
| `attendance` | `id`, `employee_id` (FK → `employees.id` ON DELETE CASCADE), `date`, `check_in_time`, `created_at`, `updated_at`, **UNIQUE `(employee_id, date)`** |

All schema changes go through **Knex migrations** (`migrations/`).

## Prerequisites

- Node.js ≥ 20
- PostgreSQL ≥ 12
- npm

## Getting started

```bash
git clone <your-repo-url> hr-management-api
cd hr-management-api

npm install
cp .env.example .env          # edit .env: set DB creds + a strong JWT_SECRET

# create the database (one-time)
psql -U postgres -c "CREATE DATABASE hr_management;"

npm run db:migrate:latest     # apply Knex migrations
npm run db:seed               # seed admin user + sample data
npm run start:dev             # http://localhost:3000
```

**Seed credentials:** `admin@example.com` / `Admin@12345`.

## Configuration

Read from `.env` (see `.env.example`). Unknown vars are ignored; critical ones
(`DB_USERNAME`, `DB_NAME`, `JWT_SECRET`) are required and Joi-validated at boot.

| Variable          | Description                          | Default            |
| ----------------- | ------------------------------------ | ------------------ |
| `NODE_ENV`        | `development` \| `production` \| `test` | `development`   |
| `PORT`            | HTTP port                            | `3000`             |
| `APP_URL`         | Public base URL (photo URLs)         | `http://localhost:3000` |
| `LOG_LEVEL`       | `error` \| `warn` \| `info` \| `debug` | `info`           |
| `DB_HOST`/`DB_PORT` | Postgres host/port                 | `localhost` / `5432` |
| `DB_USERNAME`     | Postgres user (**required**)         | —                  |
| `DB_PASSWORD`     | Postgres password                    | `""`               |
| `DB_NAME`         | Postgres database (**required**)     | —                  |
| `DB_POOL_MIN/MAX` | Knex pool sizing                     | `2` / `10`         |
| `JWT_SECRET`      | JWT signing secret (**required**, ≥16) | —                |
| `JWT_EXPIRES_IN`  | Token lifetime                       | `1d`               |
| `UPLOAD_DIR`      | Local upload directory               | `./uploads`        |
| `UPLOAD_MAX_BYTES`| Max photo upload size                | `5242880` (5 MB)   |

## Running

```bash
npm run start:dev      # tsx watch (development)
npm run build          # tsc -> ./dist
npm run start          # node dist/server.js (production)
```

## Database migrations & seeds (Knex)

```bash
npm run db:migrate:latest     # apply pending migrations
npm run db:migrate:rollback   # roll back the last batch
npm run db:seed               # seed sample data (idempotent)
npm run db:migrate:make -- <name>   # create a new empty migration
```

## Endpoints

### Auth
| Method | Route          | Auth | Description                       |
| ------ | -------------- | ---- | --------------------------------- |
| POST   | `/auth/login`  | ❌   | Validate email/password → JWT.    |

### Employees _(JWT required)_
| Method | Route            | Description                                                          |
| ------ | ---------------- | ------------------------------------------------------------------- |
| GET    | `/employees`     | `page`, `limit`, `search` (ILIKE on name). Excludes soft-deleted.   |
| GET    | `/employees/:id` | Get one employee.                                                   |
| POST   | `/employees`     | `multipart/form-data` create (optional `photo` part).              |
| PUT    | `/employees/:id` | Update fields; include `photo` to replace it.                       |
| DELETE | `/employees/:id` | Soft delete (sets `deleted_at`).                                    |

### Attendance _(JWT required)_
| Method | Route             | Description                                                                |
| ------ | ----------------- | ------------------------------------------------------------------------- |
| GET    | `/attendance`     | `employee_id`, `from`, `to` (YYYY-MM-DD) + `page`/`limit`.                |
| GET    | `/attendance/:id` | Get one record.                                                           |
| POST   | `/attendance`     | **Upsert**: if `(employee_id, date)` exists, update `check_in_time`.      |
| PUT    | `/attendance/:id` | Update a record.                                                          |
| DELETE | `/attendance/:id` | Delete a record.                                                          |

### Reports _(JWT required)_
| Method | Route                 | Description                                                        |
| ------ | --------------------- | ----------------------------------------------------------------- |
| GET    | `/reports/attendance` | `month=YYYY-MM` (required), optional `employee_id`. Per employee: `days_present`, `times_late` (> `09:45:00`). |

### Field names

The API contract is **snake_case** (matches the DB columns): `employee_id`, `check_in_time`,
`hiring_date`, `date_of_birth`, `days_present`, `times_late`, `photo_path`/`photo_url`. The login
response uses `accessToken`/`tokenType`/`expiresIn` (JWT convention).

`check_in_time` accepts `HH:mm` or `HH:mm:ss` (normalised to `HH:mm:ss` on write).

### Examples

```bash
# login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin@12345"}'

# search employees
curl http://localhost:3000/employees?search=alice -H "Authorization: Bearer <JWT>"

# create employee with photo
curl -X POST http://localhost:3000/employees \
  -H "Authorization: Bearer <JWT>" \
  -F "name=Dana White" -F "age=29" -F "designation=Data Analyst" \
  -F "hiring_date=2023-02-01" -F "date_of_birth=1996-09-09" -F "salary=78000" \
  -F "photo=@/path/to/photo.jpg"

# upsert attendance
curl -X POST http://localhost:3000/attendance \
  -H "Authorization: Bearer <JWT>" -H "Content-Type: application/json" \
  -d '{"employee_id":1,"date":"2025-08-01","check_in_time":"09:20:00"}'

# monthly report
curl "http://localhost:3000/reports/attendance?month=2025-08" -H "Authorization: Bearer <JWT>"
```

## Response envelope

**Success**:
```json
{ "success": true, "statusCode": 200, "timestamp": "...", "data": { "..." } }
```
**Error**:
```json
{ "success": false, "statusCode": 400, "timestamp": "...", "path": "/employees",
  "error": { "code": "BAD_REQUEST", "message": "Validation failed.",
             "fields": { "name": "\"name\" is required" } } }
```

## Scripts

| Script                  | Purpose                                  |
| ----------------------- | ---------------------------------------- |
| `npm run start:dev`     | Run in watch mode (tsx)                  |
| `npm run build` / `start` | Compile to `dist` / run compiled build |
| `npm run lint`          | ESLint (`--fix`)                         |
| `npm test`              | Jest unit tests                          |
| `npm run test:smoke`    | Integration smoke test (needs running server + seeded DB) |
| `npm run db:migrate:latest` | Apply Knex migrations                |
| `npm run db:migrate:rollback` | Roll back last migration batch      |
| `npm run db:seed`       | Seed sample data                         |

> The smoke test (`npm run test:smoke`) requires a running server and seeded DB:
> `npm run db:migrate:latest && npm run db:seed && npm run start:dev`, then `npm run test:smoke`.

## Project layout & conventions

- **kebab-case** files, **PascalCase** classes.
- Services and controllers are classes (OOP); routes are functions receiving controller instances.
- Business logic lives in services; controllers only parse the request and send responses.

## Security notes

- Set a strong `JWT_SECRET` (≥ 16 chars) in production.
- Uploaded photos are served at `/uploads/<filename>` (public; filename is a random UUID). For
  fully private media, serve behind an authenticated controller.
- `bcryptjs` is used instead of native `bcrypt` to avoid native build tooling (node-gyp) on Windows.
- Errors are logged server-side; unexpected errors return a generic 500 to clients (no internals).
