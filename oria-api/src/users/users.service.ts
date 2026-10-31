import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  buscarPorEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ email });
  }

  buscarPorId(id: string): Promise<User | null> {
    return this.usersRepository.findOneBy({ id });
  }

  async criar(dados: {
    nome: string;
    email: string;
    senhaHash: string;
  }): Promise<User> {
    const usuario = this.usersRepository.create(dados);
    return this.usersRepository.save(usuario);
  }
}
