import { InjectRepository } from '@nestjs/typeorm';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../../common/interfaces/jwt-payload.interface';
import { HrUser } from '../../database/entities/hr-user.entity';

/** Shape of the JWT as it appears in the incoming token payload. */
export interface JwtTokenPayload {
  sub: string;
  email: string;
  name: string;
}

/**
 * Passport JWT strategy. Verifies the signature of each Bearer token and, on
 * success, re-checks that the referenced user still exists before placing the
 * payload onto `request.user`.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    @InjectRepository(HrUser) private readonly users: Repository<HrUser>,
  ) {
    const secret = config.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not configured. Set it in your .env file.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtTokenPayload): Promise<JwtPayload> {
    const user = await this.users.findOneBy({ id: payload.sub });

    if (!user) {
      throw new UnauthorizedException('Token references an unknown user.');
    }

    return { sub: user.id, email: user.email, name: user.name };
  }
}
