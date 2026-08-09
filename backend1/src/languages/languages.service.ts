import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Language } from './language.entity';

@Injectable()
export class LanguagesService {
  constructor(
    @InjectRepository(Language)
    private repo: Repository<Language>,
  ) {}

  async findAllAndCount() {
    return this.repo.findAndCount({ order: { id: 'ASC' } });
  }

  async findOne(id: number) {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Language>) {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: number, data: Partial<Language>) {
    await this.repo.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number) {
    return this.repo.delete(id);
  }
}