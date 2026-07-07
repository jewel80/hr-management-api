import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ValueTransformer,
} from 'typeorm';

/**
 * TypeORM returns Postgres `numeric`/`decimal` columns as strings to avoid
 * precision loss. This transformer keeps the entity typed as `number` while
 * round-tripping the value safely.
 */
const decimalToNumber: ValueTransformer = {
  to: (value: number | null): string | null => (value === null ? null : String(value)),
  from: (value: string | null): number | null => (value === null ? null : Number(value)),
};

/**
 * An employee record. Supports soft deletion via the `deleted_at` column.
 * Maps to the `employees` table.
 */
@Entity({ name: 'employees' })
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'integer' })
  age: number;

  @Column({ type: 'varchar', length: 255 })
  designation: string;

  @Column({ name: 'hiring_date', type: 'date' })
  hiringDate: string;

  @Column({ name: 'date_of_birth', type: 'date' })
  dateOfBirth: string;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: decimalToNumber,
  })
  salary: number;

  @Column({ name: 'photo_path', type: 'varchar', length: 512, nullable: true })
  photoPath: string | null;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz' })
  deletedAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
