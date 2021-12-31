import {
  ConflictException,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EntityRepository, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';

@EntityRepository(User)
export class UsersRepository extends Repository<User> {
  private logger = new Logger('UsersRepository');
  async createUser(username: string, passwordHash: string): Promise<User> {
    const user = this.create({
      username,
      password: passwordHash,
    });

    try {
      await this.save(user);
      this.logger.verbose(`User with username: ${username} has been created.`);
      return user;
    } catch (error) {
      if (error.code === '23505') {
        //duplicate username
        throw new ConflictException('Username already exists.');
      } else {
        this.logger.error(error);
        throw new InternalServerErrorException();
      }
    }
  }
  async findUser(username: string): Promise<User> {
    let user: User;
    try {
      user = await this.findOne({ username });
    } catch (error) {
      throw new NotFoundException();
    }
    return user;
  }
}
