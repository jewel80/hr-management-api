import type { NextFunction, Request, Response } from 'express';
import type { LoginBody } from '../schemas/auth.schema';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/response';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  login = async (req: Request, res: Response, _next: NextFunction): Promise<void> => {
    const { email, password } = req.body as LoginBody;
    const result = await this.authService.login(email, password);
    sendSuccess(res, result);
  };
}
