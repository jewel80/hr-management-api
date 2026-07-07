import { Router } from 'express';
import type { ReportsController } from '../controllers/reports.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { reportQuerySchema } from '../schemas/report.schema';
import { asyncHandler } from '../utils/async-handler';

export const buildReportsRoutes = (controller: ReportsController): Router => {
  const router = Router();
  router.use(authenticate);
  router.get(
    '/attendance',
    validate(reportQuerySchema, 'query'),
    asyncHandler(controller.attendance),
  );
  return router;
};
