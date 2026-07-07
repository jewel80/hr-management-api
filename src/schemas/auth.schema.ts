import Joi from 'joi';

export interface LoginBody {
  email: string;
  password: string;
}

export const loginSchema = Joi.object<LoginBody>({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});
