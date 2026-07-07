import bcrypt from 'bcryptjs';
import dataSource from '../data-source';
import { Attendance } from '../database/entities/attendance.entity';
import { Employee } from '../database/entities/employee.entity';
import { HrUser } from '../database/entities/hr-user.entity';

/**
 * Standalone seed runner (`npm run db:seed`). Idempotent: it only inserts rows
 * that do not already exist. Seeds an admin HR user, a few sample employees,
 * and attendance rows for the current month (mixing on-time and late check-ins
 * so the /reports endpoint has data to aggregate).
 */

const ADMIN = {
  name: 'System Admin',
  email: 'admin@example.com',
  password: 'Admin@12345',
};

const SAMPLE_EMPLOYEES: Array<
  Pick<Employee, 'name' | 'age' | 'designation' | 'hiringDate' | 'dateOfBirth' | 'salary'>
> = [
  {
    name: 'Alice Johnson',
    age: 30,
    designation: 'Software Engineer',
    hiringDate: '2021-03-01',
    dateOfBirth: '1994-05-12',
    salary: 85000,
  },
  {
    name: 'Bob Smith',
    age: 41,
    designation: 'Product Manager',
    hiringDate: '2018-09-15',
    dateOfBirth: '1983-01-22',
    salary: 110000,
  },
  {
    name: 'Carol Davis',
    age: 26,
    designation: 'UX Designer',
    hiringDate: '2022-06-20',
    dateOfBirth: '1998-11-30',
    salary: 72000,
  },
];

const LATE_THRESHOLD = '09:45:00';

const pad = (n: number): string => n.toString().padStart(2, '0');

const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

async function seedAdmin(): Promise<void> {
  const repo = dataSource.getRepository(HrUser);
  const existing = await repo.findOneBy({ email: ADMIN.email });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`[seed] admin "${ADMIN.email}" already exists — skipping.`);
    return;
  }
  const passwordHash = await bcrypt.hash(ADMIN.password, 10);
  await repo.save(
    repo.create({
      name: ADMIN.name,
      email: ADMIN.email,
      passwordHash,
    }),
  );
  // eslint-disable-next-line no-console
  console.log(
    `[seed] created admin user (email=${ADMIN.email}, password=${ADMIN.password}).`,
  );
}

async function seedEmployeesAndAttendance(): Promise<void> {
  const employeeRepo = dataSource.getRepository(Employee);
  const attendanceRepo = dataSource.getRepository(Attendance);

  if ((await employeeRepo.count()) > 0) {
    // eslint-disable-next-line no-console
    console.log('[seed] employees already present — skipping employee/attendance seed.');
    return;
  }

  const employees = await employeeRepo.save(
    SAMPLE_EMPLOYEES.map((data) => employeeRepo.create(data)),
  );
  // eslint-disable-next-line no-console
  console.log(`[seed] created ${employees.length} sample employees.`);

  const now = new Date();
  const rows: Attendance[] = [];

  for (const [index, employee] of employees.entries()) {
    let added = 0;
    const required = 6;
    const cursor = new Date(now.getFullYear(), now.getMonth(), 1);

    while (added < required && cursor.getMonth() === now.getMonth()) {
      const weekday = cursor.getDay(); // 0 = Sunday, 6 = Saturday
      const isWeekday = weekday !== 0 && weekday !== 6;

      if (isWeekday) {
        const onTime = added % 2 === 0;
        rows.push(
          attendanceRepo.create({
            employeeId: employee.id,
            date: toIsoDate(cursor),
            checkInTime: onTime ? '09:20:00' : '10:05:00',
          }),
        );
        added += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    // eslint-disable-next-line no-console
    console.log(
      `[seed] seeded ${added} attendance rows for ${employee.name} (late after ${LATE_THRESHOLD}).`,
    );
    void index;
  }

  if (rows.length > 0) {
    await attendanceRepo.save(rows);
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();
  try {
    await seedAdmin();
    await seedEmployeesAndAttendance();
    // eslint-disable-next-line no-console
    console.log('[seed] done.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error('[seed] failed:', error);
  process.exitCode = 1;
});
