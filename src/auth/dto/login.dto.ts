import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

/** Credentials submitted to `POST /auth/login`. */
export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'HR user email' })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Admin@12345',
    minLength: 6,
    description: 'Account password',
  })
  @IsString()
  @MinLength(6)
  password: string;
}
