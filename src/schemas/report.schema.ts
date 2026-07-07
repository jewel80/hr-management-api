import Joi from 'joi';

export interface ReportQuery {
  month: string;
  employee_id?: number;
}

export const reportQuerySchema = Joi.object<ReportQuery>({
  month: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .message('month must be in YYYY-MM format (e.g. 2025-08)')
    .required(),
  employee_id: Joi.number().integer().positive(),
});
