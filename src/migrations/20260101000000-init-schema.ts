import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Creates the initial schema: hr_users, employees (with soft-delete), and
 * attendance (with a unique (employee_id, date) constraint + FK).
 */
export class InitSchema20260101000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "hr_users" (
        "id"            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email"         varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "name"          varchar(255) NOT NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_hr_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "employees" (
        "id"            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name"          varchar(255) NOT NULL,
        "age"           integer NOT NULL,
        "designation"   varchar(255) NOT NULL,
        "hiring_date"   date NOT NULL,
        "date_of_birth" date NOT NULL,
        "salary"        numeric(12,2) NOT NULL,
        "photo_path"    varchar(512),
        "deleted_at"    timestamptz,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_employees_name" ON "employees" ("name")`);
    await queryRunner.query(
      `CREATE INDEX "IDX_employees_deleted_at" ON "employees" ("deleted_at")`,
    );

    await queryRunner.query(`
      CREATE TABLE "attendance" (
        "id"            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "employee_id"   uuid NOT NULL,
        "date"          date NOT NULL,
        "check_in_time" time NOT NULL,
        "created_at"    timestamptz NOT NULL DEFAULT now(),
        "updated_at"    timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "FK_attendance_employee"
          FOREIGN KEY ("employee_id") REFERENCES "employees" ("id")
          ON DELETE CASCADE,
        CONSTRAINT "UQ_attendance_employee_date" UNIQUE ("employee_id", "date")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_attendance_employee_date" ON "attendance" ("employee_id", "date")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_attendance_employee_date"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "attendance"`);

    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_deleted_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_employees_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "employees"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "hr_users"`);

    // Leave the uuid-ossp extension in place; other objects may depend on it.
  }
}
