import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersRepository } from './users.repository';
import { User } from './entities/user.entity';
@Injectable()
export class UsersService {
  private logger = new Logger('UsersService');
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
  ) { }
  async create(createUserDto: CreateUserDto) {
    const { username, password } = createUserDto;
    let hash: string;

    try {
      hash = await argon2.hash(password, {
        type: argon2.argon2id,
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException(error);
    }

    const user = await this.usersRepository.createUser(username, hash);
    return user;
  }

  async findAll() {
    try {
      const users = this.usersRepository.createQueryBuilder('user').select(['user.id', 'user.username', 'user.roles', 'user.webhook', 'user.createdAt']).orderBy('user.createdAt', 'DESC')
      return await users.getMany();
    } catch (error) {
      throw new InternalServerErrorException('Error fetching users');
    }
  }

  async findOne(username: string) {
    let user;
    try {
      user = await this.usersRepository.findOneOrFail({ username: username });
      delete user.password
    } catch (error) {
      throw new NotFoundException('User not found');
    }
    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto, user: User) {
    if (id !== user.id) {
      throw new UnauthorizedException('You are not authorized to perform this action');
    }
    try {
      const findUser = await this.usersRepository.findOne(user.id);
      findUser.webhook = updateUserDto.webhook;
      await this.usersRepository.save(findUser);
      return { message: 'User updated successfully' };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error updaring user');
    }
  }

  async adminUpdate(id: string, updateUserDto: UpdateUserDto) {
    try {
      const findUser = await this.usersRepository.findOne(id);
      findUser.webhook = updateUserDto.webhook;
      findUser.roles = updateUserDto.roles;
      await this.usersRepository.save(findUser);
      return { message: 'User updated successfully' };
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error updaring user');
    }
  }

  async remove(id: string) {
    const findUser = await this.usersRepository.findOne(id);
    if (!findUser) {
      throw new NotFoundException('User not found');
    }
    try {
      await this.usersRepository.delete(findUser.id)
    } catch (error) {
      this.logger.error('Error deleting user', error);
      throw new InternalServerErrorException('Error deleting user');
    }
    return;
  }
}
