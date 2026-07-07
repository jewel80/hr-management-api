import type { Request, Response } from 'express';
import type {
  AttendanceQuery,
  CreateAttendanceBody,
  UpdateAttendanceBody,
} from '../schemas/attendance.schema';
import { AttendanceService } from '../services/attendance.service';
import { sendSuccess } from '../utils/response';

export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  list = async (req: Request, res: Response): Promise<void> => {
    const query = req.query as unknown as AttendanceQuery;
    const result = await this.attendanceService.findMany(query);
    sendSuccess(res, result);
  };

  get = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as { id: string };
    const result = await this.attendanceService.findOne(Number(id));
    sendSuccess(res, result);
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const body = req.body as CreateAttendanceBody;
    const result = await this.attendanceService.create(body);
    sendSuccess(res, result, 201);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as { id: string };
    const body = req.body as UpdateAttendanceBody;
    const result = await this.attendanceService.update(Number(id), body);
    sendSuccess(res, result);
  };

  remove = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as unknown as { id: string };
    await this.attendanceService.remove(Number(id));
    sendSuccess(res, null);
  };
}
