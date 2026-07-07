import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { HrUser } from '../database/entities/hr-user.entity';
import { LoginResponseDto } from './dto/login-response.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(HrUser) private readonly users: Repository<HrUser>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  /** Validates credentials and returns a signed JWT. */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.users.findOneBy({ email: dto.email });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const expiresIn = this.config.get<string>('jwt.expiresIn') ?? '1d';

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
