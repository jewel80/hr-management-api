import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from '../errors/AppError';

interface DecodedToken {
  sub?: unknown;
  email?: unknown;
  name?: unknown;
}

/**
 * Express JWT middleware. Verifies a `Bearer` token from the Authorization
 * header and attaches the decoded payload to `req.user`. Rejects with 401
 * otherwise.
 */
export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(unauthorized('Missing or malformed Authorization header.'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as unknown as DecodedToken;
    if (
      typeof decoded.sub !== 'number' ||
      typeof decoded.email !== 'string' ||
      typeof decoded.name !== 'string'
    ) {
      next(unauthorized('Invalid or expired token.'));
      return;
    }
    req.user = { sub: decoded.sub, email: decoded.email, name: decoded.name };
    next();
  } catch {
    next(unauthorized('Invalid or expired token.'));
  }
};
