import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { TUserPayloadToken } from 'src/users/type/user.type';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: TUserPayloadToken) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) throw new BadRequestException('User not found');

    const [type, refreshTokenInHeaders] =
      req.headers.authorization?.split(' ') ?? [];

    if (refreshTokenInHeaders !== user.refreshToken)
      throw new BadRequestException('Please re login');

    return user;
  }
}
