-- =============================================================================
-- HR Management API - Database Schema (PostgreSQL)
-- =============================================================================
-- This file is the plain-SQL equivalent of:
--   - migrations/20260101000000_init.ts   (table DDL, indexes, FK, unique keys)
--   - seeds/seed.ts                        (admin HR user + sample data)
--
-- Usage:
--   psql -U postgres -d hr_management -f schema.sql
--   (or)  createdb hr_management && psql -U postgres -d hr_management -f schema.sql
--
-- Default login created below:  admin@example.com  /  Admin@12345
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- hr_users : HR staff who authenticate against the API
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS hr_users
(
    id            SERIAL PRIMARY KEY,
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name          VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hr_users_email_unique ON hr_users (email);

-- ---------------------------------------------------------------------------
-- employees : staff managed by HR (soft-deletable via deleted_at)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees
(
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(255) NOT NULL,
    age           INTEGER      NOT NULL,
    designation   VARCHAR(255) NOT NULL,
    hiring_date   DATE         NOT NULL,
    date_of_birth DATE         NOT NULL,
    salary        NUMERIC(12, 2) NOT NULL,
    photo_path    VARCHAR(512),
    deleted_at    TIMESTAMP,
    created_at    TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employees_name_idx       ON employees (name);
CREATE INDEX IF NOT EXISTS employees_deleted_at_idx ON employees (deleted_at);

-- ---------------------------------------------------------------------------
-- attendance : one check-in per employee per day (unique employee_id + date)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance
(
    id            SERIAL PRIMARY KEY,
    employee_id   INTEGER NOT NULL
        REFERENCES employees (id) ON DELETE CASCADE,
    date          DATE    NOT NULL,
    check_in_time TIME    NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT now(),
    updated_at    TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT attendance_employee_date_unique UNIQUE (employee_id, date)
);
CREATE INDEX IF NOT EXISTS attendance_employee_date_unique_idx
    ON attendance (employee_id, date);

COMMIT;

-- =============================================================================
-- Seed data
-- =============================================================================

-- Reset (safe to re-run). Order respects foreign keys.
DELETE FROM attendance;
DELETE FROM employees;
DELETE FROM hr_users;

-- Reset SERIAL sequences so fresh inserts start at 1.
SELECT setval(pg_get_serial_sequence('hr_users', 'id'),   1, false);
SELECT setval(pg_get_serial_sequence('employees', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('attendance', 'id'),1, false);

-- Admin HR user. password_hash = bcrypt('Admin@12345', 10).
INSERT INTO hr_users (email, password_hash, name)
VALUES ('admin@example.com',
        '$2a$10$Ndw14NUpsg0zL9HuSQafu.Rz7GcuNwsJsL7vT13b1GfI6dvZKohMW',
        'System Admin');

-- Sample employees.
INSERT INTO employees (name, age, designation, hiring_date, date_of_birth, salary)
VALUES
    ('Alice Johnson', 30, 'Software Engineer', DATE '2021-03-01', DATE '1994-05-12', 85000.00),
    ('Bob Smith',     41, 'Product Manager',   DATE '2018-09-15', DATE '1983-01-22', 110000.00),
    ('Carol Davis',   26, 'UX Designer',       DATE '2022-06-20', DATE '1998-11-30', 72000.00);

-- Sample attendance for 2026-07 (mix of on-time 09:20 and late 10:05).
-- Late rule: check_in_time > 09:45:00.
INSERT INTO attendance (employee_id, date, check_in_time)
VALUES
    (1, DATE '2026-07-01', TIME '09:20:00'),
    (1, DATE '2026-07-02', TIME '10:05:00'),
    (1, DATE '2026-07-03', TIME '09:15:00'),
    (2, DATE '2026-07-01', TIME '10:05:00'),
    (2, DATE '2026-07-02', TIME '09:30:00'),
    (2, DATE '2026-07-03', TIME '10:10:00'),
    (3, DATE '2026-07-01', TIME '09:20:00'),
    (3, DATE '2026-07-02', TIME '09:05:00'),
    (3, DATE '2026-07-03', TIME '10:00:00');
