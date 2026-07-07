import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { EmployeeResponseDto } from './dto/employee-response.dto';
import { PaginatedEmployeesDto } from './dto/paginated-employees.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { QueryEmployeeDto } from './dto/query-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

/**
 * OpenAPI schema for the multipart employee body. `photo` is the binary part;
 * the rest mirror {@link CreateEmployeeDto} but as form fields.
 */
const multipartEmployeeSchema = (requiredFields: string[]) => ({
  type: 'object' as const,
  required: requiredFields,
  properties: {
    name: { type: 'string', example: 'Alice Johnson' },
    age: { type: 'integer', example: 30 },
    designation: { type: 'string', example: 'Software Engineer' },
    hiringDate: { type: 'string', format: 'date', example: '2021-03-01' },
    dateOfBirth: { type: 'string', format: 'date', example: '1994-05-12' },
    salary: { type: 'number', example: 85000 },
    photo: { type: 'string', format: 'binary' },
  },
});

@ApiTags('Employees')
@ApiBearerAuth()
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @ApiOperation({ summary: 'List employees (paginated, searchable by name)' })
  @ApiOkResponse({
    type: PaginatedEmployeesDto,
    description: 'Paginated list of non-deleted employees.',
  })
  findMany(@Query() query: QueryEmployeeDto): Promise<PaginatedEmployeesDto> {
    return this.employeesService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single employee by id' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiNotFoundResponse({ description: 'Employee not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<EmployeeResponseDto> {
    return this.employeesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create an employee with an optional photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: multipartEmployeeSchema([
      'name',
      'age',
      'designation',
      'hiringDate',
      'dateOfBirth',
      'salary',
    ]),
  })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @UseInterceptors(FileInterceptor('photo'))
  create(
    @Body() dto: CreateEmployeeDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.create(dto, file?.filename ?? null);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an employee (optionally replace photo)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'All fields optional; include a `photo` part to replace it.',
    schema: multipartEmployeeSchema([]),
  })
  @ApiOkResponse({ type: EmployeeResponseDto })
  @ApiNotFoundResponse({ description: 'Employee not found.' })
  @UseInterceptors(FileInterceptor('photo'))
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<EmployeeResponseDto> {
    return this.employeesService.update(id, dto, file?.filename ?? null);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete an employee' })
  @ApiOkResponse({ description: 'Employee soft-deleted.' })
  @ApiNotFoundResponse({ description: 'Employee not found.' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.employeesService.remove(id);
  }
}
