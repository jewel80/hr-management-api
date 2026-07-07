import type { JwtPayload } from './index';

/**
 * Module augmentation: attaches the decoded JWT payload to the Express
 * `Request` object so auth middleware and handlers can read `req.user` in a
 * type-safe way.
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}
