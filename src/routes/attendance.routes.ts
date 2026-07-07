import { Router } from 'express';
import type { AttendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { idParamSchema } from '../schemas/common.schema';
import {
  createAttendanceSchema,
  queryAttendanceSchema,
  updateAttendanceSchema,
} from '../schemas/attendance.schema';
import { asyncHandler } from '../utils/async-handler';

export const buildAttendanceRoutes = (controller: AttendanceController): Router => {
  const router = Router();
  router.use(authenticate);

  router.get(
    '/',
    validate(queryAttendanceSchema, 'query'),
    asyncHandler(controller.list),
  );
  router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.get));
  router.post(
    '/',
    validate(createAttendanceSchema, 'body'),
    asyncHandler(controller.create),
  );
  router.put(
    '/:id',
    validate(idParamSchema, 'params'),
    validate(updateAttendanceSchema, 'body'),
    asyncHandler(controller.update),
  );
  router.delete(
    '/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(controller.remove),
  );

  return router;
};
