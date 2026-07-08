import { db } from '../db/knex';
import type { AttendanceReport, ReportItem } from '../types';
import { monthBounds } from '../utils/date';

/** A check-in strictly after this time-of-day is counted as late. */
export const LATE_THRESHOLD = '09:45:00';

interface RawReportRow {
  employee_id: number;
  name: string;
  days_present: string | number;
  times_late: string | number;
}

export class ReportsService {
  /**
   * Builds a monthly attendance report grouped per (non-deleted) employee:
   * `days_present` (any check-in that month) and `times_late`
   * (check_in_time > 09:45:00).
   */
  async attendanceReport(month: string, employeeId?: number): Promise<AttendanceReport> {
    const { start, end } = monthBounds(month);

    const query = db('attendance as a')
      .join('employees as e', 'e.id', 'a.employee_id')
      .whereNull('e.deleted_at')
      .whereBetween('a.date', [start, end]);

    if (employeeId) {
      query.where('e.id', employeeId);
    }

    const rows = await query
      .select(
        'e.id as employee_id',
        'e.name as name',
        db.raw('COUNT(a.id)::int as days_present'),
        db.raw('COUNT(a.id) FILTER (WHERE a.check_in_time > ?)::int as times_late', [
          LATE_THRESHOLD,
        ]),
      )
      .groupBy('e.id', 'e.name')
      .orderBy('name', 'asc');

    const items: ReportItem[] = (rows as unknown as RawReportRow[]).map((row) => ({
      employee_id: Number(row.employee_id),
      name: row.name,
      days_present: Number(row.days_present),
      times_late: Number(row.times_late),
    }));

    return {
      month,
      employee_id: employeeId ?? null,
      items,
    };
  }
}
