import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { join } from 'node:path';
import { unlink } from 'node:fs/promises';
import { Employee } from '../database/entities/employee.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { PaginatedEmployeesDto } from './dto/paginated-employees.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    @InjectRepository(Employee)
    private readonly employees: Repository<Employee>,
    private readonly config: ConfigService,
  ) {}

  /** Creates a new employee, optionally attaching an uploaded photo filename. */
  async create(
    dto: CreateEmployeeDto,
    photoPath: string | null,
  ): Promise<EmployeeResponseDto> {
    const employee = this.employees.create({ ...dto, photoPath });
    const saved = await this.employees.save(employee);
    return this.toResponse(saved);
  }

  /** Returns a paginated, searchable list of non-deleted employees. */
  async findMany(query: QueryEmployeeDto): Promise<PaginatedEmployeesDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const builder = this.employees
      .createQueryBuilder('e')
      .where('e.deleted_at IS NULL')
      .orderBy('e.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.search) {
      builder.andWhere('e.name ILIKE :search', {
        search: `%${query.search}%`,
      });
    }

    const [items, total] = await builder.getManyAndCount();

    return {
      items: items.map((employee) => this.toResponse(employee)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Returns a single non-deleted employee or throws 404. */
  async findOne(id: string): Promise<EmployeeResponseDto> {
    const employee = await this.employees.findOne({ where: { id } });
    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee with id "${id}" was not found.`);
    }
    return this.toResponse(employee);
  }

  /** Updates an employee; a new photo replaces the previous one on disk. */
  async update(
    id: string,
    dto: UpdateEmployeeDto,
    photoPath: string | null,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employees.findOne({ where: { id } });
    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee with id "${id}" was not found.`);
    }

    if (photoPath !== null) {
      await this.removePhotoFile(employee.photoPath);
      employee.photoPath = photoPath;
    }

    Object.assign(employee, dto);
    const saved = await this.employees.save(employee);
    return this.toResponse(saved);
  }

  /** Soft-deletes an employee (sets `deleted_at`). */
  async remove(id: string): Promise<void> {
    const employee = await this.employees.findOne({ where: { id } });
    if (!employee || employee.deletedAt) {
      throw new NotFoundException(`Employee with id "${id}" was not found.`);
    }
    await this.employees.softDelete(id);
  }

  // ---- helpers ---------------------------------------------------------------

  private toResponse(employee: Employee): EmployeeResponseDto {
    const baseUrl = this.config.get<string>('app.url') ?? '';
    const photoUrl = employee.photoPath
      ? `${baseUrl}/uploads/${employee.photoPath}`
      : null;

    return {
      id: employee.id,
      name: employee.name,
      age: employee.age,
      designation: employee.designation,
      hiringDate: employee.hiringDate,
      dateOfBirth: employee.dateOfBirth,
      salary: employee.salary,
      photoPath: employee.photoPath,
      photoUrl,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
    };
  }

  /** Best-effort deletion of a stored photo file; never throws. */
  private async removePhotoFile(photoPath: string | null): Promise<void> {
    if (!photoPath) {
      return;
    }
    const uploadDir = this.config.get<string>('app.uploadDir') ?? './uploads';
    const fullPath = join(process.cwd(), uploadDir, photoPath);

    try {
      await unlink(fullPath);
    } catch (error: unknown) {
      this.logger.warn(
        `Could not delete photo file "${fullPath}": ${(error as Error).message}`,
      );
    }
  }
}
