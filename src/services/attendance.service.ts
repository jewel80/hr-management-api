import { db } from '../db/knex';
import { notFound } from '../errors/AppError';
import type {
  AttendanceQuery,
  CreateAttendanceBody,
  UpdateAttendanceBody,
} from '../schemas/attendance.schema';
import type { AttendanceResponse, AttendanceRow, Paginated } from '../types';
import { normalizeCheckInTime } from '../utils/time';

export class AttendanceService {
  /**
   * Upserts attendance for a given employee/date. If a row for
   * `(employee_id, date)` already exists, its `check_in_time` is updated;
   * otherwise a new row is inserted. Implemented with Postgres
   * `INSERT ... ON CONFLICT DO UPDATE` so concurrent requests are safe.
   */
  async create(input: CreateAttendanceBody): Promise<AttendanceResponse> {
    await this.assertEmployeeExists(input.employee_id);
    const checkInTime = normalizeCheckInTime(input.check_in_time);

    await db.raw(
      `INSERT INTO attendance (employee_id, date, check_in_time)
       VALUES (?, ?, ?)
       ON CONFLICT (employee_id, date)
       DO UPDATE SET check_in_time = EXCLUDED.check_in_time, updated_at = now()`,
      [input.employee_id, input.date, checkInTime],
    );

    const row = await db<AttendanceRow>('attendance')
      .where({ employee_id: input.employee_id, date: input.date })
      .first();
    if (!row) {
      throw new Error('Upsert did not produce an attendance row.');
    }
    return this.toResponse(row);
  }

  async findMany(query: AttendanceQuery): Promise<Paginated<AttendanceResponse>> {
    const { page, limit, employee_id, from, to } = query;
    const offset = (page - 1) * limit;

    const base = db<AttendanceRow>('attendance');
    if (employee_id) {
      base.where({ employee_id });
    }
    if (from) {
      base.where('date', '>=', from);
    }
    if (to) {
      base.where('date', '<=', to);
    }

    const [rows, countRow] = await Promise.all([
      base
        .clone()
        .orderBy('date', 'desc')
        .orderBy('check_in_time', 'desc')
        .limit(limit)
        .offset(offset),
      base.clone().count('* as count').first<{ count: string }>(),
    ]);

    const total = Number(countRow?.count ?? 0);
    return {
      items: rows.map((row) => this.toResponse(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  async findOne(id: number): Promise<AttendanceResponse> {
    const row = await db<AttendanceRow>('attendance').where({ id }).first();
    if (!row) {
      throw notFound(`Attendance record ${id} was not found.`);
    }
    return this.toResponse(row);
  }

  async update(id: number, input: UpdateAttendanceBody): Promise<AttendanceResponse> {
    const existing = await db<AttendanceRow>('attendance').where({ id }).first();
    if (!existing) {
      throw notFound(`Attendance record ${id} was not found.`);
    }

    const patch: Record<string, unknown> = { updated_at: new Date() };
    if (input.employee_id !== undefined && input.employee_id !== existing.employee_id) {
      await this.assertEmployeeExists(input.employee_id);
      patch.employee_id = input.employee_id;
    }
    if (input.date !== undefined) {
      patch.date = input.date;
    }
    if (input.check_in_time !== undefined) {
      patch.check_in_time = normalizeCheckInTime(input.check_in_time);
    }

    await db<AttendanceRow>('attendance').where({ id }).update(patch);
    const updated = await db<AttendanceRow>('attendance').where({ id }).first();
    return this.toResponse(updated as AttendanceRow);
  }

  async remove(id: number): Promise<void> {
    const existing = await db<AttendanceRow>('attendance').where({ id }).first();
    if (!existing) {
      throw notFound(`Attendance record ${id} was not found.`);
    }
    await db<AttendanceRow>('attendance').where({ id }).del();
  }

  // ---- helpers ---------------------------------------------------------------

  private async assertEmployeeExists(employeeId: number): Promise<void> {
    const exists = await db('employees')
      .where({ id: employeeId })
      .whereNull('deleted_at')
      .first();
    if (!exists) {
      throw notFound(`Employee with id ${employeeId} was not found.`);
    }
  }

  private toResponse(row: AttendanceRow): AttendanceResponse {
    return {
      id: row.id,
      employee_id: row.employee_id,
      date: row.date,
      check_in_time: row.check_in_time,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }
}
