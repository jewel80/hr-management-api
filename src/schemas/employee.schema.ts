import Joi from 'joi';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export interface CreateEmployeeBody {
  name: string;
  age: number;
  designation: string;
  hiring_date: string;
  date_of_birth: string;
  salary: number;
}

export type UpdateEmployeeBody = Partial<CreateEmployeeBody>;

export interface EmployeeQuery {
  page: number;
  limit: number;
  search?: string;
}

const employeeFields = {
  name: Joi.string().min(1).max(255),
  age: Joi.number().integer().min(18).max(120),
  designation: Joi.string().min(1).max(255),
  hiring_date: Joi.string()
    .pattern(DATE_PATTERN)
    .message('hiring_date must be YYYY-MM-DD'),
  date_of_birth: Joi.string()
    .pattern(DATE_PATTERN)
    .message('date_of_birth must be YYYY-MM-DD'),
  salary: Joi.number().min(0).precision(2),
};

export const createEmployeeSchema = Joi.object<CreateEmployeeBody>({
  name: employeeFields.name.required(),
  age: employeeFields.age.required(),
  designation: employeeFields.designation.required(),
  hiring_date: employeeFields.hiring_date.required(),
  date_of_birth: employeeFields.date_of_birth.required(),
  salary: employeeFields.salary.required(),
});

export const updateEmployeeSchema = Joi.object<UpdateEmployeeBody>({
  name: employeeFields.name,
  age: employeeFields.age,
  designation: employeeFields.designation,
  hiring_date: employeeFields.hiring_date,
  date_of_birth: employeeFields.date_of_birth,
  salary: employeeFields.salary,
  // At least one field must be supplied on update.
}).min(1);

export const queryEmployeeSchema = Joi.object<EmployeeQuery>({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  search: Joi.string().max(255).allow(''),
});
