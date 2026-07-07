/**
 * Decoded JWT payload attached to the Express `Request` after authentication.
 */
export interface JwtPayload {
  /** id of the authenticated hr_users row ("sub" claim) */
  sub: number;
  email: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Database row types (snake_case, as stored)
// ---------------------------------------------------------------------------

export interface HrUserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: Date;
  updated_at: Date;
}

export interface EmployeeRow {
  id: number;
  name: string;
  age: number;
  designation: string;
  hiring_date: string;
  date_of_birth: string;
  salary: number; // numeric parsed to number via a pg type parser
  photo_path: string | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface AttendanceRow {
  id: number;
  employee_id: number;
  date: string;
  check_in_time: string;
  created_at: Date;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// API response types (snake_case contract)
// ---------------------------------------------------------------------------

export interface EmployeeResponse {
  id: number;
  name: string;
  age: number;
  designation: string;
  hiring_date: string;
  date_of_birth: string;
  salary: number;
  photo_path: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceResponse {
  id: number;
  employee_id: number;
  date: string;
  check_in_time: string;
  created_at: string;
  updated_at: string;
}

export interface ReportItem {
  employee_id: number;
  name: string;
  days_present: number;
  times_late: number;
}

export interface AttendanceReport {
  month: string;
  employee_id: number | null;
  items: ReportItem[];
}

export interface LoginResult {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  user: { id: number; email: string; name: string };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}
