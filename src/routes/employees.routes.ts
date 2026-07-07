import { Router } from 'express';
import type { EmployeesController } from '../controllers/employees.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate';
import { idParamSchema } from '../schemas/common.schema';
import {
  createEmployeeSchema,
  queryEmployeeSchema,
  updateEmployeeSchema,
} from '../schemas/employee.schema';
import { upload } from '../upload/multer';
import { asyncHandler } from '../utils/async-handler';

export const buildEmployeesRoutes = (controller: EmployeesController): Router => {
  const router = Router();
  router.use(authenticate);

  router.get('/', validate(queryEmployeeSchema, 'query'), asyncHandler(controller.list));
  router.get('/:id', validate(idParamSchema, 'params'), asyncHandler(controller.get));
  router.post(
    '/',
    upload.single('photo'),
    validate(createEmployeeSchema, 'body'),
    asyncHandler(controller.create),
  );
  router.put(
    '/:id',
    validate(idParamSchema, 'params'),
    upload.single('photo'),
    validate(updateEmployeeSchema, 'body'),
    asyncHandler(controller.update),
  );
  router.delete(
    '/:id',
    validate(idParamSchema, 'params'),
    asyncHandler(controller.remove),
  );

  return router;
};
