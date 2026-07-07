import { resolve } from 'node:path';
import express from 'express';
import morgan from 'morgan';
import { AttendanceController } from './controllers/attendance.controller';
import { AuthController } from './controllers/auth.controller';
import { EmployeesController } from './controllers/employees.controller';
import { ReportsController } from './controllers/reports.controller';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import { notFound } from './middlewares/not-found.middleware';
import { buildRoutes } from './routes';
import { AttendanceService } from './services/attendance.service';
import { AuthService } from './services/auth.service';
import { EmployeesService } from './services/employees.service';
import { ReportsService } from './services/reports.service';

/** Builds and configures the Express application. */
export const createApp = (): express.Express => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  if (env.nodeEnv !== 'test') {
    app.use(morgan('dev'));
  }

  // Serve uploaded photos at /uploads/<filename>.
  app.use('/uploads', express.static(resolve(process.cwd(), env.uploadDir)));

  // Manual dependency wiring (OOP): services -> controllers -> routes.
  const controllers = {
    auth: new AuthController(new AuthService()),
    employees: new EmployeesController(new EmployeesService()),
    attendance: new AttendanceController(new AttendanceService()),
    reports: new ReportsController(new ReportsService()),
  };

  app.use(buildRoutes(controllers));

  // 404 + centralized error handling (must be registered last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
};
