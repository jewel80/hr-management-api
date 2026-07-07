import { Router } from 'express';
import type { AttendanceController } from '../controllers/attendance.controller';
import type { AuthController } from '../controllers/auth.controller';
import type { EmployeesController } from '../controllers/employees.controller';
import type { ReportsController } from '../controllers/reports.controller';
import { buildAttendanceRoutes } from './attendance.routes';
import { buildAuthRoutes } from './auth.routes';
import { buildEmployeesRoutes } from './employees.routes';
import { buildReportsRoutes } from './reports.routes';

export interface Controllers {
  auth: AuthController;
  employees: EmployeesController;
  attendance: AttendanceController;
  reports: ReportsController;
}

export const buildRoutes = (controllers: Controllers): Router => {
  const router = Router();
  router.use('/auth', buildAuthRoutes(controllers.auth));
  router.use('/employees', buildEmployeesRoutes(controllers.employees));
  router.use('/attendance', buildAttendanceRoutes(controllers.attendance));
  router.use('/reports', buildReportsRoutes(controllers.reports));
  return router;
};
