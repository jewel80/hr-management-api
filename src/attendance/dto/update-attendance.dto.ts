import { PartialType } from '@nestjs/swagger';
import { CreateAttendanceDto } from './create-attendance.dto';

/** Body for `PUT /attendance/:id`. All fields optional. */
export class UpdateAttendanceDto extends PartialType(CreateAttendanceDto) {}
