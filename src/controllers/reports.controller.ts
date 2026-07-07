import type { Request, Response } from 'express';
import type { ReportQuery } from '../schemas/report.schema';
import { ReportsService } from '../services/reports.service';
import { sendSuccess } from '../utils/response';

export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  attendance = async (req: Request, res: Response): Promise<void> => {
    const { month, employee_id } = req.query as unknown as ReportQuery;
    const result = await this.reportsService.attendanceReport(month, employee_id);
    sendSuccess(res, result);
  };
}
