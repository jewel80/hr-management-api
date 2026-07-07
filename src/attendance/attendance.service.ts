import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';
import { normalizeCheckInTime } from '../common/utils/time';
import { Attendance } from '../database/entities/attendance.entity';
import { Employee } from '../database/entities/employee.entity';
import { AttendanceResponseDto } from './dto/attendance-response.dto';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { PaginatedAttendanceDto } from './dto/paginated-attendance.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';

/** Postgres unique-violation error code. */
const PG_UNIQUE_VIOLATION = '23505';

/** True when the given error is a Postgres unique-violation. */
const isUniqueViolation = (error: unknown): boolean => {
  if (!(error instanceof QueryFailedError)) {
    return false;
  }
  const driverError = (error as { driverError?: { code?: string } }).driverError;
  return driverError?.code === PG_UNIQUE_VIOLATION;
};

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendance: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
  ) {}

  /**
   * Upserts attendance for a given employee/date. If a row for
   * `(employeeId, date)` already exists, its `check_in_time` is updated;
   * otherwise a new row is inserted. Race conditions between concurrent
   * requests are resolved by catching the unique-constraint violation and
   * falling back to an update.
   */
  async create(dto: CreateAttendanceDto): Promise<AttendanceResponseDto> {
    await this.assertEmployeeExists(dto.employeeId);
    const checkInTime = normalizeCheckInTime(dto.checkInTime);

    try {
      const created = this.attendance.create({
        employeeId: dto.employeeId,
        date: dto.date,
        checkInTime,
      });
      const saved = await this.attendance.save(created);
      return this.toResponse(saved);
    } catch (error) {
      if (isUniqueViolation(error)) {
        const existing = await this.attendance.findOne({
          where: { employeeId: dto.employeeId, date: dto.date },
        });
        if (!existing) {
          throw error;
        }
        existing.checkInTime = checkInTime;
        const updated = await this.attendance.save(existing);
        return this.toResponse(updated);
      }
      throw error;
    }
  }

  /** Paginated, filterable list of attendance records. */
  async findMany(query: QueryAttendanceDto): Promise<PaginatedAttendanceDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 50;

    const builder = this.attendance
      .createQueryBuilder('a')
      .orderBy('a.date', 'DESC')
      .addOrderBy('a.check_in_time', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.employeeId) {
      builder.andWhere('a.employee_id = :employeeId', {
        employeeId: query.employeeId,
      });
    }
    if (query.from) {
      builder.andWhere('a.date >= :from', { from: query.from });
    }
    if (query.to) {
      builder.andWhere('a.date <= :to', { to: query.to });
    }

    const [items, total] = await builder.getManyAndCount();

    return {
      items: items.map((row) => this.toResponse(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<AttendanceResponseDto> {
    const row = await this.attendance.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Attendance record "${id}" was not found.`);
    }
    return this.toResponse(row);
  }

  async update(id: string, dto: UpdateAttendanceDto): Promise<AttendanceResponseDto> {
    const row = await this.attendance.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Attendance record "${id}" was not found.`);
    }

    if (dto.employeeId !== undefined && dto.employeeId !== row.employeeId) {
      await this.assertEmployeeExists(dto.employeeId);
      row.employeeId = dto.employeeId;
    }
    if (dto.date !== undefined) {
      row.date = dto.date;
    }
    if (dto.checkInTime !== undefined) {
      row.checkInTime = normalizeCheckInTime(dto.checkInTime);
    }

    const saved = await this.attendance.save(row);
    return this.toResponse(saved);
  }

  /** Hard-deletes an attendance record. */
  async remove(id: string): Promise<void> {
    const row = await this.attendance.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException(`Attendance record "${id}" was not found.`);
    }
    await this.attendance.remove(row);
  }

  // ---- helpers ---------------------------------------------------------------

  private async assertEmployeeExists(employeeId: string): Promise<void> {
    const found = await this.employees.existsBy({ id: employeeId });
    if (!found) {
      throw new NotFoundException(`Employee with id "${employeeId}" was not found.`);
    }
  }

  private toResponse(row: Attendance): AttendanceResponseDto {
    return {
      id: row.id,
      employeeId: row.employeeId,
      date: row.date,
      checkInTime: row.checkInTime,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
