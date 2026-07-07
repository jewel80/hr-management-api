/**
 * Decoded JWT payload placed onto the Express `Request` after a token is
 * verified by the Passport JWT strategy.
 */
export interface JwtPayload {
  /** id of the authenticated hr_users row ("sub" claim) */
  sub: string;
  /** email of the authenticated user */
  email: string;
  /** display name of the authenticated user */
  name: string;
}
