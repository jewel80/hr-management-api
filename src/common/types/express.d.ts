import type { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Module augmentation: attaches the decoded JWT payload to the Express
 * `Request` object so controllers and guards can read `req.user` in a
 * type-safe way.
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}
