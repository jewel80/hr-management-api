import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

/**
 * Parameter decorator that resolves the authenticated user from the request.
 *
 * @example
 * getUser(@CurrentUser() user: JwtPayload) {}
 * // or a single field:
 * getUserId(@CurrentUser('sub') userId: string) {}
 */
export const CurrentUser = createParamDecorator(
  (data: keyof JwtPayload | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest<{ user?: JwtPayload }>();
    return data ? request.user?.[data] : request.user;
  },
);
