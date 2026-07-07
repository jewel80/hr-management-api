import type { Request, Response } from 'express';
import type {
  CreateEmployeeBody,
  EmployeeQuery,
  UpdateEmployeeBody,
} from '../schemas/employee.schema';
import { EmployeesService } from '../services/employees.service';
import { sendSuccess } from '../utils/response';

export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as EmployeeQuery;
    const result = await this.employeesService.findMany(query);
    sendSuccess(res, result);
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as { id: string };
    const result = await this.employeesService.findOne(Number(id));
    sendSuccess(res, result);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateEmployeeBody;
    const photoPath = req.file?.filename ?? null;
    const result = await this.employeesService.create(body, photoPath);
    sendSuccess(res, result, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as { id: string };
    const body = req.body as UpdateEmployeeBody;
    const photoPath = req.file?.filename ?? null;
    const result = await this.employeesService.update(Number(id), body, photoPath);
    sendSuccess(res, result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as { id: string };
    await this.employeesService.remove(Number(id));
    sendSuccess(res, null);
  };
}
