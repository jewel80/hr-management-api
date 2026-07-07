import { PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto';

/**
 * Body for `PUT /employees/:id` (multipart/form-data). Every field is optional;
 * only provided fields are applied. A `photo` part, if present, replaces the
 * existing photo.
 */
export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {}
