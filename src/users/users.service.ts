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
import { User, UserRole } from './entities/user.entity';
import { UpdateUserPasswordDto } from './dto/update-user-password.dto';
@Injectable()
export class UsersService {
  private logger = new Logger('UsersService');
  constructor(
    @InjectRepository(UsersRepository)
    private usersRepository: UsersRepository,
  ) { }

  async onApplicationBootstrap() {
    // Seed initial user - not the cleanest but it works for now
    let users;
    try {
      users = await this.usersRepository.createQueryBuilder("user").getMany();
    } catch (error) {
      this.logger.error('Seeder: Error fetching users')
    }
    if (users.length === 0) {
      try {
        const createUserDto: CreateUserDto = {
          username: 'admin',
          password: 'adminadmin'
        }
        const user = await this.create(createUserDto);
        const updateUserDto: UpdateUserDto = {
          webhook: '',
          roles: [UserRole.ADMIN]
        }
        await this.adminUpdate(user.id, updateUserDto);
        this.logger.log('Created initial admin user');
      } catch (error) {
        this.logger.error('Seeder: Error creating initial user')
      }
    }
  }

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
    delete user.password
    return user
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

  async updatePassword(id: string, updateUserPasswordDto: UpdateUserPasswordDto, user: User) {
    if (id !== user.id) {
      throw new UnauthorizedException('You are not authorized to perform this action');
    }
    let dbUser;
    try {
      dbUser = await this.usersRepository.createQueryBuilder("user").where("user.id = :id", { id: user.id }).addSelect("user.password").getOne();
    } catch (error) {
      throw new NotFoundException('User not found');
    }
    // Compare hash with supplied old password

    const compare = await argon2.verify(dbUser.password, updateUserPasswordDto.old);
    if (!compare) {
      throw new UnauthorizedException('Password is incorrect');
    }

    if (updateUserPasswordDto.new === updateUserPasswordDto.old) {
      throw new UnauthorizedException('New password must be different from old password')
    }
    if (updateUserPasswordDto.new !== updateUserPasswordDto.confirm) {
      throw new UnauthorizedException('New password and confirm password must match')
    }
    // Hash new password
    let hash: string;
    try {
      hash = await argon2.hash(updateUserPasswordDto.new, {
        type: argon2.argon2id,
      });
    } catch (error) {
      this.logger.error('Error hashing password');
      throw new InternalServerErrorException('Error hashing new password');
    }
    dbUser.password = hash;
    try {
      await this.usersRepository.save(dbUser);
    } catch (error) {
      this.logger.error('Error updating user password', error)
      throw new InternalServerErrorException('Error updating user password');
    }
    return
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
