import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { env } from '../config/env';
import { db } from '../db/knex';
import { unauthorized } from '../errors/AppError';
import type { HrUserRow, LoginResult } from '../types';

export class AuthService {
  /** Validates credentials and returns a signed JWT. */
  async login(email: string, password: string): Promise<LoginResult> {
    const user = await db<HrUserRow>('hr_users').where({ email }).first();

    if (!user) {
      throw unauthorized('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      throw unauthorized('Invalid email or password.');
    }

    const accessToken = jwt.sign(
      { sub: user.id, email: user.email, name: user.name },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn as StringValue },
    );

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: env.jwtExpiresIn,
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
