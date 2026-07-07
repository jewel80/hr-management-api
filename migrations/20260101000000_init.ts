import type { Knex } from 'knex';

/**
 * Creates the initial schema: hr_users, employees (with soft-delete), and
 * attendance (with a unique (employee_id, date) constraint + FK).
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('hr_users', (table) => {
    table.increments('id').primary();
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('name', 255).notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['email'], { indexName: 'hr_users_email_unique' });
  });

  await knex.schema.createTable('employees', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.integer('age').notNullable();
    table.string('designation', 255).notNullable();
    table.date('hiring_date').notNullable();
    table.date('date_of_birth').notNullable();
    table.decimal('salary', 12, 2).notNullable();
    table.string('photo_path', 512).nullable();
    table.timestamp('deleted_at').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.index(['name'], 'employees_name_idx');
    table.index(['deleted_at'], 'employees_deleted_at_idx');
  });

  await knex.schema.createTable('attendance', (table) => {
    table.increments('id').primary();
    table
      .integer('employee_id')
      .unsigned()
      .notNullable()
      .references('id')
      .inTable('employees')
      .onDelete('CASCADE');
    table.date('date').notNullable();
    table.time('check_in_time').notNullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['employee_id', 'date'], {
      indexName: 'attendance_employee_date_unique',
    });
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('attendance');
  await knex.schema.dropTableIfExists('employees');
  await knex.schema.dropTableIfExists('hr_users');
}
