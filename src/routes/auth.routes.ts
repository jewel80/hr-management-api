import { Router } from 'express';
import type { AuthController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate';
import { loginSchema } from '../schemas/auth.schema';
import { asyncHandler } from '../utils/async-handler';

export const buildAuthRoutes = (controller: AuthController): Router => {
  const router = Router();
  router.post('/login', validate(loginSchema, 'body'), asyncHandler(controller.login));
  return router;
};
