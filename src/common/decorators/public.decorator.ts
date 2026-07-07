import { SetMetadata } from '@nestjs/common';

/** Metadata key marking a route as public (skips the global JWT guard). */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a controller or handler as publicly accessible. The global
 * {@link JwtAuthGuard} skips authentication for any route decorated with this.
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
