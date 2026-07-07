import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * A single day's check-in record for an employee. The pair
 * `(employee_id, date)` is enforced unique so attendance is at most one row per
 * employee per day. Maps to the `attendance` table.
 */
@Entity({ name: 'attendance' })
@Index('UQ_attendance_employee_date', ['employeeId', 'date'], { unique: true })
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'employee_id', type: 'uuid' })
  employeeId: string;

  @Column({ type: 'date' })
  date: string;

  /** Check-in time of day, formatted `HH:mm:ss`. */
  @Column({ name: 'check_in_time', type: 'time' })
  checkInTime: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
