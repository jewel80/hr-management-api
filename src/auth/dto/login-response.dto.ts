import { ApiProperty } from '@nestjs/swagger';

/** Authenticated user details embedded in the login response. */
export class LoginResponseUserDto {
  @ApiProperty({ example: 'c1b8...' })
  id: string;

  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiProperty({ example: 'System Admin' })
  name: string;
}

/** Response body for a successful `POST /auth/login`. */
export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;

  @ApiProperty({ example: '1d', description: 'Token lifetime expression' })
  expiresIn: string;

  @ApiProperty({ type: LoginResponseUserDto })
  user: LoginResponseUserDto;
}
