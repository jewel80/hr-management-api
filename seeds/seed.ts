import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

/**
 * Idempotent seed (`npm run db:seed`). Clears then inserts an admin HR user,
 * three sample employees, and attendance rows for the current month (a mix of
 * on-time `09:20:00` and late `10:05:00` check-ins) so /reports has data.
 */

const pad = (n: number): string => n.toString().padStart(2, '0');
const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export async function seed(knex: Knex): Promise<void> {
  // Order matters: attendance -> employees -> hr_users (FKs).
  await knex('attendance').del();
  await knex('employees').del();
  await knex('hr_users').del();

  await knex('hr_users').insert({
    email: 'admin@example.com',
    password_hash: await bcrypt.hash('Admin@12345', 10),
    name: 'System Admin',
  });

  const employees = await knex('employees').insert(
    [
      {
        name: 'Alice Johnson',
        age: 30,
        designation: 'Software Engineer',
        hiring_date: '2021-03-01',
        date_of_birth: '1994-05-12',
        salary: 85000,
      },
      {
        name: 'Bob Smith',
        age: 41,
        designation: 'Product Manager',
        hiring_date: '2018-09-15',
        date_of_birth: '1983-01-22',
        salary: 110000,
      },
      {
        name: 'Carol Davis',
        age: 26,
        designation: 'UX Designer',
        hiring_date: '2022-06-20',
        date_of_birth: '1998-11-30',
        salary: 72000,
      },
    ],
    ['id'],
  );

  const now = new Date();
  const rows: Array<{ employee_id: number; date: string; check_in_time: string }> = [];

  for (const employee of employees) {
    let added = 0;
    const required = 6;
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);

    while (added < required && cursor.getMonth() === now.getMonth()) {
      const weekday = cursor.getDay();
      if (weekday !== 0 && weekday !== 6) {
        rows.push({
          employee_id: employee.id as number,
          date: toIsoDate(cursor),
          check_in_time: added % 2 === 0 ? '09:20:00' : '10:05:00',
        });
        added += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  await knex('attendance').insert(rows);
}
