import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { monthBounds } from '../common/utils/date';
import { Attendance } from '../database/entities/attendance.entity';
import { Employee } from '../database/entities/employee.entity';
import { AttendanceReportDto } from './dto/attendance-report.dto';
import { AttendanceReportItemDto } from './dto/attendance-report-item.dto';
import { QueryReportDto } from './dto/query-report.dto';

/** A check-in strictly after this time-of-day is counted as late. */
export const LATE_THRESHOLD = '09:45:00';

interface RawReportRow {
  employee_id: string;
  employee_name: string;
  days_present: string | number;
  times_late: string | number;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendance: Repository<Attendance>,
  ) {}

  /**
   * Builds a monthly attendance report grouped per (non-deleted) employee:
   * `days_present` (any check-in that month) and `times_late`
   * (check_in_time > 09:45:00).
   */
  async attendanceReport(query: QueryReportDto): Promise<AttendanceReportDto> {
    const { start, end } = monthBounds(query.month);

    const builder = this.attendance
      .createQueryBuilder('a')
      .innerJoin(Employee, 'e', 'e.id = a.employee_id')
      .where('e.deleted_at IS NULL')
      .andWhere('a.date BETWEEN :start AND :end', { start, end })
      .select('e.id', 'employee_id')
      .addSelect('e.name', 'employee_name')
      .addSelect('COUNT(a.id)::int', 'days_present')
      .addSelect(
        `COUNT(a.id) FILTER (WHERE a.check_in_time > '${LATE_THRESHOLD}')::int`,
        'times_late',
      )
      .groupBy('e.id')
      .addGroupBy('e.name')
      .orderBy('employee_name', 'ASC');

    if (query.employeeId) {
      builder.andWhere('e.id = :employeeId', {
        employeeId: query.employeeId,
      });
    }

    const rows = await builder.getRawMany<RawReportRow>();

    const items: AttendanceReportItemDto[] = rows.map(
      (row: RawReportRow): AttendanceReportItemDto => ({
        employeeId: row.employee_id,
        name: row.employee_name,
        daysPresent: Number(row.days_present),
        timesLate: Number(row.times_late),
      }),
    );

    return {
      month: query.month,
      employeeId: query.employeeId ?? null,
      items,
    };
  }
}
