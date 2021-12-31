import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersRepository } from 'src/users/users.repository';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as argon2 from 'argon2';
import { JwtPayload } from './jwt-payload.interface';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
    private jwtService: JwtService,
  ) {}
  async login(authCredentialsDto: AuthCredentialsDto) {
    const { username, password } = authCredentialsDto;

    const user = await this.usersRepository.findUser(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const compare = await argon2.verify(user.password, password);
    if (!compare) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = { username: user.username, roles: user.roles };

    const accessToken = await this.generateAccessToken(payload);

    return {
      user: { id: user.id, username: user.username, roles: user.roles },
      accessToken,
    };
  }

  private async generateAccessToken(payload: JwtPayload): Promise<string> {
    const accessToken: string = await this.jwtService.sign(payload);
    return accessToken;
  }

  getMe(user: User) {
    return { user: user };
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }
}
