import { resolve } from 'node:path';
import { unlink } from 'node:fs/promises';
import { env } from '../config/env';
import { db } from '../db/knex';
import { notFound } from '../errors/AppError';
import type {
  CreateEmployeeBody,
  EmployeeQuery,
  UpdateEmployeeBody,
} from '../schemas/employee.schema';
import type { EmployeeResponse, EmployeeRow, Paginated } from '../types';

export class EmployeesService {
  async create(
    input: CreateEmployeeBody,
    photoPath: string | null,
  ): Promise<EmployeeResponse> {
    const created = await db<EmployeeRow>('employees')
      .insert({ ...input, photo_path: photoPath })
      .returning('*');
    return this.toResponse(created[0]);
  }

  async findMany(query: EmployeeQuery): Promise<Paginated<EmployeeResponse>> {
    const { page, limit, search } = query;
    const offset = (page - 1) * limit;

    const base = db<EmployeeRow>('employees').whereNull('deleted_at');
    if (search) {
      base.whereILike('name', `%${search}%`);
    }

    const [rows, countRow] = await Promise.all([
      base.clone().orderBy('created_at', 'desc').limit(limit).offset(offset),
      base.clone().count('* as count').first<{ count: string }>(),
    ]);

    const total = Number(countRow?.count ?? 0);
    return {
      items: rows.map((row) => this.toResponse(row)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 0 },
    };
  }

  async findOne(id: number): Promise<EmployeeResponse> {
    const row = await db<EmployeeRow>('employees')
      .where({ id })
      .whereNull('deleted_at')
      .first();
    if (!row) {
      throw notFound(`Employee with id ${id} was not found.`);
    }
    return this.toResponse(row);
  }

  async update(
    id: number,
    input: UpdateEmployeeBody,
    photoPath: string | null,
  ): Promise<EmployeeResponse> {
    const existing = await db<EmployeeRow>('employees')
      .where({ id })
      .whereNull('deleted_at')
      .first();
    if (!existing) {
      throw notFound(`Employee with id ${id} was not found.`);
    }

    if (photoPath !== null) {
      await this.removePhotoFile(existing.photo_path);
    }

    const patch: Record<string, unknown> = { ...input, updated_at: new Date() };
    if (photoPath !== null) {
      patch.photo_path = photoPath;
    }

    await db<EmployeeRow>('employees').where({ id }).update(patch);
    const updated = await db<EmployeeRow>('employees').where({ id }).first();
    return this.toResponse(updated as EmployeeRow);
  }

  /** Soft-deletes an employee (sets `deleted_at`). */
  async remove(id: number): Promise<void> {
    const existing = await db<EmployeeRow>('employees')
      .where({ id })
      .whereNull('deleted_at')
      .first();
    if (!existing) {
      throw notFound(`Employee with id ${id} was not found.`);
    }
    await db<EmployeeRow>('employees').where({ id }).update({ deleted_at: new Date() });
  }

  // ---- helpers ---------------------------------------------------------------

  private toResponse(row: EmployeeRow): EmployeeResponse {
    return {
      id: row.id,
      name: row.name,
      age: row.age,
      designation: row.designation,
      hiring_date: row.hiring_date,
      date_of_birth: row.date_of_birth,
      salary: row.salary,
      photo_path: row.photo_path,
      photo_url: row.photo_path ? `${env.appUrl}/uploads/${row.photo_path}` : null,
      created_at: row.created_at.toISOString(),
      updated_at: row.updated_at.toISOString(),
    };
  }

  private async removePhotoFile(photoPath: string | null): Promise<void> {
    if (!photoPath) {
      return;
    }
    try {
      await unlink(resolve(process.cwd(), env.uploadDir, photoPath));
    } catch {
      // Best-effort: missing file is not fatal.
    }
  }
}
