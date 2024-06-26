import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user.dto';
import { UsersService } from 'src/users/users.service';
import { AuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcryptjs';
import { TUser } from 'src/users/type/user.type';
import { JWT_ACCESS_EXPIRES, JWT_ACCESS_SECRET, JWT_REFRESH_EXPIRES, JWT_REFRESH_SECRET } from 'src/common/constant/auth.constant';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}
  async register(createUserDto: CreateUserDto): Promise<any> {
    const { email, name, password, refreshToken } = createUserDto;

    if (!email || !name || !password)
      throw new BadRequestException('Not fount email, name, password');

    const userExists = await this.usersService.findOne(email);
    if (userExists) throw new BadRequestException('User already exists');

    const hashPassword = await this.hashPassword(password);

    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashPassword,
    });

    // const tokens = await this.createTokens(newUser.id, newUser.name);
    // await this.updateRefreshToken(newUser.id, tokens.refreshToken);
    return newUser;
  }

  async login(data: AuthDto) {
    const { password, username } = data;
    if (!password || !username)
      throw new BadRequestException('Not fount password, username');

    const userExists = await this.usersService.findOne(username);
    if (!userExists) throw new BadRequestException('User not register');

    const isValid = this.isValidPassword(password, userExists.password);
    if (!isValid) throw new BadRequestException('Password is incorrect');

    const tokens = await this.createTokens(userExists);
    await this.updateRefreshToken(userExists.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: number) {
    if (typeof userId !== `number`)
      throw new BadRequestException('userId is not number');
    return this.usersService.updateById(userId, { refreshToken: null });
  }

  async updateRefreshToken(userId: number, refreshToken: string) {
    if (typeof userId !== `number`)
      throw new BadRequestException('userId is not number');
    await this.usersService.updateById(userId, {
      refreshToken: refreshToken,
    });
  }

  async createTokens(user: TUser) {
    const { id, email } = user;
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: id,
          email,
        },
        {
          secret: this.configService.get<string>(JWT_ACCESS_SECRET),
          expiresIn: this.configService.get<string>(JWT_ACCESS_EXPIRES),
        },
      ),
      this.jwtService.signAsync(
        {
          sub: id,
          email,
        },
        {
          secret: this.configService.get<string>(JWT_REFRESH_SECRET),
          expiresIn: this.configService.get<string>(JWT_REFRESH_EXPIRES),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async hashPassword(password: string) {
    const salt = await bcrypt.genSalt(2);
    return await bcrypt.hash(password, salt);
  }

  isValidPassword(password: string, hash: string) {
    return bcrypt.compareSync(password, hash);
  }

  async refreshTokens(user: any) {
    const tokens = await this.createTokens(user);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    return tokens;
  }
}
