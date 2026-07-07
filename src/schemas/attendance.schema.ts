import Joi from 'joi';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}(:\d{2})?$/;

export interface CreateAttendanceBody {
  employee_id: number;
  date: string;
  check_in_time: string;
}

export type UpdateAttendanceBody = Partial<CreateAttendanceBody>;

export interface AttendanceQuery {
  page: number;
  limit: number;
  employee_id?: number;
  from?: string;
  to?: string;
}

export const createAttendanceSchema = Joi.object<CreateAttendanceBody>({
  employee_id: Joi.number().integer().positive().required(),
  date: Joi.string().pattern(DATE_PATTERN).message('date must be YYYY-MM-DD').required(),
  check_in_time: Joi.string()
    .pattern(TIME_PATTERN)
    .message('check_in_time must be HH:mm or HH:mm:ss')
    .required(),
});

export const updateAttendanceSchema = Joi.object<UpdateAttendanceBody>({
  employee_id: Joi.number().integer().positive(),
  date: Joi.string().pattern(DATE_PATTERN).message('date must be YYYY-MM-DD'),
  check_in_time: Joi.string()
    .pattern(TIME_PATTERN)
    .message('check_in_time must be HH:mm or HH:mm:ss'),
}).min(1);

export const queryAttendanceSchema = Joi.object<AttendanceQuery>({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(500).default(50),
  employee_id: Joi.number().integer().positive(),
  from: Joi.string().pattern(DATE_PATTERN).message('from must be YYYY-MM-DD'),
  to: Joi.string().pattern(DATE_PATTERN).message('to must be YYYY-MM-DD'),
});
